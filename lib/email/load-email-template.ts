import { getDefaultEmailTemplate } from "@/lib/email/default-templates";
import type { EmailTemplate, EmailTemplateKey } from "@/lib/email/types";
import { getAdminClient } from "@/lib/square/server";

export async function loadEmailTemplate(
  templateKey: EmailTemplateKey,
): Promise<EmailTemplate> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("email_template")
    .select("template_key, subject, body_html, updated_at")
    .eq("template_key", templateKey)
    .maybeSingle();

  if (error) {
    console.error(`Error loading email template ${templateKey}:`, error);
    return getDefaultEmailTemplate(templateKey);
  }

  if (!data) {
    return getDefaultEmailTemplate(templateKey);
  }

  return {
    templateKey,
    subject: data.subject,
    bodyHtml: data.body_html,
    updatedAt: data.updated_at,
    isDefault: false,
  };
}
