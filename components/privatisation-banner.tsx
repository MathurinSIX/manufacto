/** Privatization / custom course note — shared on homepage and contact. */
export function PrivatisationBanner({ className = "" }: { className?: string } = {}) {
  return (
    <section className={`bg-white px-5 py-4 md:py-5 ${className}`}>
      <div className="mx-auto max-w-[1274px] rounded-[14px] border border-black/10 bg-[#f0f1ff] px-4 py-4 md:px-5 md:py-5">
        <div className="min-w-0 max-w-3xl">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.3px] text-[#4a56dd] md:text-xl">
            Vous voulez privatiser un cours ou avoir une proposition sur-mesure&nbsp;?
          </h2>
          <p className="mt-2 text-sm leading-snug text-black/65 md:text-base">
            Tous les cours de notre catalogue peuvent être privatisés (teambuilding,
            évènement, anniversaire…). Nous pouvons aussi vous proposer un cours
            sur-mesure. En fonction du nombre de personnes, de votre budget, de vos
            envies et du temps dont vous disposez, nous vous proposerons une ou
            plusieurs thématiques.
          </p>
          <p className="mt-2 text-sm text-black/60 md:text-base">
            Devis sur demande&nbsp;:{" "}
            <a
              href="mailto:contact@manufacto-marseille.fr"
              className="font-semibold text-[#4a56dd] underline"
            >
              contact@manufacto-marseille.fr
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
