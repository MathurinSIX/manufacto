import Image from "next/image";
import Link from "next/link";
import { P } from "@/components/mockups/shared";

type AuthPageShellProps = {
  title: React.ReactNode;
  lead: string;
  children: React.ReactNode;
  /** Soft accent for the star / highlight */
  accent?: "blue" | "orange" | "pink";
};

const ACCENT = {
  blue: P.starBlue,
  orange: P.starOrange,
  pink: P.starRouge,
} as const;

/**
 * Auth screens share the Manufacto cream + atelier atmosphere
 * (site chrome is hidden on /auth).
 */
export function AuthPageShell({
  title,
  lead,
  children,
  accent = "blue",
}: AuthPageShellProps) {
  const star = ACCENT[accent];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8f0] text-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(74,86,221,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 20%, rgba(245,104,0,0.1), transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1274px] flex-col lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <aside className="relative flex min-h-[220px] flex-col justify-between overflow-hidden lg:min-h-screen">
          <Image
            src={P.atelierPeople}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 lg:bg-gradient-to-r lg:from-black/55 lg:via-black/30 lg:to-transparent"
            aria-hidden
          />

          <div className="relative z-10 flex items-start justify-between p-5 md:p-8">
            <Link href="/" className="relative block h-11 w-[148px] md:h-12 md:w-[160px]">
              <Image
                src="/assets/figma-landing/logo-mark.png"
                alt="Manufacto"
                fill
                className="object-contain object-left brightness-0 invert"
                sizes="160px"
                priority
              />
            </Link>
            <Link
              href="/"
              className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              ← Accueil
            </Link>
          </div>

          <div className="relative z-10 hidden max-w-md p-8 text-white lg:block lg:pb-14">
            <p className="text-2xl font-semibold leading-snug tracking-[-0.02em]">
              L&apos;atelier, vos crédits, vos réservations.
            </p>
            <p className="mt-3 text-base text-white/75">
              Menuiserie, couture, céramique, électronique — à Marseille.
            </p>
          </div>
        </aside>

        <section className="relative flex flex-1 flex-col justify-center px-5 py-10 md:px-10 md:py-16 lg:px-14">
          <div className="relative mx-auto w-full max-w-[440px]">
            <Image
              src={star}
              alt=""
              width={96}
              height={80}
              className="absolute -left-3 -top-8 h-12 w-auto object-contain md:-left-6 md:-top-10 md:h-14"
              aria-hidden
            />

            <h1 className="text-[32px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[40px]">
              {title}
            </h1>
            <p className="mt-4 text-lg leading-normal text-black/70">{lead}</p>

            <div className="mt-8 rounded-[19px] border border-black/10 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.35)] md:p-8">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
