import { SignUpForm } from "@/components/sign-up-form";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-black">
      <MarketingPageContainer className="pb-24 md:pb-[140px]">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_440px] md:items-start md:gap-16">
          <MarketingPageHeader title="Créer un compte" className="max-w-[720px]">
            <p>
              Inscrivez-vous pour réserver vos cours, gérer vos informations et
              suivre vos activités à l&apos;atelier.
            </p>
          </MarketingPageHeader>

          <section className="rounded-[19px] bg-[#fff8f0] p-6 ring-1 ring-black/10 md:p-8">
            <SignUpForm />
          </section>
        </div>
      </MarketingPageContainer>
    </main>
  );
}
