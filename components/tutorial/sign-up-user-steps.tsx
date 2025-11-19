import Link from "next/link";
import { TutorialStep } from "./tutorial-step";
import { ArrowUpRight } from "lucide-react";

export function SignUpUserSteps() {
  return (
    <ol className="flex flex-col gap-6">
      {process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "production" ? (
        <TutorialStep title="Configurer les URLs de redirection">
          <p>Il semble que cette application soit hébergée sur Vercel.</p>
          <p className="mt-4">
            Ce déploiement particulier est
            <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
              &quot;{process.env.VERCEL_ENV}&quot;
            </span>{" "}
            sur
            <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
              https://{process.env.VERCEL_URL}
            </span>
            .
          </p>
          <p className="mt-4">
            Vous devrez{" "}
            <Link
              className="text-primary hover:text-foreground"
              href={
                "https://supabase.com/dashboard/project/_/auth/url-configuration"
              }
            >
              mettre à jour votre projet Supabase
            </Link>{" "}
            avec les URLs de redirection basées sur vos URLs de déploiement Vercel.
          </p>
          <ul className="mt-4">
            <li>
              -{" "}
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                http://localhost:3000/**
              </span>
            </li>
            <li>
              -{" "}
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/**`}
              </span>
            </li>
            <li>
              -{" "}
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
                  ".vercel.app",
                  "",
                )}-*-[vercel-team-url].vercel.app/**`}
              </span>{" "}
              (L&apos;URL de l&apos;équipe Vercel peut être trouvée dans les{" "}
              <Link
                className="text-primary hover:text-foreground"
                href="https://vercel.com/docs/accounts/create-a-team#find-your-team-id"
                target="_blank"
              >
                paramètres de l&apos;équipe Vercel
              </Link>
              )
            </li>
          </ul>
          <Link
            href="https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls"
            target="_blank"
            className="text-primary/50 hover:text-primary flex items-center text-sm gap-1 mt-4"
          >
            Documentation des URLs de Redirection <ArrowUpRight size={14} />
          </Link>
        </TutorialStep>
      ) : null}
      <TutorialStep title="Inscrivez votre premier utilisateur">
        <p>
          Rendez-vous sur la page{" "}
          <Link
            href="auth/sign-up"
            className="font-bold hover:underline text-foreground/80"
          >
            Inscription
          </Link>{" "}
          et inscrivez votre premier utilisateur. Ce n&apos;est pas grave si c&apos;est juste vous
          pour l&apos;instant. Votre idée géniale aura plein d&apos;utilisateurs plus tard !
        </p>
      </TutorialStep>
    </ol>
  );
}
