import type {
  EmailTemplate,
  RegistrationEmailVariables,
} from "@/lib/email/types";

export function renderTemplate(
  template: Pick<EmailTemplate, "subject" | "bodyHtml">,
  variables: RegistrationEmailVariables,
) {
  const replaceVariables = (value: string) =>
    value.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      if (key in variables) {
        return variables[key as keyof RegistrationEmailVariables];
      }
      return match;
    });

  return {
    subject: replaceVariables(template.subject),
    html: replaceVariables(template.bodyHtml),
  };
}

export const SAMPLE_REGISTRATION_VARIABLES: RegistrationEmailVariables = {
  user_name: "Marie Dupont",
  activity_name: "Initiation menuiserie",
  session_date: "mercredi 8 juillet 2026",
  session_time: "14:00",
  participant_count: "1",
  account_url: "https://manufacto-marseille.fr/account",
};
