export function CuissonOfferDetail() {
  return (
    <div className="space-y-4">
      <p>
        À manufacto, vous pouvez cuire les pièces que vous avez réalisées hors de
        l’atelier. Le four se réserve alors en totalité.
      </p>

      <p className="underline">
        Seules les pièces en grès sont pour le moment acceptées.
      </p>

      <p>
        Pour chaque cuisson, la fiche technique détaillée présente sur l’emballage
        (type de terre, température etc) sera demandée.
      </p>

      <p>
        ⚠️ En l’absence de ces informations, la cuisson ne pourra pas être acceptée.
      </p>

      <p>
        L&apos;enfournement est exclusivement réservé au responsable d’atelier.
        Chaque élément sera vérifié avant la cuisson pour éviter tout risque
        d’explosion durant le cycle du four.
      </p>

      <p>
        Prévoir un délai d’un mois entre le dépôt et le retrait des pièces.
      </p>

      <div className="space-y-4 pt-2">
        <p className="font-bold">Types de cuisson proposées :</p>
        <ul className="list-none space-y-4">
          <li>· biscuit : 1000°C</li>
          <li>· émail grès : 1240°C -1280°C</li>
        </ul>
      </div>

      <p>
        Les cuissons extérieures à l&apos;atelier sont faites uniquement en four
        complet. Vous devez indiquer la température de cuisson, biscuit et émail.
        Seul le grès est accepté, et nous ne faisons pas de cuissons de test
        d’émaux.
      </p>

      <div className="space-y-4 pt-2">
        <p className="font-bold">Caractéristiques du four :</p>
        <p>Four à céramique ROHDE TE  – 95L</p>
        <ul className="list-none space-y-1">
          <li>· Dimensions intérieures : 520 x 460</li>
          <li>· Dimensions des plaques de cuissons : 470 de diamètre</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-bold">Fonctionnement</p>
        <p>
          Dépôts les jeudis et vendredis à partir du 25 juin. Sinon prendre
          rendez-vous par mail. Se présenter à l’accueil avant tout accès à
          l’atelier.
        </p>
        <p>
          Pour toute demande spécifique, veuillez envoyer un mail ou venir à
          l’atelier les jeudis et vendredis.
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <p className="font-bold">Tarif :</p>
        <p>four complet : 60€</p>
      </div>
    </div>
  );
}
