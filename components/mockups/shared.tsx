import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  COURSE_DISCIPLINE_COLORS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";

export const P = {
  // Workshop / space — prefer new Photos (resized)
  atelierWide: "/assets/photos-new/lieu/13_20260630_153317.jpg",
  atelierFrame: "/assets/photos-new/lieu/06_20260610_181128.jpg",
  atelierPeople: "/assets/photos-new/lieu/01_20260526_185531.jpg",
  atelierWhatsapp: "/assets/photos-new/atelier/09_20260518_205407.jpg",
  atelierVector: "/assets/photos-new/lieu/12_20260625_104132.jpg",

  // Pratique libre gallery (mix new + legacy)
  pl19: "/assets/photos-new/atelier/01_20260507_115655.jpg",
  pl20: "/assets/photos-new/atelier/02_20260511_085926.jpg",
  pl21: "/assets/photos-new/atelier/03_20260511_174519.jpg",
  pl22: "/assets/photos-new/atelier/04_20260511_180016.jpg",
  pl23: "/assets/photos-new/atelier/05_20260511_180118.jpg",
  pl24: "/assets/photos-new/atelier/06_20260511_180406.jpg",
  pl25: "/assets/photos-new/atelier/08_20260517_113741.jpg",
  pl26: "/assets/photos-new/portraits/05_HD_Manufacto_Portraits_13.jpg",
  pl27: "/assets/photos-new/atelier/10_20260519_121144.jpg",
  pl28: "/assets/photos-new/site/05_Menuiserie.jpg",
  pl29: "/assets/photos-new/site/06_Menuiserie_01.jpg",
  pl30: "/assets/photos-new/lieu/03_20260610_132212.jpg",
  pl31: "/assets/photos-new/lieu/04_20260610_180851.jpg",
  pl32: "/assets/photos-new/lieu/07_20260610_190639.jpg",
  pl33: "/assets/photos-new/lieu/11_20260617_201842.jpg",
  pl34: "/assets/photos-new/atelier/11_20260519_141225.jpg",
  pl35: "/assets/photos-new/atelier/12_20260519_163008.jpg",
  pl36: "/assets/photos-new/atelier/16_20260523_102547.jpg",
  plRect11: "/assets/photos-new/site/07_WhatsApp_Image_2026-07-31_at_23.01.31.jpg",
  plRect12: "/assets/photos-new/site/09_WhatsApp_Image_2026-07-31_at_23.01.32_2_.jpg",
  plRect15: "/assets/photos-new/site/02_Ce_ramique.jpg",
  plRect16: "/assets/photos-new/site/12_WhatsApp_Image_2026-07-31_at_23.01.33.jpg",
  plVector: "/assets/photos-new/lieu/14_20260630_154234.jpg",

  // Homepage tiles / bandeau sources
  pratiqueLibre: "/assets/photos-new/site/05_Menuiserie.jpg",
  cours: "/assets/photos-new/site/03_Couture.jpg",
  bandeau: "/assets/photos-new/site/01_Frame_1321317472.jpg",
  heroMenuiserie: "/assets/photos-new/site/05_Menuiserie.jpg",
  heroCoutureNew: "/assets/photos-new/site/03_Couture.jpg",
  heroCeramique: "/assets/photos-new/site/02_Ce_ramique.jpg",
  heroElecNew: "/assets/photos-new/site/04_Elec.jpg",
  tarifSquare: "/assets/photos-new/site/16_Photo_en_haut_carre_.jpg",
  tarifVertical: "/assets/photos-new/site/15_Photo_en_bas_verticale_.jpg",

  // Close-ups / hands (legacy + new)
  handsWood: "/assets/photos-new/site/05_Menuiserie.jpg",
  handsCouture: "/assets/photos-new/site/03_Couture.jpg",
  handsElec: "/assets/photos-new/site/04_Elec.jpg",
  picA: "/assets/photos-new/portraits/01_HD_Manufacto_Portraits_1.jpg",
  picB: "/assets/photos-new/portraits/03_HD_Manufacto_Portraits_11.jpg",
  picC: "/assets/photos-new/portraits/07_HD_Manufacto_Portraits_15.jpg",

  // Cours / making — new atelier + lieu
  tabouret3: "/assets/photos-new/atelier/18_20260526_161138.jpg",
  tabouret10: "/assets/photos-new/lieu/09_20260617_194733.jpg",
  tabouret12: "/assets/photos-new/lieu/10_20260617_194806.jpg",
  bois6: "/assets/photos-new/atelier/20_20260526_191203.jpg",
  bois13: "/assets/photos-new/atelier/21_20260527_100300.jpg",
  bois14: "/assets/photos-new/lieu/16_20260707_193505.jpg",
  bois15: "/assets/photos-new/atelier/22_20260527_103604.jpg",
  boisMain: "/assets/photos-new/site/06_Menuiserie_01.jpg",
  assemblages1: "/assets/photos-new/atelier/17_20260526_115807.jpg",
  assemblages7: "/assets/photos-new/atelier/19_20260526_162927.jpg",
  machines2: "/assets/photos-new/lieu/05_20260610_180935.jpg",
  machines8: "/assets/photos-new/lieu/08_20260612_092206.jpg",
  outillage4: "/assets/photos-new/atelier/14_20260522_144235.jpg",
  outillage9: "/assets/photos-new/atelier/15_20260522_174032.jpg",
  portecles5: "/assets/photos-new/atelier/07_20260514_123312.jpg",
  portecles11: "/assets/photos-new/atelier/13_20260519_194733.jpg",

  // Portraits
  portrait1: "/assets/photos-new/portraits/01_HD_Manufacto_Portraits_1.jpg",
  portrait11: "/assets/photos-new/portraits/03_HD_Manufacto_Portraits_11.jpg",
  portrait13: "/assets/photos-new/portraits/05_HD_Manufacto_Portraits_13.jpg",
  portrait15: "/assets/photos-new/portraits/07_HD_Manufacto_Portraits_15.jpg",
  portrait18: "/assets/photos-new/portraits/10_HD_Manufacto_Portraits_18.jpg",
  portrait22: "/assets/photos-new/portraits/14_HD_Manufacto_Portraits_22.jpg",
  portrait25: "/assets/photos-new/portraits/17_HD_Manufacto_Portraits_25.jpg",

  // Instagram strip uses new shots
  ig1: "/assets/photos-new/portraits/05_HD_Manufacto_Portraits_13.jpg",
  ig2: "/assets/photos-new/lieu/02_20260610_101444.jpg",
  ig3: "/assets/photos-new/site/12_WhatsApp_Image_2026-07-31_at_23.01.33.jpg",
  ig4: "/assets/photos-new/atelier/23_20260528_171326.jpg",

  // Brand graphics
  wordMenuiserie: "/assets/words/orange/menuiserie.png",
  wordCouture: "/assets/words/bleue/couture.png",
  wordCeramique: "/assets/words/rose/ceramique.png",
  wordElectronique: "/assets/words/verte/electronique.png",
  starBlue: "/assets/figma-landing/star-blue.png",
  starOrange: "/assets/figma-landing/star-orange.png",
  starRouge: "/assets/stars/star_rouge.png",
} as const;

export type FeaturedCourse = {
  title: string;
  blurb: string;
  image: string;
  word: string;
  wordW: number;
  wordH: number;
  discipline: CourseDiscipline;
  /** Live course detail page with upcoming dates */
  href: string;
};

/** Featured courses for mockup carousels — href points to live /cours/[slug] */
export const FEATURED_COURSES: FeaturedCourse[] = [
  {
    title: "Fabriquer un tabouret en bois",
    blurb: "De la découpe à l’assemblage, repartez avec un objet fini.",
    image: P.tabouret12,
    word: P.wordMenuiserie,
    wordW: 496,
    wordH: 90,
    discipline: "menuiserie",
    href: "/cours/fabriquer-un-tabouret-en-bois",
  },
  {
    title: "Découverte des machines stationnaires",
    blurb: "Apprenez à utiliser en sécurité les grandes machines de l’atelier.",
    image: P.machines2,
    word: P.wordMenuiserie,
    wordW: 496,
    wordH: 90,
    discipline: "menuiserie",
    href: "/cours/decouverte-des-machines-stationnaires",
  },
  {
    title: "Se former aux techniques d’assemblage",
    blurb: "Tenons, mortaises et assemblages solides — les bases du métier.",
    image: P.assemblages1,
    word: P.wordMenuiserie,
    wordW: 496,
    wordH: 90,
    discipline: "menuiserie",
    href: "/cours/se-former-aux-techniques-d-assemblage",
  },
  {
    title: "Apprendre à utiliser une machine à coudre",
    blurb: "Les gestes de base pour démarrer en couture en toute confiance.",
    image: P.heroCoutureNew,
    word: P.wordCouture,
    wordW: 400,
    wordH: 90,
    discipline: "couture",
    href: "/cours/initiation-a-la-couture-apprendre-a-utiliser-une-machine-a-coudre",
  },
  {
    title: "Coudre une housse d’ordinateur",
    blurb: "Un projet concret pour progresser : coupe, assemblage, finitions.",
    image: P.handsCouture,
    word: P.wordCouture,
    wordW: 400,
    wordH: 90,
    discipline: "couture",
    href: "/cours/coudre-une-housse-d-ordinateur-ou-de-tablette",
  },
  {
    title: "Initiation céramique — modelage",
    blurb: "Découvrez le modelage et repartez avec vos premières pièces.",
    image: P.heroCeramique,
    word: P.wordCeramique,
    wordW: 420,
    wordH: 90,
    discipline: "ceramique",
    href: "/cours/initiation-ceramique-decouvrir-le-modelage",
  },
  {
    title: "Créer un bougeoir ou porte-clé mural",
    blurb: "Un atelier modelage pour fabriquer un objet utile et décoratif.",
    image: P.plRect15,
    word: P.wordCeramique,
    wordW: 420,
    wordH: 90,
    discipline: "ceramique",
    href: "/cours/creer-un-bougeoir-ou-porte-cle-mural",
  },
  {
    title: "Repair Café",
    blurb: "Venez réparer vos appareils avec de l’aide — électronique accessible.",
    image: P.heroElecNew,
    word: P.wordElectronique,
    wordW: 480,
    wordH: 90,
    discipline: "electronique",
    href: "/cours/repair-cafe",
  },
];


/** Curated ribbons from the new photo pack */
export const RIBBON_LIEU = [
  P.atelierPeople,
  P.atelierFrame,
  P.pl30,
  P.pl31,
  P.pl32,
  P.pl33,
  P.machines2,
  P.machines8,
  P.tabouret10,
  P.bois14,
] as const;

export const RIBBON_PORTRAITS = [
  P.portrait1,
  P.portrait11,
  P.portrait13,
  P.portrait15,
  P.portrait18,
  P.portrait22,
  P.portrait25,
  P.picA,
  P.picB,
  P.picC,
] as const;

export const RIBBON_SITE = [
  P.heroMenuiserie,
  P.heroCoutureNew,
  P.heroCeramique,
  P.heroElecNew,
  P.plRect11,
  P.plRect12,
  P.plRect16,
  P.pratiqueLibre,
  P.cours,
  P.tarifSquare,
] as const;

export const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

export const MOCKUP_LINKS = [
  { href: "/mockups/mix", label: "4 · Chemin + cours", short: "Mix ★" },
  { href: "/mockups/visite", label: "1 · Visite d'abord", short: "Visite" },
  { href: "/mockups/chemin", label: "2 · Choisis ton chemin", short: "Chemin" },
  { href: "/mockups/sessions", label: "3 · Prochaine session", short: "Sessions" },
] as const;

export function MockupSwitcher({
  active,
}: {
  active: "hub" | "visite" | "chemin" | "sessions" | "mix";
}) {
  return (
    <div className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1274px] flex-wrap items-center gap-2 px-4 py-2.5 md:px-5">
        <Link
          href="/mockups"
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            active === "hub" ? "bg-black text-white" : "bg-[#f2f2f2] text-black/80 hover:bg-[#e8e8e8]"
          }`}
        >
          Hub
        </Link>
        {MOCKUP_LINKS.map((link) => {
          const key = link.href.split("/").pop() as "visite" | "chemin" | "sessions" | "mix";
          const isActive = active === key;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                isActive ? "bg-[#4a56dd] text-white" : "bg-[#f2f2f2] text-black/80 hover:bg-[#e8e8e8]"
              }`}
            >
              <span className="md:hidden">{link.short}</span>
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
        <span className="ml-auto hidden text-xs text-black/50 sm:inline">Mockups · non publiés</span>
      </div>
    </div>
  );
}

export function PrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-[12px] bg-[#f56800] px-6 py-3.5 text-lg font-semibold text-white transition hover:bg-[#d95700] ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-[12px] border-2 border-[#4a56dd] bg-white/90 px-6 py-3 text-lg font-semibold text-[#4a56dd] transition hover:bg-[#f0f1ff] ${className}`}
    >
      {children}
    </Link>
  );
}

export function WordStrip({ className = "" }: { className?: string }) {
  const words = [
    { src: P.wordMenuiserie, alt: "menuiserie", width: 496, height: 90, className: "h-7 w-auto sm:h-9" },
    { src: P.wordCouture, alt: "couture", width: 279, height: 63, className: "h-7 w-auto sm:h-9" },
    { src: P.wordCeramique, alt: "céramique", width: 428, height: 130, className: "h-9 w-auto sm:h-12" },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-8 ${className}`}>
      {words.map((word, index) => (
        <div key={word.alt} className="flex items-center gap-4 sm:gap-8">
          {index > 0 ? <span className="hidden text-2xl leading-none sm:inline">·</span> : null}
          <Image
            src={word.src}
            alt={word.alt}
            width={word.width}
            height={word.height}
            className={`object-contain ${word.className}`}
          />
        </div>
      ))}
    </div>
  );
}

export function ImageTile({
  src,
  alt,
  className = "",
  children,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[19px] bg-[#d9d9d9] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 640px"
        priority={priority}
      />
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-6 text-center text-[26px] font-semibold leading-tight text-white transition group-hover:bg-black/35 md:text-[30px]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Dense photo strip — keeps the atelier feeling visual */
export function PhotoRibbon({ images, className = "" }: { images: string[]; className?: string }) {
  return (
    <div className={`flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="relative h-36 w-44 shrink-0 overflow-hidden rounded-[14px] bg-[#d9d9d9] sm:h-44 sm:w-56"
        >
          <Image src={src} alt="" fill className="object-cover" sizes="224px" />
        </div>
      ))}
    </div>
  );
}

/** Horizontal course cards — same scroll feel as PhotoRibbon */
export function CourseCarousel({
  courses,
  className = "",
}: {
  courses: readonly FeaturedCourse[];
  className?: string;
}) {
  return (
    <div
      className={`flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {courses.map((course) => {
        const colors = COURSE_DISCIPLINE_COLORS[course.discipline];
        return (
          <Link
            key={course.href}
            href={course.href}
            className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[19px] border border-black/8 transition hover:border-black/20 hover:shadow-sm sm:w-[300px] md:w-[320px]"
            style={{ backgroundColor: colors.tint }}
          >
            <div className="relative h-44 sm:h-48">
              <Image
                src={course.image}
                alt={course.title}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <Image
                src={course.word}
                alt=""
                width={course.wordW}
                height={course.wordH}
                className="h-7 w-auto object-contain object-left"
              />
              <h3 className="mt-4 text-lg font-bold leading-snug text-black/90 sm:text-xl">
                {course.title}
              </h3>
              <p className="mt-2 text-base leading-snug text-black/65">{course.blurb}</p>
              <span
                className="mt-auto pt-6 text-base font-semibold underline underline-offset-2 sm:text-lg"
                style={{ color: colors.fg }}
              >
                Voir le cours et les dates →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function PhotoMosaic({ images }: { images: string[] }) {
  const [a, b, c, d, e, f] = images;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <ImageTile src={a} alt="" className="col-span-2 h-52 md:h-72" />
      <ImageTile src={b} alt="" className="h-52 md:h-72" />
      <ImageTile src={c} alt="" className="h-52 md:h-72" />
      <ImageTile src={d} alt="" className="h-40 md:h-56" />
      <ImageTile src={e} alt="" className="h-40 md:h-56" />
      <ImageTile src={f} alt="" className="col-span-2 h-40 md:h-56" />
    </div>
  );
}

export function VisitBanner({
  emphasize = false,
  reserveHref = "/reserver",
}: {
  emphasize?: boolean;
  reserveHref?: string;
}) {
  return (
    <section className="bg-white px-5 py-4 md:py-5">
      <div
        className={`mx-auto flex max-w-[1274px] flex-col gap-3 rounded-[14px] border px-4 py-3.5 md:flex-row md:items-center md:justify-between md:gap-5 md:px-5 md:py-4 ${
          emphasize
            ? "border-[#f56800]/35 bg-[#fff3e8]"
            : "border-black/10 bg-[#fff8f0]"
        }`}
      >
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.3px] text-[#f56800] md:text-xl">
            Venez découvrir l&apos;atelier
          </h2>
          <p className="mt-1 text-sm leading-snug text-black/65 md:text-base">
            Mardi 18h30–19h — gratuit, sur inscription.
          </p>
        </div>
        <PrimaryCta
          href={reserveHref}
          className="shrink-0 self-start px-4 py-2 text-sm md:self-auto md:text-base"
        >
          Réserver une visite
        </PrimaryCta>
      </div>
    </section>
  );
}

/** Gift / carte cadeau — courses or credit packs as presents */
export function GiftOfferBanner({
  courseHref = "/offrir",
}: {
  courseHref?: string;
} = {}) {
  return (
    <section className="border-y border-black/10 bg-white">
      <div className="mx-auto grid max-w-[1274px] gap-8 px-5 py-12 md:grid-cols-[1fr_1.1fr] md:items-center">
        <ImageTile
          src={P.portrait15}
          alt="Portrait atelier — idée cadeau"
          className="h-56 md:h-72"
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#d73459]">
            Carte cadeau
          </p>
          <h2 className="mt-2 text-[28px] font-bold leading-tight text-black/90 md:text-[32px]">
            Je veux offrir Manufacto
          </h2>
          <p className="mt-4 text-lg leading-normal text-black/75 md:text-xl">
            Offrez un cours de montée en compétence, ou un pack de crédits pour
            la pratique libre. Les crédits sont valables un an — une très bonne
            idée pour faire découvrir l&apos;atelier.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryCta href={courseHref}>Offrir un cours</PrimaryCta>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InstagramStrip() {
  const shots = [
    P.portrait13,
    P.portrait18,
    P.portrait22,
    P.ig2,
    P.ig3,
    P.pl30,
    P.pl24,
    P.tarifSquare,
  ];
  return (
    <section className="mx-auto max-w-[1274px] px-5 pb-20 text-center">
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-[34px] font-bold leading-none tracking-[-1px] text-[#4a56dd] sm:text-[50px]"
      >
        manufacto.marseille
      </a>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {shots.map((src) => (
          <ImageTile key={src} src={src} alt="" className="h-[160px] md:h-[240px]" />
        ))}
      </div>
      <p className="mt-8 text-xl leading-normal text-black/75">
        Suivez-nous sur Instagram pour suivre nos actualités.
      </p>
    </section>
  );
}

export function BrandLockup({ className = "" }: { className?: string }) {
  return <Logo className={`h-12 w-auto md:h-16 ${className}`} />;
}
