import Image from "next/image";
import Link from "next/link";

import { CourseFooter, CourseNav } from "@/app/cours/course-layout";

const ASSETS = {
  logoMark: "/assets/figma-landing/logo-mark.png",
} as const;

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen flex-col">
        <CourseNav />

        <section className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-16 md:px-10 md:pb-[140px] md:pt-[86px]">
          <div className="max-w-[930px]">
            <h1 className="text-[34px] font-bold leading-none tracking-[-0.02em] md:text-[44px]">
              Contactez-nous
            </h1>
            <p className="mt-8 max-w-[820px] text-[14px] font-medium leading-[1.35] text-black/70 md:text-[15px]">
              Vous souhaitez avoir plus d&apos;information ou vous avez une question ?<br />
              Nous sommes là pour vous répondre, n&apos;hésitez pas à passer nous voir,
              à nous écrire ou à nous appeler.
            </p>
          </div>

          <div className="mt-[115px] grid items-center gap-10 md:ml-[140px] md:grid-cols-[500px_1fr] md:gap-[58px]">
            <div className="flex h-[330px] items-center justify-center bg-[#d9d9d9] text-[18px] font-medium text-black/80 md:h-[520px] md:w-[500px]">
              Encart maps
            </div>

            <address className="not-italic text-[14px] font-medium leading-[1.35] text-black/70 md:mt-[40px]">
              <div className="relative mb-4 h-[35px] w-[170px]">
                <Image
                  src={ASSETS.logoMark}
                  alt="Manufacto"
                  fill
                  className="object-contain object-left"
                  sizes="170px"
                />
              </div>
              <p>8 rue de Locarno</p>
              <p>13005 Marseille</p>

              <div className="mt-8">
                <Link
                  href="mailto:contact@manufacto-marseille.com"
                  className="block hover:text-black"
                >
                  contact@manufacto-marseille.com
                </Link>
                <Link href="tel:+33607080910" className="block hover:text-black">
                  06 07 08 09 10
                </Link>
              </div>
            </address>
          </div>
        </section>

        <section className="bg-[#fff8f0]">
          <div className="mx-auto grid max-w-[1280px] gap-6 px-6 py-9 text-[12px] md:grid-cols-[255px_1fr_120px] md:items-center md:px-10">
            <h2 className="text-[24px] font-bold leading-none tracking-[-0.02em] text-[#f56800]">
              venez découvrir <br />
              l&apos;atelier !
            </h2>
            <div className="max-w-[650px] font-medium leading-[1.35] text-black/70">
              <p>
                Tous les mardi soir, de 18h30 à 19h, Martin, Nafissa, Cyprien et
                Delphine vous présenteront le lieu et son fonctionnement
              </p>
              <p>C&apos;est gratuit, sur inscription.</p>
            </div>
            <Link
              href="/activities"
              className="font-semibold text-[#4a56dd] underline underline-offset-2 md:text-right"
            >
              réserver
            </Link>
          </div>
        </section>

        <CourseFooter />
      </div>
    </main>
  );
}
