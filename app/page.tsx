import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";

// Image paths from public/assets
const IMAGES = {
  sewing: "/assets/5ad5bf886151fa3398ad7299c9bd95216b7b298f.jpg",
  wood: "/assets/63ae04e0666801e448100c2c15e0f3589d90e665.png",
  circuit: "/assets/120e19b8f3497733331fe206ad3cebf6cc80d967.png",
  jackhammer: "/assets/c684ad317993704862dcfcc1d97400638b639f66.png",
} as const;

const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#2d2d2d]">
      {/* Header Section */}
      <header className="w-full bg-[#FFF8F0]">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-6 md:px-6 md:pt-6 md:pb-10">
          <div className="flex flex-col items-center text-center">
            {/* Title: Logo */}
            <h1 className="shrink-0 m-0 mb-2">
              <Image
                src="/assets/logo.png"
                alt="Manufacto"
                width={260}
                height={60}
                className="object-contain"
                priority
              />
            </h1>
            {/* Subtitle */}
            <p className="text-lg md:text-xl lg:text-2xl text-[#3d3d3d] leading-tight max-w-xl mb-8">
              c&apos;est un <strong className="font-bold text-[#2d2d2d]">atelier partagé</strong> et multidisciplinaire au coeur de
              Marseille, <strong className="font-bold text-[#2d2d2d]">ouvert à toutes celles et ceux</strong> <strong className="font-bold text-[#2d2d2d]">qui veulent faire de leurs mains</strong>.
            </p>
            {/* Three images in a row */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mb-8">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-lg shadow-black/5 ring-1 ring-black/5">
                <Image
                  src={IMAGES.wood}
                  alt="Mains travaillant le bois avec une règle et un crayon"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 400px"
                  priority
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg shadow-black/5 ring-1 ring-black/5">
                <Image
                  src={IMAGES.jackhammer}
                  alt="Travaux d'aménagement de l'atelier"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 400px"
                />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg shadow-black/5 ring-1 ring-black/5">
                <Image
                  src={IMAGES.circuit}
                  alt="Mains travaillant sur une carte électronique"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 400px"
                />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-[#3d3d3d] leading-[1.7] max-w-2xl">
              Un lieu pour avoir accès aux{" "}
              <strong className="text-[#2d2d2d] font-semibold">machines</strong>, <strong className="text-[#2d2d2d] font-semibold">outils</strong> et{" "}
              <strong className="text-[#2d2d2d] font-semibold">compétences</strong> pour faire soi-même, créer, réparer au gré de ses envies ou de ses besoins.
            </p>
          </div>
        </div>
      </header>

      {/* Craft Categories */}
      <section className="border-t border-[#e8e4df] py-10 md:py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-3xl md:text-4xl lg:text-5xl">
            <span className="font-caveat text-[#e65100] transition-colors hover:text-[#ff6f00]">menuiserie</span>
            <span className="text-[#c4beb5] text-sm">•</span>
            <span className="font-caveat text-[#1565c0] transition-colors hover:text-[#1976d2]">couture</span>
            <span className="text-[#c4beb5] text-sm">•</span>
            <span className="font-caveat text-[#2e7d32] transition-colors hover:text-[#388e3c]">électronique</span>
            <span className="text-[#c4beb5] text-sm">•</span>
            <span className="font-caveat text-[#c62828] transition-colors hover:text-[#d32f2f]">
              céramique
            </span>
          </div>
        </div>
      </section>

      {/* Faire & Apprendre */}
      <section className="border-t border-[#e8e4df] py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-xl md:text-2xl text-[#3d3d3d] mb-8 font-medium tracking-wide">
            Un lieu pour:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm ring-1 ring-black/5 relative overflow-visible">
              <div className="relative flex items-center min-h-[48px]">
                <Image src="/assets/star1.png" alt="" width={48} height={48} className="object-contain absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1" aria-hidden />
                <h3 className="text-3xl font-caveat text-[#1565c0] pl-10 relative z-0">faire</h3>
              </div>
              <p className="text-base text-[#3d3d3d] leading-[1.75]">
                Qu&apos;il s&apos;agisse de fabriquer, de transformer, de
                réparer, de recycler, d&apos;upcycler, de bricoler, manufacto
                c&apos;est un atelier pour vous permettre de réaliser vos
                projets en autonomie, qu&apos;ils relèvent de travailler le
                bois, le textile, la terre, l&apos;électronique… voire les quatre
                à la fois !
              </p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm ring-1 ring-black/5 relative overflow-visible">
              <div className="relative flex items-center min-h-[48px]">
                <Image src="/assets/star2.png" alt="" width={48} height={48} className="object-contain absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1" aria-hidden />
                <h3 className="text-3xl font-caveat text-[#e65100] pl-10 relative z-0">apprendre</h3>
              </div>
              <p className="text-base text-[#3d3d3d] leading-[1.75]">
                Chez nous pas de cours à l&apos;année, mais des ateliers de
                montée en compétence ponctuels et des ateliers de découverte
                pour progresser aux rythmes de vos besoins, quelque soit votre
                niveau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Opening Announcement */}
      <section className="border-t border-[#e8e4df]">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px] lg:min-h-[480px]">
          <div className="flex flex-col justify-center px-8 py-14 lg:py-20 lg:px-12">
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#2d2d2d] mb-5 leading-tight">
              Ouverture prévue courant{" "}
              <span className="text-[#1565c0]">printemps 2026</span>
            </h2>
            <p className="text-lg font-semibold text-[#3d3d3d] mb-5">
              Pour le moment, on travaille dur à l&apos;aménagement de
              l&apos;atelier!
            </p>
            <p className="text-base text-[#3d3d3d] mb-8 leading-[1.7]">
              D&apos;ici là, vous pouvez nous contacter par mail à l&apos;adresse :{" "}
              <a
                href="mailto:contact@manufacto-marseille.fr"
                className="text-[#1565c0] hover:underline font-medium"
              >
                contact@manufacto-marseille.fr
              </a>
              {" "}et nous retrouver sur Instagram pour suivre le chantier et nos avancées.
            </p>
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 shadow-md ring-1 ring-black/5 hover:shadow-lg hover:scale-105 transition-all duration-200"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-6 h-6" />
            </Link>
          </div>
          <div className="relative min-h-[320px] lg:min-h-full overflow-hidden">
            <Image
              src={IMAGES.sewing}
              alt="Mains cousant un tissu"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-6 right-6 w-20 h-20 md:w-24 md:h-24 drop-shadow-lg" aria-hidden="true">
              <div className="relative w-full h-full">
                <Image src="/assets/star2.png" alt="" fill className="object-contain" sizes="96px" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
