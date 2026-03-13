import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";
import { Logo } from "@/components/logo";
import { WordImage } from "@/components/word-image";

// Image paths
const IMAGES = {
  sewing: "/assets/pictures/c684ad317993704862dcfcc1d97400638b639f66.png",
  wood: "/assets/pictures/63ae04e0666801e448100c2c15e0f3589d90e665.png",
  circuit: "/assets/pictures/120e19b8f3497733331fe206ad3cebf6cc80d967.png",
  jackhammer: "/assets/pictures/5ad5bf886151fa3398ad7299c9bd95216b7b298f.jpg",
} as const;

const STAR_FAIRE = "/assets/stars/star_bleue.png";
const STAR_APPRENDRE = "/assets/stars/star_orange.png";
const STAR_JAUNE = "/assets/stars/star_jaune.png";

const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#2d2d2d]">
      {/* Header Section - matches flyer layout */}
      <header className="w-full bg-[#FFF8F0]">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-8 md:px-8 md:pt-10 md:pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Top: Main text (left 2/3) + Sewing (right, small) - same layout on all screens */}
            <div className="flex flex-row items-start gap-4 md:gap-6 mb-6">
              <p className="text-xl md:text-2xl text-[#2d2d2d] leading-relaxed flex-1 md:max-w-[65%]">
                <Logo className="inline-block align-bottom h-10 md:h-12 w-auto mr-2" />
                c&apos;est un atelier partagé et multidisciplinaire au coeur de
                Marseille, ouvert à toutes celles et ceux qui veulent faire de leurs mains.
              </p>
              <div className="relative aspect-square w-32 h-32 md:w-40 md:h-40 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                <Image
                  src={IMAGES.sewing}
                  alt="Mains manipulant du textile"
                  fill
                  className="object-cover"
                  sizes="160px"
                  priority
                />
              </div>
            </div>
            {/* Wood (top) | Text + Electronics (below, electronics at bottom-right of paragraph) */}
            <div className="flex flex-col gap-4 md:gap-6 mb-0">
              <div className="relative aspect-[16/10] max-w-xs overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                <Image
                  src={IMAGES.wood}
                  alt="Mains travaillant le bois avec une règle et un crayon"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                  priority
                />
              </div>
              <div className="flex flex-row items-end gap-4 md:gap-6 -mt-0 md:-mt-32">
                <p className="text-base md:text-lg text-[#2d2d2d] leading-[1.7] md:max-w-xl flex-1">
                  Un lieu pour avoir accès à l&apos;espace, aux{" "}
                  <strong className="font-semibold">machines</strong>, <strong className="font-semibold">outils</strong> et{" "}
                  <strong className="font-semibold">compétences</strong> pour faire soi-même, créer, réparer… au gré de ses envies ou de ses besoins.
                </p>
                <div className="relative aspect-square w-48 h-48 md:w-56 md:h-56 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                  <Image
                    src={IMAGES.circuit}
                    alt="Mains travaillant sur une carte électronique"
                    fill
                    className="object-cover"
                    sizes="224px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Craft Categories - word images per color */}
      <section className="border-t border-[#e5e0d8] py-10 md:py-12 w-full">
        <div className="w-full px-4 md:px-6">
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-3xl md:text-4xl lg:text-5xl">
            <WordImage word="menuiserie" alt="menuiserie" />
            <span className="text-[#2d2d2d] text-sm">•</span>
            <WordImage word="couture" alt="couture" />
            <span className="text-[#2d2d2d] text-sm">•</span>
            <WordImage word="electronique" alt="électronique" />
            <span className="text-[#2d2d2d] text-sm">•</span>
            <WordImage word="ceramique" alt="céramique" />
          </div>
        </div>
      </section>

      {/* Faire & Apprendre - flyer colors */}
      <section className="border-t border-[#e5e0d8] py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-lg md:text-xl text-[#2d2d2d] mb-8 font-medium">
            Un lieu pour:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4 p-6 relative overflow-visible">
              <div className="relative flex items-center min-h-[72px]">
                <Image src={STAR_FAIRE} alt="" width={72} height={72} className="object-contain absolute left-0 top-1/2 -translate-y-1/2 z-0 -translate-x-1" aria-hidden />
                <h3 className="text-2xl md:text-3xl font-bold text-[#85A8DB] pl-14 relative z-10">faire</h3>
              </div>
              <p className="text-base text-[#2d2d2d] leading-[1.75]">
                Qu&apos;il s&apos;agisse de fabriquer, de transformer, de
                réparer, de recycler, d&apos;upcycler, de bricoler, manufacto
                c&apos;est un atelier pour vous permettre de réaliser vos
                projets en autonomie, qu&apos;ils relèvent de travailler le
                bois, le textile, la terre, l&apos;électronique… voire les quatre
                à la fois !
              </p>
            </div>
            <div className="space-y-4 p-6 relative overflow-visible">
              <div className="relative flex items-center min-h-[72px]">
                <Image src={STAR_APPRENDRE} alt="" width={72} height={72} className="object-contain absolute left-0 top-1/2 -translate-y-1/2 z-0 -translate-x-1" aria-hidden />
                <h3 className="text-2xl md:text-3xl font-bold text-[#EEA167] pl-14 relative z-10">apprendre</h3>
              </div>
              <p className="text-base text-[#2d2d2d] leading-[1.75]">
                Chez nous pas de cours à l&apos;année, mais des ateliers de
                montée en compétence ponctuels et des ateliers de découverte
                pour progresser aux rythmes de vos besoins, quelque soit votre
                niveau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Opening Announcement - jackhammer image with yellow star (flyer) */}
      <section className="border-t border-[#e5e0d8] overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px] lg:min-h-[480px] max-w-6xl mx-auto overflow-visible">
          <div className="flex flex-col justify-center px-8 py-14 lg:py-20 lg:px-12 bg-[#FBF8F2]">
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#2d2d2d] mb-5 leading-tight">
              Ouverture prévue courant{" "}
              <span className="text-[#6C85C2]">printemps 2026</span>
            </h2>
            <p className="text-lg md:text-xl text-[#2d2d2d] mb-5">
              Pour le moment, on travaille dur à l&apos;aménagement de
              l&apos;atelier!
            </p>
            <p className="text-base text-[#2d2d2d] mb-8 leading-[1.7]">
              D&apos;ici là, vous pouvez nous contacter par mail à l&apos;adresse :{" "}
              <a
                href="mailto:contact@manufacto-marseille.fr"
                className="text-[#6C85C2] hover:underline font-medium"
              >
                contact@manufacto-marseille.fr
              </a>
              {" "}et nous retrouver sur Instagram pour suivre le chantier et nos avancées.
            </p>
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg shadow-md ring-1 ring-black/5 hover:shadow-lg hover:scale-105 transition-all duration-200"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-6 h-6" />
            </Link>
          </div>
          <div className="hidden lg:flex relative min-h-[320px] lg:min-h-full items-center justify-start overflow-visible bg-[#FBF8F2] pl-4 pr-20 pb-20 lg:pr-32 lg:pb-28">
            <div className="relative w-full max-w-md lg:max-w-lg aspect-[4/3] ml-0 mr-auto overflow-visible">
              <Image
                src={IMAGES.jackhammer}
                alt="Travaux d'aménagement de l'atelier"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 32rem"
              />
              <div className="absolute -right-8 md:-right-16 lg:-right-28 -bottom-16 md:-bottom-20 lg:-bottom-24 w-40 h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 drop-shadow-lg">
                <div className="relative w-full h-full">
                  <Image src={STAR_JAUNE} alt="" fill className="object-cover" sizes="(max-width: 768px) 160px, (max-width: 1024px) 176px, 192px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
