import type { EmailTemplate, EmailTemplateKey } from "@/lib/email/types";

const DEFAULT_TEMPLATES: Record<EmailTemplateKey, Omit<EmailTemplate, "templateKey">> = {
  registration_confirmation: {
    subject: "Confirmation d'inscription — {{activity_name}}",
    bodyHtml: `<p>Bonjour {{user_name}},</p>
<p>Votre inscription au cours <strong>{{activity_name}}</strong> est confirmée.</p>
<p><strong>Date :</strong> {{session_date}}<br>
<strong>Heure :</strong> {{session_time}}<br>
<strong>Participants :</strong> {{participant_count}}</p>
<p>Retrouvez vos réservations sur votre <a href="{{account_url}}">espace personnel</a>.</p>
<p>À bientôt chez Manufacto !</p>`,
  },
  registration_reminder: {
    subject: "Rappel — {{activity_name}} demain",
    bodyHtml: `<p>Bonjour {{user_name}},</p>
<p>Nous vous rappelons que vous êtes inscrit·e au cours <strong>{{activity_name}}</strong> demain.</p>
<p><strong>Date :</strong> {{session_date}}<br>
<strong>Heure :</strong> {{session_time}}<br>
<strong>Participants :</strong> {{participant_count}}</p>
<p>Retrouvez vos réservations sur votre <a href="{{account_url}}">espace personnel</a>.</p>
<p>À demain chez Manufacto !</p>`,
  },
};

export function getDefaultEmailTemplate(templateKey: EmailTemplateKey): EmailTemplate {
  const template = DEFAULT_TEMPLATES[templateKey];
  return {
    templateKey,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    isDefault: true,
  };
}
