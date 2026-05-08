import Image from "next/image";
import {
  MarketingPageContainer,
  MarketingPageHeader,
  MarketingSectionTitle,
} from "@/components/marketing";
import { OfferCardTabs } from "@/components/offer-card-tabs";
import { CourseFooter } from "../cours/course-layout";

const stepCards = [
  {
    number: "1.",
    title: "Achetez un pass manufacto,",
    text: " que vous chargez avec le nombre de crédits de votre choix.",
  },
  {
    number: "2.",
    title: "Avant votre première venue, nous vous enverrons un lien pour vous inscrire à une visite détaillée",
    text: " de l’atelier. Elle sera l’occasion de se rencontrer, de vous faire faire le tour des lieux et de vous expliquer comment l’atelier fonctionne.",
  },
  {
    number: "3.",
    title: "Réservez vos prochains créneaux / cours.",
    text: " Vous serez débité du nombre de crédits correspondant, le solde reste disponible pour une prochaine fois, sur votre espace en ligne.",
  },
];

const disciplineRows = [
  ["menuiserie", "text-[#f56800]"],
  ["couture", "text-[#4a56dd]"],
  ["céramique", "text-[#d73459]"],
  ["électronique", "text-[#20b75a]"],
];

const menuiserieOffers = [
  {
    title: "Aide à la conception",
    summary:
      "Ce créneau d’une heure permet d’être accompagné par un professionnel dans la phase de conception du projet.",
    detail:
      "En menuiserie, la phase de conception est une étape essentielle du projet. Réfléchir à ses plans, à ses assemblages, préparer ses fiches de débit, sont des étapes fondamentales avant de s’engager dans un projet, et permettent de se donner toutes les chances de réussir à le mener à bien.\nLes créneaux de préparation au projet sont des créneaux dédiés à cette réflexion, accompagnés d’un professionnel. Nous vous accompagnons pour réfléchir à votre projet, échanger sur ses orientations, commenter vos plans et vérifier qu’ils correspondent bien à vos ambitions et à vos compétences.\n\nBien préparer son projet en amont, c’est gagner beaucoup de temps une fois que vous commencerez à lui donner vie.\nSi vous débutez, nous vous invitons vivement à prendre quelques séances de préparation au projet pour apprendre à mener à bien un projet de menuiserie, dès les premières étapes.\n\nTarif :\n4 crédits / heure.\n\nCréneaux disponibles :\nmardi de 17h à 18h\nmercredi, de 17h à 19h",
  },
  {
    title: "Autonomie encadrée",
    summary:
      "Des créneaux à réserver pour donner vie à votre projet, tout en ayant un encadrant technique de référence que vous pourrez mobiliser si nécessaire.",
    detail:
      "A la différence de l’autonomie complète, lors des créneaux d’autonomie encadrée, un encadrant technique est présent dans l’espace établi, et peut répondre à vos questions si besoin est. Cette personne de référence peut-être mobilisée pour vous conseiller sur certaines étapes de votre projet, vous donner un regard sur la manière dont vous envisagez de le réaliser, vous conseiller sur l’utilisation de certaines machines.\nEn revanche, ces créneaux n’ont pas vocation à vous apprendre à utiliser des machines spécifiques, ni à faire votre projet à votre place. Si vous voulez apprendre à utiliser de nouveaux outils, réservez plutôt le cours de montée en compétences correspondant.\n\nTarif :\n3 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 18h à 20h\nmercredi, de 19h à 21h",
  },
  {
    title: "Autonomie complète",
    summary:
      "Des créneaux à réserver pour passez à la phase de réalisation de votre projet, et si vous vous sentez autonome pour le mener à bien.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. L’autonomie complète s’adresse à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique mobilisable. Sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet dans les espaces établis.\n\nL’autonomie n’est pas un statut en soi : vous pouvez tout à fait alterner des créneaux d’autonomie encadrée avec des créneaux d’autonomie complète, selon les phases de votre projet. C’est à vous de juger de vos compétences par rapport à un objectif donné.\n\nTarif :\n2 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 9h à 13h et de 17h à 21h\njeudi, de 13h à 17h,\nvendredi, de 9h à 17h,\nsamedi*, de 13h à 17h, et parfois le matin (selon calendrier)\nnous sommes fermés les derniers samedi du mois.",
  },
];

const coutureOffers = [
  {
    title: "Autonomie encadrée",
    summary:
      "Des créneaux à réserver pour donner vie à votre projet, tout en ayant un encadrant technique de référence que vous pourrez mobiliser si nécessaire.",
    detail:
      "A la différence de l’autonomie complète, lors des créneaux d’autonomie encadrée, un encadrant ou une encadrante est présente dans l’espace couture, et peut répondre à vos questions si besoin est. Cette personne de référence peut-être mobilisée pour vous conseiller sur certaines étapes de votre projet, vous donner un regard critique sur la manière dont vous envisagez de le réaliser, vous conseiller sur l’utilisation de certaines techniques.\nCes créneaux n’ont pas vocation, en revanche, à vous apprendre à utiliser des machines spécifiques, ni à faire votre projet à votre place.\n\nTarif :\n2 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 18h à 20h\nmercredi, de 9h à 12h\njeudi, de 19h à 21h",
  },
  {
    title: "Autonomie complète",
    summary:
      "Des créneaux à réserver pour réaliser vos projets, dès que vous vous sentez autonome pour le mener à bien.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. L’autonomie complète s’adresse à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique mobilisable. Sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet.\nL’autonomie complète n’est pas un statut en soi : vous pouvez tout à fait réserver des créneaux en autonomie complète sur certains projets, ou étapes de votre projet, et préférer l’autonomie encadrée une prochaine fois. C’est à vous de juger de vos compétences par rapport à un objectif donné.\n\nTarif :\n1 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 17h à 21h\njeudi, de 13h à 21h\nvendredi, de 9h à 17h\nsamedi, de 9h à 12h et de 13h à 17h",
  },
];

const ceramiqueOffers = [
  {
    title: "Autonomie complète",
    summary:
      "Des créneaux à réserver pour donner vie à vos projets, de manière autonome.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. En céramique, nous ne proposons que des créneaux d’autonomie complète, qui s’adressent à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique.\nL’équipe de manufacto est toujours présente dans les locaux, mais sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet.\nLa cuisson est incluse dans le tarif pour les pièces qui seront réalisées à l’atelier.\n\nTarif :\n2 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 9h à 21h\njeudi, de 13h à 21h\nvendredi, de 9h à 17h\nsamedi, de 9h à 12h et de 13h à 17h",
  },
  {
    title: "Cuisson",
    summary:
      "Cuisez les pièces que vous avez réalisées hors de l’atelier. Elles sont incluses pour les pièces ayant été réalisées chez nous.",
    detail:
      "À manufacto, vous pouvez cuire les pièces que vous réalisez. Le four peut être réservé en totalité, ou partiellement.\nSeules certaines terres sont acceptées : Faïence, grès, porcelaine\n(sont exclus : terre de papier, riz, métaux, autres matériaux). Pour chaque cuisson, la fiche technique détaillée présente sur l’emballage (type de terre, température etc) sera demandée.\n⚠️ En l’absence de ces informations, la cuisson ne pourra pas être acceptée.\nL'enfournement est exclusivement réservé au responsable d’atelier. Chaque élément sera vérifié avant la cuisson pour éviter tout risque d’explosion durant le cycle du four.\n\nTypes de cuisson proposées :\nbiscuit : 980°C\némail faïence : 1020°C – 1050°C\némail grès ou porcelaine : 1260°C -1280°C\nCaractéristiques du four :\nFour à céramique Nabertherm – 280L\nDimensions intérieures : 520mm(L) / 580mm(P) / 720mm(H)\nDimensions estimatives 1/3 four : 520mm(L) / 290mm(P) / 360mm(H)\nDimensions des plaques de cuissons : 550 mm (P) x 400 mm (l)\nFonctionnement\nDépôts sur rendez-vous, par mail ou via le calendrier en ligne (voir ci-dessous)\n\nTarif :\n⅓ de four : 36€\nfour complet : 60€",
  },
];

const electroniqueOffers = [
  {
    title: "Autonomie complète",
    summary:
      "Des créneaux à réserver pour donner vie à vos projets, de manière autonome.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. En électronique, nous ne proposons que des créneaux d’autonomie complète, qui s’adressent à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique.\nL’équipe de manufacto est toujours présente dans les locaux, mais sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet. Vous aurez accès à l’espace et aux outils nécessaires pour réparer ou fabriquer de petits objets électriques / électroniques.\n\nTarif :\n1 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 17h à 21h\njeudi, de 13h à 21h\nvendredi, de 9h à 17h\nsamedi, de 9h à 12h et de 13h à 17h",
  },
  {
    title: "Repair café",
    summary:
      "Des créneaux collectifs pour vous aider à réparer vos petits objets ménagers.",
    detail:
      "Les Repair Café, ce sont des moments conviviaux et collectifs pour apprendre à réparer ensemble. Vous venez avec un objet abîmé, et vous apprendrez, épaulé par nos bénévoles, à le réparer et à lui donner une deuxième vie.\n\nTarif :\nprix libre. Une adhésion à l’association vous sera demandée sur place.\n\nCréneaux disponibles :\nvoir le calendrier",
  },
];

const ASSETS = {
  starGreen: "/assets/stars/star_verte.png",
  starRed: "/assets/stars/star_rouge.png",
  starYellow: "/assets/stars/star_jaune.png",
  arrow: "/assets/fleches/orange/arrow_up_top_right.png",
} as const;

function InfoSection({
  title,
  star,
  children,
}: {
  title: string;
  star: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative border-t border-black/45 py-7">
      <Image
        src={star}
        alt=""
        width={100}
        height={100}
        className="absolute -right-6 top-3 h-20 w-20 object-contain"
        aria-hidden
      />
      <h3 className="mb-5 text-xl font-bold leading-tight text-black">
        {title}
      </h3>
      <div className="max-w-[1130px] space-y-4 pr-20 text-base leading-normal text-black/75">
        {children}
      </div>
    </section>
  );
}

function Placeholder({ className = "" }: { className?: string }) {
  return <div className={`bg-[#d9d9d9] ${className}`} />;
}

function PratiqueLibreContent() {
  return (
    <MarketingPageContainer className="pb-20 md:pb-[140px]">
      <MarketingPageHeader title="La pratique libre" className="max-w-[1180px]">
        <p>
          Manufacto est un atelier partagé, ouvert à toutes et tous.
          <br />
          La pratique libre vous permet d&apos;avoir{" "}
          <strong>accès à un espace de travail selon votre besoin</strong>, et
          pour la durée que vous souhaitez (dans la limite de nos heures
          d&apos;ouvertures). Vous y êtes maître de votre projet pour le temps de
          votre réservation, et aurez{" "}
          <strong>accès aux machines et équipements de l&apos;atelier.</strong>
        </p>
        <p>
          Notre offre varie selon les univers techniques.
        </p>
      </MarketingPageHeader>

      <section className="mt-16">
        <div>
          {disciplineRows.map(([label, color]) => (
            <details
              key={label}
              name="practice-universe"
              className="group border-b border-black/45"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[30px] font-bold leading-tight [&::-webkit-details-marker]:hidden">
                <span className={color}>{label}</span>
                <span className="text-3xl font-light leading-none text-black/55 transition group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              {label === "menuiserie" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace menuiserie est organisé autour de plusieurs
                        postes de travail et établis, que chacun peut réserver
                        pour la durée et l&apos;usage de son choix, ainsi que
                        d&apos;un espace réservé aux machines stationnaires.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Outils &amp; machines à disposition :
                      </h3>
                      <div className="mt-6 grid max-w-[690px] gap-x-12 gap-y-1 text-xl leading-normal text-black/75 sm:grid-cols-2">
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
                          <li>...</li>
                        </ul>
                      </div>

                      <p className="mt-10 max-w-[690px] text-xl leading-normal text-black/75">
                        Nous vendons sur place les consommables de base si
                        nécessaire (papier à poncer, vis...) mais nous vous
                        recommandons fortement de venir avec ce dont vous aurez
                        besoin pour votre projet.
                      </p>
                    </div>

                    <Placeholder className="min-h-[560px] rounded-[18px]" />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs offers={menuiserieOffers} columns={3} />
                  </section>
                </div>
              ) : null}
              {label === "couture" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace couture est organisé autour de plusieurs
                        tables de travail et tables de coupe, que chacun peut
                        réserver pour la durée et l&apos;usage de son choix.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Machines à disposition :
                      </h3>
                      <ul className="mt-10 max-w-[690px] list-disc space-y-1 pl-5 text-xl leading-normal text-black/75">
                        <li>piqueuse industrielle (PFAFF 463)</li>
                      </ul>

                      <p className="mt-24 max-w-[690px] text-xl leading-normal text-black/75">
                        Nous vendons sur place les consommables de base si
                        nécessaire (fils, thermocollant...) mais nous vous
                        recommandons fortement de venir avec ce dont vous aurez
                        besoin pour votre projet.
                      </p>
                    </div>

                    <Placeholder className="min-h-[560px] rounded-[18px]" />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs offers={coutureOffers} columns={2} />
                  </section>
                </div>
              ) : null}
              {label === "céramique" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace céramique est organisé autour de plusieurs
                        tables de travail et tours, que chacun peut réserver
                        pour la durée et l&apos;usage de son choix.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Outils &amp; machines à disposition :
                      </h3>
                      <ul className="mt-10 max-w-[690px] list-disc space-y-1 pl-5 text-xl leading-normal text-black/75">
                        <li>
                          petit outillage à main (ébauchoirs, estèques,
                          rouleaux, mirettes, tournassins, poires à engobe,
                          etc.)
                        </li>
                        <li>
                          tables de travail pour le modelage et l’assemblage
                        </li>
                        <li>four</li>
                      </ul>

                      <p className="mt-24 max-w-[690px] text-xl leading-normal text-black/75">
                        La terre peut être achetée sur place si nécessaire, de
                        même que l&apos;émail et les englobes.
                      </p>
                    </div>

                    <Placeholder className="min-h-[560px] rounded-[18px]" />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs offers={ceramiqueOffers} columns={2} />
                  </section>
                </div>
              ) : null}
              {label === "électronique" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace électronique est organisé autour de
                        plusieurs tables de travail, que chacun peut réserver
                        pour la durée et l&apos;usage de son choix.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Outils à disposition :
                      </h3>
                      <ul className="mt-10 max-w-[690px] list-disc space-y-1 pl-5 text-xl leading-normal text-black/75">
                        <li>XXX</li>
                        <li>XXX</li>
                        <li>XXX</li>
                        <li>XXX</li>
                      </ul>
                    </div>

                    <Placeholder className="min-h-[560px] rounded-[18px]" />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs offers={electroniqueOffers} columns={2} />
                  </section>
                </div>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <MarketingSectionTitle className="mb-8 text-black">
          Fonctionnement
        </MarketingSectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          {stepCards.map((card) => (
            <article
              key={card.number}
              className="min-h-[286px] rounded-[28px] bg-[#fff8f0] px-8 py-10"
            >
              <p className="text-[72px] font-normal leading-none text-[#f56800]">
                {card.number}
              </p>
              <p className="mt-6 text-xl leading-normal text-black/75">
                <strong className="text-black/80">{card.title}</strong>
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="mb-9 text-[30px] font-bold leading-tight text-[#f56800]">
          Ce qu&apos;il faut savoir avant de venir à l&apos;atelier :
        </h2>

        <InfoSection title="La gestion du temps" star={ASSETS.starGreen}>
          <p>
            La durée minimale de réservation en pratique libre est de{" "}
            <strong>deux heures consécutives.</strong>
            <br />
            Vous pouvez ensuite, <strong>par palier d&apos;une heure</strong>,
            rester aussi longtemps que nos horaires le permettent.
          </p>
          <p>
            Le temps de rangement et de nettoyage de votre espace est compris
            dans cette durée. Votre poste de travail doit être rendu propre et
            rangé, outils inclus, afin de le laisser propre et dégagé pour la
            personne suivante.
          </p>
        </InfoSection>

        <InfoSection title="La sécurité" star={ASSETS.starRed}>
          <p>
            <strong>
              La sécurité est un point essentiel du fonctionnement de l&apos;atelier.
            </strong>
          </p>
          <p>
            Pour venir pratiquer, vous devez avoir{" "}
            <strong>une assurance responsabilité civile à jour.</strong>
            <br />
            Des EPI sont disponibles sur place (casque anti-bruit, lunette et
            embout de chaussure de sécurité). Toutefois, si vous êtes un
            pratiquant régulier, nous vous invitons à venir avec votre
            équipement.
          </p>
          <p>
            Certaines machines en menuiserie notamment, ne sont accessibles
            qu&apos;après avoir réalisé la formation les concernant, ou être
            capable de justifier de la capacité à les utiliser.
          </p>
          <p>
            Pour les autres, il est primordial de{" "}
            <strong>ne pas utiliser des machines que l&apos;on ne maîtrise pas</strong>,
            et dans tous les cas, d&apos;être très vigilant lors de leur
            utilisation.
          </p>
        </InfoSection>

        <InfoSection title="Les matières premières" star={ASSETS.starYellow}>
          <p>
            <strong>Bois &amp; textile :</strong> manufacto met à disposition des
            matières premières de réemploi, selon les arrivages et stocks de
            nos recycleries partenaires. Une fois à l&apos;atelier, vous pouvez
            utiliser ce que vous souhaitez parmi les stocks mis à disposition.
            Aucune réservation ne pourra être prise en amont, et nous ne
            pouvons pas garantir la présence de pièces spécifiques.
          </p>
          <p>
            <strong>Terre :</strong> vous pouvez acheter de la terre chez nous
            directement, tout comme vos émaux.
            <br />
            DÉTAIL DES TERRES &amp; ÉMAUX VENDUS
            <br />
            Si vous voulez retrouver le détail des terres que vous pouvez cuire
            à l&apos;atelier, vous pouvez consulter notre page cuisson.
          </p>
        </InfoSection>
      </section>

      <section className="mt-10">
        <h2 className="mb-6 text-[30px] font-bold leading-tight text-[#f56800]">
          Les questions fréquentes
        </h2>

        <div className="border-t border-black/45">
          <details open className="group border-b border-black/45 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold leading-tight [&::-webkit-details-marker]:hidden">
              Est-ce que je peux stocker des pièces à l&apos;atelier ?
              <span className="text-2xl font-normal group-open:rotate-180">⌃</span>
            </summary>
            <div className="mt-5 max-w-[1120px] space-y-4 text-base leading-normal text-black/75">
              <p>
                Les abonnés disposent d&apos;un espace de stockage pour la durée de
                leur abonnement. Pour les pratiquants plus ponctuels, vous
                pouvez disposer d&apos;un espace de stockage en cas de réservation
                sur plusieurs jours consécutifs (dans la limite d&apos;une semaine
                d&apos;écart entre deux réservations).
              </p>
              <p>
                Passé ce délai, le stockage sera facturé à hauteur de :<br />
                8€ / semaine pour un casier étagère &amp; 15€ / semaine dans
                l&apos;espace 3D. Le stockage s&apos;achète uniquement sur place.
              </p>
            </div>
          </details>

          <details className="group border-b border-black/45 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold leading-tight [&::-webkit-details-marker]:hidden">
              Est-ce que je peux annuler ma réservation ?
              <span className="text-2xl font-normal group-open:rotate-180">⌃</span>
            </summary>
            <div className="mt-5 max-w-[1120px] text-base leading-normal text-black/75">
              <p>
                Vous pouvez annuler votre réservation jusqu&apos;à 24h avant.
                Passé ce délai, 50% de vos crédits seront débités.
              </p>
            </div>
          </details>

          <details className="group border-b border-black/45 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold leading-tight [&::-webkit-details-marker]:hidden">
              Je ne sais pas exactement quel espace réserver pour mon projet,
              que faire ?
              <span className="text-2xl font-normal group-open:rotate-180">⌃</span>
            </summary>
            <div className="mt-5 max-w-[1120px] space-y-4 text-base leading-normal text-black/75">
              <p>
                Tout dépend des machines que vous allez utiliser. Tout ce qui
                est propre et silencieux peut être fait dans l&apos;espace
                couture. Dès lors que votre projet, ou étape de projet,
                nécessite une machine bruyante qui fait de la poussière, alors
                réservez plutôt en menuiserie.
              </p>
              <p>
                Si vous avez un doute, passez sur place ou envoyez-nous un mail
                pour que l&apos;on en discute !
              </p>
            </div>
          </details>
        </div>
      </section>
    </MarketingPageContainer>
  );
}

export default function PratiqueLibrePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <PratiqueLibreContent />
      <CourseFooter />
    </main>
  );
}
