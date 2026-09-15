import { AuthPageShell } from "@/components/auth-page-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <AuthPageShell
      accent="orange"
      title={
        <>
          Mot de passe <span className="text-[#f56800]">oublié</span>
        </>
      }
      lead="Indiquez votre e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
