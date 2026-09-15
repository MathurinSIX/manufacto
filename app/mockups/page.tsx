import Link from "next/link";
import { MockupSwitcher } from "@/components/mockups/shared";

const SITES = [
  {
    href: "/mockups/mix",
    number: 4,
    title: "Chemin + cours",
    pitch:
      "Trois portes (pratiquer / apprendre / offrir), carousel de cours, calendrier filtrable, pratique libre détaillée.",
    favorite: true,
  },
  {
    href: "/mockups/visite",
    number: 1,
    title: "Visite d'abord",
    pitch:
      "La visite du mardi comme premier pas. Topbar avec CTA « Réserver une visite ».",
    favorite: false,
  },
  {
    href: "/mockups/chemin",
    number: 2,
    title: "Choisis ton chemin",
    pitch:
      "Faire, apprendre ou offrir dès l’accueil. Topbar avec CTA « Carte cadeau ».",
    favorite: false,
  },
  {
    href: "/mockups/sessions",
    number: 3,
    title: "Prochaine session",
    pitch: "Les cours en avant. Topbar avec CTA « Voir les cours ».",
    favorite: false,
  },
] as const;

const PAGES = [
  { path: "", label: "Accueil" },
  { path: "/atelier", label: "L'atelier" },
  { path: "/cours", label: "Cours" },
  { path: "/pratique-libre", label: "Pratique libre" },
  { path: "/offrir", label: "Offrir / carte cadeau" },
  { path: "/contact", label: "Contact & visite" },
] as const;

export default function MockupsHubPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <MockupSwitcher active="hub" />
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4a56dd]">
          Mockups complets
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          Quatre propositions
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-black/75">
          La proposition{" "}
          <Link href="/mockups/mix" className="font-semibold text-[#4a56dd] underline">
            4 · Chemin + cours
          </Link>{" "}
          est maintenant le site principal (
          <Link href="/" className="font-semibold text-[#4a56dd] underline">
            /
          </Link>
          ). L&apos;ancienne homepage reste en archive sur{" "}
          <Link href="/home" className="font-semibold text-[#4a56dd] underline">
            /home
          </Link>
          . Les mockups ci-dessous restent pour comparaison.
        </p>

        <ol className="mt-12 space-y-8">
          {SITES.map((site) => (
            <li
              key={site.href}
              className={`rounded-[19px] border p-6 ${
                site.favorite
                  ? "border-[#4a56dd]/40 bg-[#f0f1ff] ring-2 ring-[#4a56dd]/20"
                  : "border-black/10 bg-[#fff8f0]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#f56800]">
                  Proposition {site.number}
                </span>
                {site.favorite ? (
                  <span className="rounded-full bg-[#4a56dd] px-2.5 py-0.5 text-xs font-semibold text-white">
                    préférée
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 text-2xl font-bold text-black/90">{site.title}</h2>
              <p className="mt-2 text-lg text-black/70">{site.pitch}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {PAGES.map((page) => (
                  <Link
                    key={page.path}
                    href={`${site.href}${page.path}`}
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-[#4a56dd] ring-1 ring-black/10 hover:bg-[#f0f1ff]"
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
