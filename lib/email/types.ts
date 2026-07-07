export const EMAIL_TEMPLATE_KEYS = [
  "registration_confirmation",
  "registration_reminder",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplate = {
  templateKey: EmailTemplateKey;
  subject: string;
  bodyHtml: string;
  updatedAt?: string | null;
  isDefault?: boolean;
};

export type RegistrationEmailVariables = {
  user_name: string;
  activity_name: string;
  session_date: string;
  session_time: string;
  participant_count: string;
  account_url: string;
};
