import { CuissonOfferDetail } from "@/components/cuisson-offer-detail";

/** Collapsed equipment / kiln detail for experts — not the main marketing pitch. */
export function ExpertEquipmentDetails({
  kind,
  accent = "#4a56dd",
}: {
  kind: "menuiserie" | "couture" | "ceramique" | "cuisson";
  accent?: string;
}) {
  const label =
    kind === "cuisson"
      ? "Détail cuisson & four"
      : kind === "ceramique"
        ? "Outils & matières (détail)"
        : kind === "couture"
          ? "Machines (détail)"
          : "Machines & outillage (détail)";

  return (
    <details className="mt-4 max-w-3xl rounded-[12px] border border-black/10 bg-white/70 px-4 py-3">
      <summary
        className="cursor-pointer list-none text-sm font-semibold underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden"
        style={{ color: accent }}
      >
        {label}
        <span className="ml-1 font-normal text-black/40">— pour les expert·es</span>
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-black/70">
        {kind === "menuiserie" ? (
          <>
            <p className="mb-3">
              Postes de travail et établis réservables, plus un espace machines
              stationnaires.
            </p>
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <ul className="list-disc space-y-1 pl-5">
                <li>dégau / rabo</li>
                <li>scie à format</li>
                <li>scie à ruban</li>
                <li>perceuse à colonne</li>
                <li>mortaiseuse à bédane</li>
                <li>tour à bois</li>
                <li>défonceuse sous table</li>
                <li>scie à onglet</li>
              </ul>
              <ul className="list-disc space-y-1 pl-5">
                <li>défonceuses</li>
                <li>affleureuses</li>
                <li>perceuses &amp; visseuses</li>
                <li>lamello</li>
                <li>ponceuses (orbitales, à bandes)</li>
                <li>outillage à main classique</li>
              </ul>
            </div>
          </>
        ) : null}
        {kind === "couture" ? (
          <ul className="list-disc space-y-1 pl-5">
            <li>piqueuses industrielles</li>
            <li>machines à coudre familiales</li>
            <li>surjeteuse</li>
            <li>consommables de base vendus sur place (fils, thermocollant…)</li>
          </ul>
        ) : null}
        {kind === "ceramique" ? (
          <ul className="list-disc space-y-1 pl-5">
            <li>petit outillage à main (ébauchoirs, estèques…)</li>
            <li>four</li>
            <li>émaux, engobes</li>
            <li>terres grès</li>
          </ul>
        ) : null}
        {kind === "cuisson" ? <CuissonOfferDetail /> : null}
      </div>
    </details>
  );
}
