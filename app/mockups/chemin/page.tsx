import Image from "next/image";
import Link from "next/link";
import {
  BrandLockup,
  GiftOfferBanner,
  ImageTile,
  InstagramStrip,
  P,
  PhotoRibbon,
  RIBBON_SITE,
  VisitBanner,
  WordStrip,
} from "@/components/mockups/shared";
import { mockupHref } from "@/components/mockups/paths";

const h = (path: string) => mockupHref("chemin", path);

export default function MockupCheminHomePage() {
  return (
    <main>
      <header className="bg-[#fff8f0]">
        <div className="mx-auto max-w-[1274px] px-5 pb-10 pt-10 md:pb-14 md:pt-14">
          <div className="flex flex-col items-start gap-4 md:items-center md:text-center">
            <BrandLockup />
            <h1 className="max-w-3xl text-[34px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[48px]">
              Un atelier pour{" "}
              <span className="text-[#f56800]">faire</span>,{" "}
              <span className="text-[#4a56dd]">apprendre</span>
              {" "}ou{" "}
              <span className="text-[#d73459]">offrir</span>
            </h1>
            <p className="max-w-xl text-lg text-black/70 md:text-xl">
              Choisissez votre porte d&apos;entrée : la pratique libre, un cours,
              ou une carte cadeau pour faire découvrir Manufacto.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
            <Link href={h("/pratique-libre")} className="group relative block">
              <Image
                src={P.starBlue}
                alt=""
                width={120}
                height={96}
                className="absolute -left-2 -top-6 z-10 h-14 w-auto object-contain md:h-16"
                aria-hidden
              />
              <ImageTile
                src={P.pl28}
                alt="Pratique libre à Manufacto"
                className="h-[280px] md:h-[360px]"
                priority
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-[#f56800] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
                    Je veux pratiquer
                  </span>
                  <span className="text-base font-medium md:text-lg">pratique libre →</span>
                </span>
              </ImageTile>
            </Link>

            <Link href={h("/cours")} className="group relative block">
              <Image
                src={P.starOrange}
                alt=""
                width={120}
                height={100}
                className="absolute -right-1 -top-6 z-10 h-14 w-auto rotate-[18deg] object-contain md:h-16"
                aria-hidden
              />
              <ImageTile
                src={P.boisMain}
                alt="Cours ponctuels à Manufacto"
                className="h-[280px] md:h-[360px]"
                priority
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-[#4a56dd] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
                    Je veux apprendre
                  </span>
                  <span className="text-base font-medium md:text-lg">cours ponctuels →</span>
                </span>
              </ImageTile>
            </Link>

            <Link href={h("/offrir")} className="group relative block">
              <ImageTile
                src={P.tabouret10}
                alt="Offrir Manufacto en cadeau"
                className="h-[280px] md:h-[360px]"
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-[#d73459] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
                    Je veux offrir
                  </span>
                  <span className="text-base font-medium md:text-lg">carte cadeau →</span>
                </span>
              </ImageTile>
            </Link>
          </div>
        </div>
      </header>

      <VisitBanner reserveHref={h("/contact")} />

      <section className="border-y border-black/10 px-5 py-6">
        <WordStrip />
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-12">
        <PhotoRibbon images={[...RIBBON_SITE]} />
      </section>

      <section className="mx-auto max-w-[1274px] px-5 pb-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <ImageTile src={P.atelierFrame} alt="Espace atelier" className="h-44 md:h-56" />
            <ImageTile src={P.handsCouture} alt="Travail du textile" className="mt-8 h-44 md:h-56" />
            <ImageTile src={P.machines8} alt="Machines stationnaires" className="h-44 md:h-56" />
            <ImageTile src={P.tabouret10} alt="Fabrication d'un tabouret" className="mt-8 h-44 md:h-56" />
          </div>
          <div>
            <h2 className="text-[30px] font-semibold text-black/80">
              Ouvert à toutes et tous, quel que soit le niveau
            </h2>
            <p className="mt-5 text-xl leading-normal text-black/75">
              Que vous soyez débutant·e ou déjà à l&apos;aise avec les machines,
              Manufacto accueille vos projets autour du bois, du textile, de la
              céramique et de l&apos;électronique — en autonomie ou accompagné·e.
            </p>
            <p className="mt-4 text-xl text-black/75">
              8 rue de Locarno, 13005 Marseille
            </p>
            <Link
              href={h("/atelier")}
              className="mt-6 inline-block font-semibold text-[#4a56dd] underline"
            >
              En savoir plus sur l&apos;atelier →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#fff8f0] py-14">
        <div className="mx-auto max-w-[1274px] px-5">
          <h2 className="mb-3 text-[28px] font-semibold text-black/80">
            La vie dans l&apos;atelier
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-black/70">
            Des créneaux de pratique libre aux cours ponctuels, voici un aperçu
            de ce qui se fabrique chez Manufacto.
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              P.portrait1,
              P.portrait11,
              P.portrait15,
              P.portrait22,
              P.plRect11,
              P.plRect12,
              P.heroCeramique,
              P.heroElecNew,
            ].map((src) => (
              <ImageTile key={src} src={src} alt="" className="h-40 md:h-52" />
            ))}
          </div>
        </div>
      </section>

      <GiftOfferBanner courseHref={h("/offrir")} />

      <section className="bg-white">
        <div className="mx-auto flex max-w-[1274px] flex-col gap-4 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-bold">Newsletter</h2>
            <p className="mt-2 max-w-xl text-lg text-black/70">
              Pour rester au courant de nos actualités. Une fois par mois,
              promis.
            </p>
          </div>
          <Link
            href="/newsletter"
            className="inline-flex rounded-[12px] border-2 border-[#4a56dd] bg-white px-6 py-3 text-lg font-semibold text-[#4a56dd] hover:bg-[#f0f1ff]"
          >
            s&apos;inscrire
          </Link>
        </div>
      </section>

      <div className="pt-10">
        <InstagramStrip />
      </div>
    </main>
  );
}
