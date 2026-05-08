import Image from "next/image";
import Link from "next/link";

import {
  MarketingBody,
  MarketingPageContainer,
  MarketingPageHeader,
  VisitAtelierCallout,
} from "@/components/marketing";
import { CourseFooter } from "@/app/cours/course-layout";

const ASSETS = {
  logoMark: "/assets/figma-landing/logo-mark.png",
} as const;

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen flex-col">
        <MarketingPageContainer className="pb-24 md:pb-[140px]">
          <MarketingPageHeader title="Contactez-nous" className="max-w-[930px]">
            <p>
              Vous souhaitez avoir plus d&apos;information ou vous avez une question ?<br />
              Nous sommes là pour vous répondre, n&apos;hésitez pas à passer nous voir,
              à nous écrire ou à nous appeler.
            </p>
          </MarketingPageHeader>

          <div className="mt-[115px] grid items-center gap-10 md:ml-[140px] md:grid-cols-[500px_1fr] md:gap-[58px]">
            <div className="h-[330px] overflow-hidden bg-[#d9d9d9] md:h-[520px] md:w-[500px]">
              <iframe
                title="Manufacto Marseille sur la carte"
                src="https://www.google.com/maps?q=8%20rue%20de%20Locarno%2C%2013005%20Marseille&output=embed"
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <address className="not-italic md:mt-[40px]">
              <div className="relative mb-4 h-[35px] w-[170px]">
                <Image
                  src={ASSETS.logoMark}
                  alt="Manufacto"
                  fill
                  className="object-contain object-left"
                  sizes="170px"
                />
              </div>
              <MarketingBody className="space-y-0">
                <p>8 rue de Locarno</p>
                <p>13005 Marseille</p>
              </MarketingBody>

              <MarketingBody className="mt-8 space-y-0">
                <Link
                  href="mailto:contact@manufacto-marseille.com"
                  className="block hover:text-black"
                >
                  contact@manufacto-marseille.com
                </Link>
                <Link href="tel:+33607080910" className="block hover:text-black">
                  06 07 08 09 10
                </Link>
              </MarketingBody>
            </address>
          </div>
        </MarketingPageContainer>

        <VisitAtelierCallout />

        <CourseFooter />
      </div>
    </main>
  );
}
