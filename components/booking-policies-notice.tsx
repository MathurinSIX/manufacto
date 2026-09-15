/** Compact policies shown at credit purchase / session booking. */
export function BookingPoliciesNotice({
  context = "booking",
  className = "",
}: {
  context?: "booking" | "purchase";
  className?: string;
}) {
  return (
    <details
      className={`rounded-[12px] border border-black/10 bg-[#fff8f0]/80 px-3 py-2 text-left text-xs leading-relaxed text-black/65 ${className}`}
    >
      <summary className="cursor-pointer list-none font-semibold text-black/75 [&::-webkit-details-marker]:hidden">
        Conditions importantes
        <span className="ml-1 font-normal text-black/45">(annulation, atelier…)</span>
      </summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        <li>
          Annulation en ligne uniquement <strong>plus de 48&nbsp;h</strong> avant
          le créneau ; sinon contactez l&apos;atelier.
        </li>
        {context === "booking" ? (
          <>
            <li>
              Assurance <strong>responsabilité civile</strong> à jour obligatoire.
              EPI disponibles sur place (casque, lunettes, embouts) ; en menuiserie,
              chaussures fermées.
            </li>
            <li>
              Certaines machines ne sont accessibles qu&apos;après formation ou
              justification — ne pas utiliser ce que l&apos;on ne maîtrise pas.
            </li>
            <li>
              Stockage : abonnés pour la durée de l&apos;abo ; ponctuels jusqu&apos;à
              1&nbsp;semaine entre deux résas, puis 8€/sem (casier) ou 15€/sem
              (espace 3D), sur place.
            </li>
            <li>
              Bois &amp; textile : matières de réemploi selon stocks (pas de
              réservation). Terre &amp; émaux : achat possible sur place.
            </li>
          </>
        ) : (
          <>
            <li>Les crédits sont <strong>valables un an</strong> à partir de l&apos;achat.</li>
            <li>
              <strong>15&nbsp;%</strong> de réduction (étudiants, chômage, RSA) —
              uniquement pour les paiements <strong>sur place</strong>.
            </li>
            <li>
              Annulation des réservations en ligne uniquement plus de 48&nbsp;h
              avant ; le solde de crédits reste sur votre compte.
            </li>
          </>
        )}
      </ul>
    </details>
  );
}
