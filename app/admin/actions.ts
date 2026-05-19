"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { readdir } from "fs/promises";
import path from "path";
import { listSquareCatalogVariations } from "@/lib/square/catalog-api";
import {
  DEFAULT_SQUARE_PRODUCTS,
  type SquareProduct,
  type SquareProductKind,
} from "@/lib/square/products";
import {
  getSquareEnvironment,
  getSquareEnvironmentLabel,
} from "@/lib/square/environment";
import {
  addParisCalendarDays,
  formatParisDate,
  getParisMondayDate,
  parseParisDateTime,
} from "@/lib/paris-time";
const ASSET_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ACTIVITY_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

type FrontendAssetImage = {
  path: string;
  label: string;
};

// Create admin client for admin operations
function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function listAssetImages(directory: string, publicPath: string): Promise<FrontendAssetImage[]> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const nestedImages = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      const assetPath = `${publicPath}/${entry.name}`;

      if (entry.isDirectory()) {
        return listAssetImages(fullPath, assetPath);
      }

      if (entry.isFile() && ASSET_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        return [
          {
            path: assetPath,
            label: assetPath.replace(/^\/assets\//, ""),
          },
        ];
      }

      return [];
    })
  );

  return nestedImages.flat().sort((a, b) => a.label.localeCompare(b.label));
}

async function countAdminUsers(adminClient: ReturnType<typeof getAdminClient>) {
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) {
    return { error: error.message, count: 0 };
  }
  let count = 0;
  for (const u of data.users) {
    if (u.app_metadata?.role === "admin") count++;
  }
  return { count, error: null };
}

// Check if user is admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  
  return user;
}

// Get visit activities, sessions, and public name/phone signups
export async function getVisitManagementData() {
  await checkAdmin();
  const supabase = await createClient();

  const { data: activities, error: activitiesError } = await supabase
    .from("activity")
    .select("id, name, nb_credits, type, price, description")
    .eq("type", "visite")
    .is("deleted_at", null)
    .order("name");

  if (activitiesError) {
    return {
      error: activitiesError.message,
      activities: [],
      sessions: [],
    };
  }

  const activityIds = activities?.map((activity) => activity.id) ?? [];

  if (!activityIds.length) {
    return {
      error: null,
      activities: [],
      sessions: [],
    };
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select("id, activity_id, start_ts, end_ts, max_registrations")
    .in("activity_id", activityIds)
    .gte("start_ts", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("start_ts", { ascending: true });

  if (sessionsError) {
    return {
      error: sessionsError.message,
      activities: activities ?? [],
      sessions: [],
    };
  }

  const sessionIds = sessions?.map((session) => session.id) ?? [];
  const { data: subscriptions, error: subscriptionsError } = sessionIds.length
    ? await supabase
        .from("public_session_subscription")
        .select("id, session_id, name, phone, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (subscriptionsError) {
    return {
      error: subscriptionsError.message,
      activities: activities ?? [],
      sessions: [],
    };
  }

  const activityById = new Map(
    (activities ?? []).map((activity) => [activity.id, activity]),
  );

  const sessionsWithSubscriptions = (sessions ?? []).map((session) => {
    const activity = activityById.get(session.activity_id);
    return {
      ...session,
      activity_name: activity?.name ?? "Visite de l'atelier",
      subscriptions:
        subscriptions?.filter(
          (subscription) => subscription.session_id === session.id,
        ) ?? [],
    };
  });

  return {
    error: null,
    activities: activities ?? [],
    sessions: sessionsWithSubscriptions,
  };
}

export async function deletePublicSessionSubscription(subscriptionId: string) {
  await checkAdmin();
  const adminClient = getAdminClient();

  const { error } = await adminClient
    .from("public_session_subscription")
    .delete()
    .eq("id", subscriptionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function getNewsletterSubscriptions() {
  await checkAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newsletter_subscription")
    .select(
      "id, name, email, wants_monthly_calendar, unsubscribe_token, unsubscribed_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, subscriptions: [] };
  }

  return { error: null, subscriptions: data ?? [] };
}

export async function getFrontendAssetImages() {
  await checkAdmin();

  const images = await listAssetImages(
    path.join(process.cwd(), "public", "assets"),
    "/assets"
  );

  return { error: null, images };
}

const ACTIVITY_IMAGES_BUCKET = "activity-images";

export async function uploadActivityImage(formData: FormData) {
  await checkAdmin();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Une image est requise", path: null };
  }

  if (!ACTIVITY_IMAGE_MIME_TYPES.has(file.type)) {
    return { error: "Le fichier doit être une image JPG, PNG, WebP ou GIF", path: null };
  }

  const extension = path.extname(file.name).toLowerCase() || ".jpg";
  if (!ASSET_IMAGE_EXTENSIONS.has(extension)) {
    return { error: "L'extension de l'image n'est pas supportée", path: null };
  }

  const safeBaseName =
    path
      .basename(file.name, extension)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "activity";
  const filename = `${Date.now()}-${safeBaseName}${extension}`;
  const storagePath = `activities/${filename}`;

  try {
    const adminClient = getAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from(ACTIVITY_IMAGES_BUCKET)
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message, path: null };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(ACTIVITY_IMAGES_BUCKET).getPublicUrl(storagePath);

    return {
      error: null,
      path: publicUrl,
    };
  } catch (err) {
    console.error("Error uploading activity image:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "L'image n'a pas pu être téléversée",
      path: null,
    };
  }
}

export async function unsubscribeNewsletterSubscription(subscriptionId: string) {
  await checkAdmin();
  const adminClient = getAdminClient();

  const { error } = await adminClient
    .from("newsletter_subscription")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriptionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { error: null };
}

// Get all users
export async function getAllUsers() {
  const currentUser = await checkAdmin();
  const adminClient = getAdminClient();
  const supabase = await createClient();
  
  const { data, error } = await adminClient.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    return { error: error.message, users: [] };
  }
  
  // Get credits for all users
  const userIds = data.users?.map(u => u.id) || [];
  const creditsMap: Record<string, number> = {};
  
  if (userIds.length > 0) {
    const { data: creditsData } = await supabase
      .from("credit")
      .select("user_id, amount")
      .in("user_id", userIds);
    
    if (creditsData) {
      creditsData.forEach((credit) => {
        const userId = credit.user_id;
        const amount = typeof credit.amount === "number" 
          ? credit.amount 
          : parseFloat(String(credit.amount)) || 0;
        
        if (!creditsMap[userId]) {
          creditsMap[userId] = 0;
        }
        creditsMap[userId] += amount;
      });
    }
  }
  
  // Add credits to each user
  const usersWithCredits = data.users?.map(user => ({
    ...user,
    credits: creditsMap[user.id] || 0,
  })) || [];
  
  return {
    users: usersWithCredits,
    currentUserId: currentUser.id,
    error: null,
  };
}

// Update a user profile
export async function updateUser(
  userId: string,
  data: {
    email: string;
    first_name?: string;
    last_name?: string;
  },
) {
  await checkAdmin();
  const adminClient = getAdminClient();

  const email = data.email.trim();
  if (!email) {
    return { error: "L'email est requis", user: null };
  }

  const { data: existing, error: fetchError } =
    await adminClient.auth.admin.getUserById(userId);

  if (fetchError || !existing.user) {
    return {
      error: fetchError?.message ?? "Utilisateur introuvable",
      user: null,
    };
  }

  const user_metadata = {
    ...existing.user.user_metadata,
    first_name: data.first_name?.trim() || undefined,
    last_name: data.last_name?.trim() || undefined,
  };

  const { data: updated, error } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      email,
      user_metadata,
    },
  );

  if (error) {
    console.error("Error updating user:", error);
    return { error: error.message, user: null };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/users/${userId}`);
  return { user: updated.user, error: null };
}

// Delete a user
export async function deleteUser(userId: string) {
  const currentUser = await checkAdmin();
  const adminClient = getAdminClient();

  if (currentUser.id === userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte" };
  }

  const { data: target, error: fetchError } =
    await adminClient.auth.admin.getUserById(userId);

  if (fetchError || !target.user) {
    return { error: fetchError?.message ?? "Utilisateur introuvable" };
  }

  if (target.user.app_metadata?.role === "admin") {
    const { count: adminCount, error: countError } =
      await countAdminUsers(adminClient);

    if (countError) {
      return { error: countError };
    }

    if (adminCount <= 1) {
      return { error: "Impossible de supprimer le dernier administrateur" };
    }
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { error: null };
}

// Add credit to a user
export async function addCreditToUser(userId: string, amount: number, paymentType?: string) {
  await checkAdmin();
  const supabase = await createClient();
  
  if (amount <= 0) {
    return { error: "Le montant doit être supérieur à 0", credit: null };
  }
  
  if (!paymentType) {
    return { error: "Le type de paiement est requis", credit: null };
  }
  
  const { data, error } = await supabase
    .from("credit")
    .insert({
      user_id: userId,
      amount: amount,
      payment_type: paymentType,
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Error adding credit:", error);
    return { error: error.message, credit: null };
  }
  
  if (!data) {
    return { error: "Failed to add credit", credit: null };
  }
  
  revalidatePath("/admin");
  return { credit: data, error: null };
}

// Make a user admin
export async function makeUserAdmin(userId: string) {
  await checkAdmin();
  const adminClient = getAdminClient();
  
  const { data, error } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        role: "admin",
      },
    }
  );
  
  if (error) {
    console.error("Error making user admin:", error);
    return { error: error.message, user: null };
  }
  
  revalidatePath("/admin");
  return { user: data.user, error: null };
}

// Remove admin role from a user
export async function removeUserAdmin(userId: string) {
  await checkAdmin();
  const adminClient = getAdminClient();
  
  const { data, error } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        role: null,
      },
    }
  );
  
  if (error) {
    console.error("Error removing admin role:", error);
    return { error: error.message, user: null };
  }
  
  revalidatePath("/admin");
  return { user: data.user, error: null };
}

// Create a new user
export async function createUser(email: string, metadata?: { first_name?: string; last_name?: string }) {
  await checkAdmin();
  const adminClient = getAdminClient();
  
  // Create user without password - they will receive an invitation email to set their password
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: false, // They need to confirm via invitation
    user_metadata: metadata,
  });
  
  if (error) {
    console.error("Error creating user:", error);
    return { error: error.message, user: null };
  }
  
  // Send invitation email to the user so they can set their password
  if (data.user) {
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
    
    if (inviteError) {
      console.error("Error sending invitation:", inviteError);
      // User is created but invitation failed - still return success
    }
  }
  
  revalidatePath("/admin");
  return { user: data.user, error: null };
}

// Get all activities with sessions
export async function getAllActivitiesWithSessions() {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data: activities, error: activitiesError } = await supabase
    .from("activity")
    .select("id, name, nb_credits, type, discipline, square_product_id, deleted_at")
    .order("name");
  
  if (activitiesError) {
    return { error: activitiesError.message, activities: [] };
  }
  
  // Get all sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, activity_id, max_registrations")
    .order("start_ts");
  
  if (sessionsError) {
    return { error: sessionsError.message, activities: [] };
  }
  
  // Get all registrations
  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id, user_id, session_id, reserved_start_ts, reserved_end_ts");
  
  if (registrationsError) {
    return { error: registrationsError.message, activities: [] };
  }

  const { data: publicSubscriptions, error: publicSubscriptionsError } =
    await supabase
      .from("public_session_subscription")
      .select("id, session_id, name, phone, created_at")
      .order("created_at", { ascending: true });

  if (publicSubscriptionsError) {
    return { error: publicSubscriptionsError.message, activities: [] };
  }
  
  // Get all registration statuses to filter out cancelled ones
  const registrationIds = registrations?.map(r => r.id) || [];
  const activeRegistrationIds = new Set<string>();
  
  if (registrationIds.length > 0) {
    const { data: statuses } = await supabase
      .from("registration_status")
      .select("registration_id, status, created_at")
      .in("registration_id", registrationIds)
      .order("created_at", { ascending: false });
    
    if (statuses) {
      // Get the latest status for each registration
      const seenRegistrations = new Set<string>();
      for (const status of statuses) {
        if (!seenRegistrations.has(status.registration_id)) {
          seenRegistrations.add(status.registration_id);
          // Only include non-cancelled registrations
          if (status.status !== "CANCELLED") {
            activeRegistrationIds.add(status.registration_id);
          }
        }
      }
      
      // Also include registrations that don't have any status (new registrations)
      for (const id of registrationIds) {
        if (!seenRegistrations.has(id)) {
          activeRegistrationIds.add(id);
        }
      }
    } else {
      // If no statuses, include all registrations
      for (const id of registrationIds) {
        activeRegistrationIds.add(id);
      }
    }
  }
  
  // Get user details for registrations
  const adminClient = getAdminClient();
  const { data: usersData } = await adminClient.auth.admin.listUsers();
  const usersMap = new Map(usersData?.users?.map(u => [u.id, u] as [string, typeof u]) || []);
  
  // Group sessions by activity and date
  const activitiesWithSessions = activities?.map(activity => {
    const activitySessions = sessions?.filter(s => s.activity_id === activity.id) || [];
    
    // Group by date
    const sessionsByDate: Record<string, typeof activitySessions> = {};
    activitySessions.forEach(session => {
      const dateKey = formatParisDate(new Date(session.start_ts));
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    });
    
    // Add registrations to each session (only non-cancelled)
    const sessionsWithRegistrations = Object.entries(sessionsByDate).map(([date, dateSessions]) => {
      const sessionsWithRegs = dateSessions.map(session => {
        const sessionRegistrations = registrations?.filter(r => 
          r.session_id === session.id && activeRegistrationIds.has(r.id)
        ) || [];
        const registeredUsers = sessionRegistrations.map(reg => {
          const user = usersMap.get(reg.user_id);
          return {
            registrationId: reg.id,
            userId: reg.user_id,
            email: user?.email || "Unknown",
            name: user?.user_metadata?.first_name && user?.user_metadata?.last_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
              : user?.email || "Unknown",
            reservedStartTs: reg.reserved_start_ts,
            reservedEndTs: reg.reserved_end_ts,
          };
        });
        const publicRegisteredUsers = (publicSubscriptions ?? [])
          .filter((subscription) => subscription.session_id === session.id)
          .map((subscription) => ({
            id: subscription.id,
            name: subscription.name,
            phone: subscription.phone,
            createdAt: subscription.created_at,
          }));
        
        return {
          ...session,
          registeredUsers,
          publicRegisteredUsers,
          max_registrations: session.max_registrations ?? null,
          activity_name: activity.name,
          activity_type: activity.type,
        };
      });
      
      return {
        date,
        sessions: sessionsWithRegs,
      };
    });
    
    return {
      ...activity,
      sessionsByDate: sessionsWithRegistrations,
    };
  }).filter((activity) =>
    !activity.deleted_at ||
    activity.sessionsByDate.some((day) => day.sessions.length > 0),
  ) || [];
  
  return { activities: activitiesWithSessions, error: null };
}

// Add user to activity session
export async function addUserToSession(sessionId: string, userId: string, paymentType: string) {
  await checkAdmin();
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, activity:activity_id(type)")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return { error: sessionError?.message ?? "Session introuvable", registration: null };
  }

  const activity = Array.isArray(session.activity)
    ? session.activity[0]
    : session.activity;
  const isPracticeActivity = PRACTICE_ACTIVITY_TYPES.has(activity?.type ?? "");
  
  // Check if registration already exists
  const { data: existing } = await supabase
    .from("registration")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (existing) {
    return { error: "User already registered for this session", registration: null };
  }
  
  if (!paymentType) {
    return { error: "Le type de paiement est requis", registration: null };
  }
  
  const { data, error } = await supabase
    .from("registration")
    .insert({
      session_id: sessionId,
      user_id: userId,
      payment_type: paymentType,
      reserved_start_ts: isPracticeActivity ? session.start_ts : null,
      reserved_end_ts: isPracticeActivity ? session.end_ts : null,
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Error adding user to session:", error);
    return { error: error.message, registration: null };
  }
  
  if (!data) {
    return { error: "Failed to create registration", registration: null };
  }
  
  // Create initial registration status
  await supabase
    .from("registration_status")
    .insert({
      registration_id: data.id,
      status: "CONFIRMED",
    });
  
  revalidatePath("/admin");
  return { registration: data, error: null };
}

// Remove user from activity session
export async function removeUserFromSession(registrationId: string) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Cancel the registration by adding a CANCELLED status
  const { error } = await supabase
    .from("registration_status")
    .insert({
      registration_id: registrationId,
      status: "CANCELLED",
    });
  
  if (error) {
    console.error("Error removing user from session:", error);
    return { error: error.message };
  }
  
  revalidatePath("/admin");
  return { error: null };
}

// Get sessions from previous week for batch creation
export async function getPreviousWeekSessions(activityId: string, weekOffset: number = -1) {
  await checkAdmin();
  const supabase = await createClient();
  
  const weekMonday = addParisCalendarDays(getParisMondayDate(), weekOffset);
  const weekStart = parseParisDateTime(weekMonday, "00:00");
  const weekEnd = parseParisDateTime(addParisCalendarDays(weekMonday, 7), "00:00");

  const { data: sessions, error } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, activity_id, max_registrations")
    .eq("activity_id", activityId)
    .gte("start_ts", weekStart.toISOString())
    .lt("start_ts", weekEnd.toISOString())
    .order("start_ts");
  
  if (error) {
    return { error: error.message, sessions: [] };
  }
  
  return { sessions: sessions || [], error: null };
}

// Create a single session
export async function createSession(
  activityId: string,
  start_ts: string,
  end_ts: string,
  max_registrations: number | null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("session")
    .insert({
      activity_id: activityId,
      start_ts,
      end_ts,
      max_registrations,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating session:", error);
    return { error: error.message, session: null };
  }
  
  revalidatePath("/admin");
  return { session: data, error: null };
}

// Create activities by batch based on previous week
export async function createActivitiesBatch(activityId: string, weekOffset: number = -1, targetWeekOffset: number = 0) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Get sessions from selected week
  const { sessions, error: fetchError } = await getPreviousWeekSessions(activityId, weekOffset);
  
  if (fetchError || !sessions || sessions.length === 0) {
    return { error: "No sessions found in selected week to duplicate", created: 0 };
  }
  
  // Calculate how many weeks ahead to create the new sessions
  // targetWeekOffset - weekOffset gives us the difference
  const weeksAhead = targetWeekOffset - weekOffset;
  
  // Create new sessions the specified number of weeks later
  const newSessions = sessions.map(session => {
    const oldStart = new Date(session.start_ts);
    const oldEnd = new Date(session.end_ts);
    const weekInMs = weeksAhead * 7 * 24 * 60 * 60 * 1000;
    
    return {
      activity_id: activityId,
      start_ts: new Date(oldStart.getTime() + weekInMs).toISOString(),
      end_ts: new Date(oldEnd.getTime() + weekInMs).toISOString(),
      max_registrations: session.max_registrations,
    };
  });
  
  const { data, error } = await supabase
    .from("session")
    .insert(newSessions)
    .select();
  
  if (error) {
    console.error("Error creating batch sessions:", error);
    return { error: error.message, created: 0 };
  }
  
  revalidatePath("/admin");
  return { created: data?.length || 0, error: null };
}

// Get all activities
export async function getAllActivities() {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data: activities, error } = await supabase
    .from("activity")
    .select("id, name, nb_credits, type, price, description, image_url, square_product_id, level, audience, discipline")
    .is("deleted_at", null)
    .order("type, name");
  
  if (error) {
    console.error("Error fetching activities:", error);
    return { error: error.message, activities: [] };
  }
  
  return { activities: activities || [], error: null };
}

export async function updateActivityCredits(id: string, nb_credits: number | null) {
  await checkAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .update({ nb_credits })
    .eq("id", id)
    .select("id, name, nb_credits, type");

  if (error) {
    console.error("Error updating activity credits:", error);
    return { error: error.message, activity: null };
  }

  if (!data || data.length === 0) {
    return { error: "Activity not found", activity: null };
  }

  revalidatePath("/admin");
  revalidatePath("/pratique-libre");
  revalidatePath("/reserver");
  return { activity: data[0], error: null };
}

// Create a new activity
export async function createActivity(
  name: string,
  nb_credits: number | null,
  type: string,
  price: number | null,
  description: string | null,
  imageUrl: string | null = null,
  squareProductId: string | null = null,
  level: string | null = null,
  audience: string | null = null,
  discipline: string | null = null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  if (!type) {
    return { error: "Le type est requis", activity: null };
  }

  if (!imageUrl && type !== "visite" && type !== "cours") {
    return { error: "Une image est requise", activity: null };
  }
  
  const { data, error } = await supabase
    .from("activity")
    .insert({
      name,
      nb_credits,
      type,
      price: price || null,
      description: description || null,
      image_url: imageUrl,
      square_product_id: squareProductId || null,
      level: level || null,
      audience: audience || null,
      discipline: discipline || null,
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Error creating activity:", error);
    return { error: error.message, activity: null };
  }
  
  if (!data) {
    return { error: "Failed to create activity", activity: null };
  }
  
  revalidatePath("/admin");
  revalidatePath("/atelier");
  revalidatePath("/pratique-libre");
  revalidatePath("/cours");
  return { activity: data, error: null };
}

// Update an activity
export async function updateActivity(
  id: string,
  name: string,
  nb_credits: number | null,
  type: string,
  price: number | null,
  description: string | null,
  imageUrl: string | null = null,
  squareProductId: string | null = null,
  level: string | null = null,
  audience: string | null = null,
  discipline: string | null = null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  if (!type) {
    return { error: "Le type est requis", activity: null };
  }
  
  const { data, error } = await supabase
    .from("activity")
    .update({
      name,
      nb_credits,
      type,
      price: price || null,
      description: description || null,
      image_url: imageUrl || null,
      square_product_id: squareProductId || null,
      level: level || null,
      audience: audience || null,
      discipline: discipline || null,
    })
    .eq("id", id)
    .select();
  
  if (error) {
    console.error("Error updating activity:", error);
    return { error: error.message, activity: null };
  }
  
  if (!data || data.length === 0) {
    return { error: "Activity not found", activity: null };
  }
  
  revalidatePath("/admin");
  revalidatePath("/atelier");
  revalidatePath("/pratique-libre");
  revalidatePath("/cours");
  return { activity: data[0], error: null };
}

// Update a session
export async function updateSession(
  sessionId: string,
  start_ts: string,
  end_ts: string,
  max_registrations: number | null
) {
  await checkAdmin();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("session")
    .update({
      start_ts,
      end_ts,
      max_registrations,
    })
    .eq("id", sessionId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating session:", error);
    return { error: error.message, session: null };
  }
  
  revalidatePath("/admin");
  return { session: data, error: null };
}

// Soft delete an activity
export async function deleteActivity(id: string) {
  await checkAdmin();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: futureSessions, error: sessionsError } = await supabase
    .from("session")
    .select("id")
    .eq("activity_id", id)
    .gte("start_ts", now);

  if (sessionsError) {
    return { error: sessionsError.message };
  }

  const futureSessionIds = futureSessions?.map((session) => session.id) ?? [];

  if (futureSessionIds.length > 0) {
    const { data: registrations, error: registrationsError } = await supabase
      .from("registration")
      .select("id")
      .in("session_id", futureSessionIds);

    if (registrationsError) {
      return { error: registrationsError.message };
    }

    const registrationIds = registrations?.map((registration) => registration.id) ?? [];

    if (registrationIds.length > 0) {
      const { data: statuses, error: statusesError } = await supabase
        .from("registration_status")
        .select("registration_id, status, created_at")
        .in("registration_id", registrationIds)
        .order("created_at", { ascending: false });

      if (statusesError) {
        return { error: statusesError.message };
      }

      const activeRegistrationIds = new Set(registrationIds);
      const seenRegistrationIds = new Set<string>();

      for (const status of statuses ?? []) {
        if (seenRegistrationIds.has(status.registration_id)) {
          continue;
        }

        seenRegistrationIds.add(status.registration_id);

        if (status.status === "CANCELLED") {
          activeRegistrationIds.delete(status.registration_id);
        }
      }

      const cancellations = Array.from(activeRegistrationIds).map((registrationId) => ({
        registration_id: registrationId,
        status: "CANCELLED",
      }));

      if (cancellations.length > 0) {
        const { error: cancellationError } = await supabase
          .from("registration_status")
          .insert(cancellations);

        if (cancellationError) {
          return { error: cancellationError.message };
        }
      }
    }

    const { error: futureSessionsDeleteError } = await supabase
      .from("session")
      .delete()
      .in("id", futureSessionIds);

    if (futureSessionsDeleteError) {
      return { error: futureSessionsDeleteError.message };
    }
  }

  const { error } = await supabase
    .from("activity")
    .update({ deleted_at: now })
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting activity:", error);
    return { error: error.message };
  }
  
  revalidatePath("/admin");
  return { error: null };
}

// Delete a session
export async function deleteSession(sessionId: string) {
  await checkAdmin();
  const supabase = await createClient();
  
  // Check if there are any registrations for this session
  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id")
    .eq("session_id", sessionId)
    .limit(1);
  
  if (registrationsError) {
    return { error: registrationsError.message };
  }
  
  if (registrations && registrations.length > 0) {
    return { error: "Impossible de supprimer une session qui a des inscriptions. Annulez d'abord toutes les inscriptions." };
  }

  const { data: publicSubscriptions, error: publicSubscriptionsError } =
    await supabase
      .from("public_session_subscription")
      .select("id")
      .eq("session_id", sessionId)
      .limit(1);

  if (publicSubscriptionsError) {
    return { error: publicSubscriptionsError.message };
  }

  if (publicSubscriptions && publicSubscriptions.length > 0) {
    return { error: "Impossible de supprimer une session qui a des inscriptions publiques." };
  }
  
  const { error } = await supabase
    .from("session")
    .delete()
    .eq("id", sessionId);
  
  if (error) {
    console.error("Error deleting session:", error);
    return { error: error.message };
  }
  
  revalidatePath("/admin");
  return { error: null };
}

export type InternalProductRow = {
  slug: string;
  kind: SquareProductKind;
  name: string;
  description: string;
  amount_cents: number;
  credits: number;
  sort_order: number;
  enabled: boolean;
};

export type SquareProductMappingRow = {
  internal_slug: string;
  catalog_object_id: string;
  catalog_label: string;
  updated_at: string;
};

export type InternalProductWithMappings = InternalProductRow & {
  mapping?: SquareProductMappingRow;
};

function productToInternalRow(
  product: SquareProduct,
  sortOrder: number,
): InternalProductRow {
  return {
    slug: product.id,
    kind: product.kind,
    name: product.name,
    description: product.description,
    amount_cents: product.amountCents,
    credits: product.credits,
    sort_order: sortOrder,
    enabled: true,
  };
}

export async function getSquareAdminContext() {
  await checkAdmin();
  const environment = getSquareEnvironment();

  return {
    environment,
    environmentLabel: getSquareEnvironmentLabel(environment),
  };
}

export async function fetchSquareApiCatalog() {
  await checkAdmin();

  try {
    const variations = await listSquareCatalogVariations();
    const environment = getSquareEnvironment();

    return {
      environment,
      environmentLabel: getSquareEnvironmentLabel(environment),
      variations,
      error: null,
    };
  } catch (error) {
    return {
      environment: getSquareEnvironment(),
      environmentLabel: getSquareEnvironmentLabel(getSquareEnvironment()),
      variations: [],
      error: error instanceof Error ? error.message : "Impossible de charger le catalogue Square",
    };
  }
}

export async function getInternalProductsWithMappings() {
  await checkAdmin();
  const admin = getAdminClient();

  const { data: mappings, error: mappingsError } = await admin
    .from("square_product_mapping")
    .select("*");

  if (mappingsError) {
    return { products: [] as InternalProductWithMappings[], error: mappingsError.message };
  }

  const mappingMap = new Map<string, SquareProductMappingRow>();

  for (const mapping of (mappings ?? []) as SquareProductMappingRow[]) {
    mappingMap.set(mapping.internal_slug, mapping);
  }

  const productsWithMappings = DEFAULT_SQUARE_PRODUCTS.map((product, index) => {
    const row = productToInternalRow(product, (index + 1) * 10);

    return {
      ...row,
      mapping: mappingMap.get(row.slug),
    };
  });

  return { products: productsWithMappings, error: null };
}

export async function setSquareProductMapping({
  internalSlug,
  catalogObjectId,
  catalogLabel,
}: {
  internalSlug: string;
  catalogObjectId: string | null;
  catalogLabel?: string;
}) {
  await checkAdmin();
  const admin = getAdminClient();
  const normalizedSlug = internalSlug.trim();
  const normalizedCatalogId = catalogObjectId?.trim() ?? "";

  if (!normalizedSlug) {
    return { error: "Identifiant interne requis" };
  }

  if (!normalizedCatalogId) {
    const { error } = await admin
      .from("square_product_mapping")
      .delete()
      .eq("internal_slug", normalizedSlug);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/account");
    revalidatePath("/pratique-libre");
    return { error: null };
  }

  const { error: deleteError } = await admin
    .from("square_product_mapping")
    .delete()
    .eq("internal_slug", normalizedSlug);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: insertError } = await admin.from("square_product_mapping").insert({
    internal_slug: normalizedSlug,
    catalog_object_id: normalizedCatalogId,
    catalog_label: catalogLabel?.trim() || normalizedCatalogId,
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/pratique-libre");
  return { error: null };
}

