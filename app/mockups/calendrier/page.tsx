import Link from "next/link";
import { CalendarSwitcher } from "@/components/mockups/calendar-proposals";

const PROPOSALS = [
  {
    href: "/mockups/calendrier/agenda",
    label: "A · Agenda",
    title: "Liste chronologique",
    pitch:
      "Un jour après l’autre, photos, horaires et titres en grand. Le plus lisible sur mobile.",
  },
  {
    href: "/mockups/calendrier/points",
    label: "B · Mois + détail",
    title: "Grille allégée + panneau",
    pitch:
      "Le mois en aperçus photo + points. Cliquez une discipline pour n’afficher qu’elle, puis un jour pour le détail.",
  },
  {
    href: "/mockups/calendrier/filtres",
    label: "C · Filtres",
    title: "Agenda filtrable",
    pitch:
      "Choisissez une discipline, puis lisez l’agenda illustré. Pour « je cherche X ».",
  },
] as const;

export default function CalendrierHubPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <CalendarSwitcher active="hub" />
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4a56dd]">
          Calendrier des cours
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.02em] md:text-5xl">
          3 propositions plus lisibles
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-black/75">
          La grille actuelle compressée 7 colonnes est difficile à lire —
          surtout sur téléphone. Données réelles du mois en cours.
        </p>

        <ol className="mt-12 space-y-6">
          {PROPOSALS.map((p, i) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="block rounded-[19px] border border-black/10 bg-[#fff8f0] p-6 transition hover:border-[#4a56dd]/35 hover:bg-[#fff3e8]"
              >
                <span className="text-sm font-semibold text-[#f56800]">
                  Proposition {String.fromCharCode(65 + i)}
                </span>
                <h2 className="mt-1 text-2xl font-bold">{p.title}</h2>
                <p className="mt-2 text-lg text-black/70">{p.pitch}</p>
                <span className="mt-4 inline-block font-semibold text-[#4a56dd] underline underline-offset-2">
                  {p.label} →
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-sm text-black/45">
          Comparer avec l’actuel :{" "}
          <Link href="/#calendrier" className="underline">
            homepage
          </Link>{" "}
          ou{" "}
          <Link href="/cours" className="underline">
            /cours
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
