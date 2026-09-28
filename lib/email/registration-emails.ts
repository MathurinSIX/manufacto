import { getParticipantCount } from "@/lib/participant-count";
import {
  addParisCalendarDays,
  formatParisDate,
  parseParisDateTime,
} from "@/lib/paris-time";
import { formatSessionDate, formatSessionTime } from "@/lib/email/format-session";
import { loadEmailTemplate } from "@/lib/email/load-email-template";
import { renderTemplate } from "@/lib/email/render-template";
import { sendEmail } from "@/lib/email/resend";
import type {
  EmailTemplateKey,
  RegistrationEmailVariables,
} from "@/lib/email/types";
import { getAdminClient, getSiteUrl } from "@/lib/square/server";
import {
  formatSeriesSchedule,
  listSeriesSessions,
} from "@/lib/course-session-series";

type RegistrationStatusRow = {
  registration_id: string;
  status: string;
  created_at: string;
};

type RegistrationDetails = {
  id: string;
  user_id: string;
  participant_count: number | null;
  participant_names: string[];
  participant_emails: string[];
  reserved_start_ts: string | null;
  reserved_end_ts: string | null;
  session: {
    start_ts: string;
    end_ts: string | null;
    activity: { name: string; type: string | null } | { name: string; type: string | null }[] | null;
  } | null;
  seriesSchedule: string | null;
};

function activityFromRow(
  activity:
    | { name: string; type: string | null }
    | { name: string; type: string | null }[]
    | null
    | undefined,
) {
  if (Array.isArray(activity)) return activity[0] ?? null;
  return activity ?? null;
}

function getUserDisplayName(user?: {
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}) {
  const firstName = user?.user_metadata?.first_name?.trim();
  const lastName = user?.user_metadata?.last_name?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || lastName || user?.email || "Participant";
}

function getActiveRegistrationIds(
  registrationIds: string[],
  statuses?: RegistrationStatusRow[] | null,
) {
  if (!registrationIds.length) {
    return new Set<string>();
  }

  if (!statuses?.length) {
    return new Set(registrationIds);
  }

  const seen = new Set<string>();
  const active = new Set<string>();

  statuses.forEach((status) => {
    if (seen.has(status.registration_id)) return;
    seen.add(status.registration_id);
    if (status.status !== "CANCELLED") {
      active.add(status.registration_id);
    }
  });

  registrationIds.forEach((id) => {
    if (!seen.has(id)) {
      active.add(id);
    }
  });

  return active;
}

async function loadRegistrationDetails(
  registrationId: string,
): Promise<RegistrationDetails | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("registration")
    .select(
      "id, user_id, participant_count, participant_names, participant_emails, reserved_start_ts, reserved_end_ts, session:session_id(id, start_ts, end_ts, session_group_id, activity:activity_id(name, type))",
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (error || !data) {
    console.error("Error loading registration for email:", error);
    return null;
  }

  const sessionRow = Array.isArray(data.session) ? data.session[0] : data.session;
  let seriesSchedule: string | null = null;
  if (sessionRow?.session_group_id) {
    const grouped = await listSeriesSessions(supabase, sessionRow.session_group_id);
    if (!grouped.error && grouped.sessions.length > 1) {
      seriesSchedule = formatSeriesSchedule(grouped.sessions);
    }
  }

  return {
    id: data.id,
    user_id: data.user_id,
    participant_count: data.participant_count,
    participant_names: Array.isArray(data.participant_names)
      ? data.participant_names.filter((name: unknown): name is string => typeof name === "string")
      : [],
    participant_emails: Array.isArray(data.participant_emails)
      ? data.participant_emails.filter((email: unknown): email is string => typeof email === "string")
      : [],
    reserved_start_ts: data.reserved_start_ts ?? null,
    reserved_end_ts: data.reserved_end_ts ?? null,
    seriesSchedule,
    session: sessionRow
      ? {
          start_ts: sessionRow.start_ts,
          end_ts: sessionRow.end_ts ?? null,
          activity: sessionRow.activity,
        }
      : null,
  };
}

function buildRegistrationVariables(
  registration: RegistrationDetails,
  userName: string,
): RegistrationEmailVariables | null {
  const session = registration.session;
  const activity = activityFromRow(session?.activity ?? null);

  if (!session || !activity || activity.type !== "cours") {
    return null;
  }

  const siteUrl = getSiteUrl();

  return {
    user_name: userName,
    activity_name: activity.name,
    session_date: registration.seriesSchedule ?? formatSessionDate(session.start_ts),
    session_time: formatSessionTime(session.start_ts),
    participant_count: String(getParticipantCount(registration)),
    account_url: `${siteUrl}/account`,
  };
}

async function hasEmailBeenSent(
  registrationId: string,
  emailType: "confirmation" | "reminder",
) {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("registration_email_log")
    .select("id")
    .eq("registration_id", registrationId)
    .eq("email_type", emailType)
    .maybeSingle();

  return Boolean(data);
}

async function logEmailSent(
  registrationId: string,
  emailType: "confirmation" | "reminder",
) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("registration_email_log").insert({
    registration_id: registrationId,
    email_type: emailType,
  });

  if (error) {
    console.error(`Error logging ${emailType} email:`, error);
  }
}

async function sendRegistrationEmail({
  registrationId,
  templateKey,
  emailType,
}: {
  registrationId: string;
  templateKey: EmailTemplateKey;
  emailType: "confirmation" | "reminder";
}) {
  if (await hasEmailBeenSent(registrationId, emailType)) {
    return { ok: true as const, skipped: true as const };
  }

  const registration = await loadRegistrationDetails(registrationId);
  if (!registration) {
    return { ok: false as const, skipped: false as const, error: "Registration not found" };
  }

  const supabase = getAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
    registration.user_id,
  );

  if (authError || !authData.user?.email) {
    console.error("Error loading user email for registration:", authError);
    return { ok: false as const, skipped: false as const, error: "User email not found" };
  }

  const variables = buildRegistrationVariables(
    registration,
    getUserDisplayName(authData.user),
  );
  const accountEmail = authData.user.email.trim().toLowerCase();

  if (variables) {
    const template = await loadEmailTemplate(templateKey);
    const rendered = renderTemplate(template, variables);
    const result = await sendEmail({
      to: accountEmail,
      subject: rendered.subject,
      html: rendered.html,
    });

    if (!result.ok) {
      return { ok: false as const, skipped: false as const, error: result.error };
    }
  } else {
    const notice = buildParticipantNotice(registration, getUserDisplayName(authData.user));
    if (notice) {
      const result = await sendEmail({
        to: accountEmail,
        subject: notice.subject,
        html: notice.html,
      });
      if (!result.ok) {
        return { ok: false as const, skipped: false as const, error: result.error };
      }
    }
  }

  await sendAdditionalParticipantEmails(registration, accountEmail);
  await logEmailSent(registrationId, emailType);
  return { ok: true as const, skipped: false as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildParticipantNotice(
  registration: RegistrationDetails,
  recipientName: string,
) {
  const session = registration.session;
  const activity = activityFromRow(session?.activity ?? null);
  if (!session || !activity) return null;

  const start = registration.reserved_start_ts ?? session.start_ts;
  const whenLabel =
    registration.seriesSchedule ??
    `${formatSessionDate(start)} à ${formatSessionTime(start)}`;
  const safeName = escapeHtml(recipientName.trim() || "Bonjour");
  const safeActivity = escapeHtml(activity.name);

  return {
    subject: `Votre place — ${activity.name}`,
    html: `<p>Bonjour ${safeName},</p>
<p>Une place est réservée pour vous à <strong>${safeActivity}</strong>, le ${escapeHtml(whenLabel)}.</p>
<p>À bientôt à l'atelier Manufacto.</p>`,
  };
}

async function sendAdditionalParticipantEmails(
  registration: RegistrationDetails,
  accountEmail: string,
) {
  const seen = new Set<string>([accountEmail]);

  for (const [index, rawEmail] of registration.participant_emails.entries()) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const notice = buildParticipantNotice(
      registration,
      registration.participant_names[index] ?? "",
    );
    if (!notice) continue;
    const result = await sendEmail({
      to: email,
      subject: notice.subject,
      html: notice.html,
    });
    if (!result.ok) {
      console.error("Error emailing participant:", email, result.error);
    }
  }
}

export async function notifyRegistrationConfirmed(registrationId: string) {
  return sendRegistrationEmail({
    registrationId,
    templateKey: "registration_confirmation",
    emailType: "confirmation",
  });
}

export async function sendRegistrationReminders() {
  const supabase = getAdminClient();
  const todayParis = formatParisDate(new Date());
  const tomorrowParis = addParisCalendarDays(todayParis, 1);
  const windowStart = parseParisDateTime(tomorrowParis, "00:00").toISOString();
  const windowEnd = parseParisDateTime(addParisCalendarDays(tomorrowParis, 1), "00:00").toISOString();

  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select("id, activity:activity_id(type)")
    .gte("start_ts", windowStart)
    .lt("start_ts", windowEnd);

  if (sessionsError) {
    return { sent: 0, skipped: 0, errors: [sessionsError.message] };
  }

  const courseSessionIds =
    sessions
      ?.filter((session) => {
        const activity = activityFromRow(
          session.activity as
            | { name: string; type: string | null }
            | { name: string; type: string | null }[]
            | null,
        );
        return activity?.type === "cours";
      })
      .map((session) => session.id) ?? [];

  if (!courseSessionIds.length) {
    return { sent: 0, skipped: 0, errors: [] as string[] };
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id")
    .in("session_id", courseSessionIds);

  if (registrationsError) {
    return { sent: 0, skipped: 0, errors: [registrationsError.message] };
  }

  const registrationIds = registrations?.map((row) => row.id) ?? [];
  if (!registrationIds.length) {
    return { sent: 0, skipped: 0, errors: [] as string[] };
  }

  const { data: statuses, error: statusesError } = await supabase
    .from("registration_status")
    .select("registration_id, status, created_at")
    .in("registration_id", registrationIds)
    .order("created_at", { ascending: false });

  if (statusesError) {
    return { sent: 0, skipped: 0, errors: [statusesError.message] };
  }

  const activeRegistrationIds = getActiveRegistrationIds(registrationIds, statuses);
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const registrationId of activeRegistrationIds) {
    const result = await sendRegistrationEmail({
      registrationId,
      templateKey: "registration_reminder",
      emailType: "reminder",
    });

    if (result.ok && result.skipped) {
      skipped += 1;
    } else if (result.ok) {
      sent += 1;
    } else if ("error" in result && result.error) {
      errors.push(`${registrationId}: ${result.error}`);
    }
  }

  return { sent, skipped, errors };
}
