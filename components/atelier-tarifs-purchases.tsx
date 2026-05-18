import { DiscoveryPackReservationButton } from "@/components/discovery-pack-reservation-button";
import { SquareCheckoutButton } from "@/components/square-checkout-button";
import { loadSquareProducts } from "@/lib/square/load-products";
import { createClient } from "@/lib/supabase/server";

const DISCOVERY_PACKS = [
  {
    productId: "decouverte-couture",
    activityName: "Couture en autonomie encadrée",
    title: "Pack découverte couture",
    price: "15€",
    line1: "2h de couture en",
    line2: "autonomie encadrée",
  },
  {
    productId: "decouverte-menuiserie",
    activityName: "Menuiserie en autonomie encadrée",
    title: "Pack découverte menuiserie",
    price: "30€",
    line1: "2h de menuiserie en",
    line2: "autonomie encadrée",
  },
] as const;

const discoveryCheckoutButtonClassName =
  "mt-3 inline-flex w-full shrink-0 justify-center rounded-[12px] bg-[#4a56dd] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3d47c4] disabled:cursor-not-allowed disabled:opacity-60";

const ATELIER_SUBSCRIPTION_PLANS = [
  {
    id: "formule-01",
    label: "abonnement 01",
    price: "90€",
    credits: "20 crédits",
    copy: "L’abonnement idéal si vous voulez utiliser l’espace couture ou électronique de manière régulière.",
  },
  {
    id: "formule-02",
    label: "abonnement 02",
    price: "170€",
    credits: "40 crédits",
    copy: "L’abonnement idéal si vous avez une pratique intermédiaire, et que vous voulez utilisez nos différents espaces régulièrement.",
  },
  {
    id: "formule-03",
    label: "abonnement 03",
    price: "240€",
    credits: "60 crédits",
    copy: "L’abonnement idéal si vous avez une pratique intensive de la menuiserie ou de la céramique.",
  },
] as const;

const creditPackPriceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const checkoutButtonClassName =
  "inline-flex w-full shrink-0 justify-center rounded-[12px] bg-[#f56800] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#d95700] disabled:cursor-not-allowed disabled:opacity-60";

const ATELIER_TARIFS_RETURN_PATH = "/atelier#tarifs";

type TarifsPurchaseProps = {
  returnPath?: string;
};

export async function AtelierDiscoveryPackGrid({
  returnPath = ATELIER_TARIFS_RETURN_PATH,
}: TarifsPurchaseProps = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activities } = await supabase
    .from("activity")
    .select("id, name")
    .in(
      "name",
      DISCOVERY_PACKS.map((pack) => pack.activityName),
    )
    .is("deleted_at", null);

  const activityIdByName = new Map(
    (activities ?? []).map((activity) => [activity.name, activity.id]),
  );

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {DISCOVERY_PACKS.map((pack) => {
        const activityId = activityIdByName.get(pack.activityName);

        return (
          <div
            key={pack.productId}
            className="flex min-h-[155px] flex-col items-center justify-center rounded-[14px] border border-[#4a56dd]/70 bg-[#fff8f0] p-3 text-center"
          >
            <p className="text-[34px] leading-none">{pack.price}</p>
            <p className="text-lg font-semibold leading-none">{pack.line1}</p>
            <p className="text-lg leading-none">{pack.line2}</p>
            {activityId ? (
              <DiscoveryPackReservationButton
                activityId={activityId}
                activityTitle={pack.title}
                productId={pack.productId}
                isLoggedIn={!!user}
                label="Acheter"
                className={discoveryCheckoutButtonClassName}
              />
            ) : (
              <p className="mt-3 text-xs leading-snug text-black/50">
                Créneaux indisponibles
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export async function AtelierCreditPackGrid({
  returnPath = ATELIER_TARIFS_RETURN_PATH,
}: TarifsPurchaseProps = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const products = await loadSquareProducts(supabase);
  const creditPacks = products
    .filter((product) => product.kind === "credit_pack")
    .sort((a, b) => a.amountCents - b.amountCents);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {creditPacks.map((pack) => (
        <div
          key={pack.id}
          className="flex min-h-[155px] flex-col items-center justify-center rounded-[14px] border border-[#f56800]/70 bg-[#fff8f0] p-3 text-center"
        >
          <p className="text-[34px] leading-none">
            {creditPackPriceFormatter.format(pack.amountCents / 100)}
          </p>
          <p className="text-lg leading-none">
            {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
          </p>
          {pack.catalogObjectId ? (
            <SquareCheckoutButton
              productId={pack.id}
              isLoggedIn={!!user}
              returnPath={returnPath}
              className={`mt-3 ${checkoutButtonClassName}`}
            >
              Acheter
            </SquareCheckoutButton>
          ) : (
            <p className="mt-3 text-xs leading-snug text-black/50">
              Paiement indisponible
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export async function AtelierSubscriptionList({
  returnPath = ATELIER_TARIFS_RETURN_PATH,
}: TarifsPurchaseProps = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-3">
      {ATELIER_SUBSCRIPTION_PLANS.map((plan) => (
        <div
          key={plan.id}
          className="grid gap-4 rounded-[14px] border border-[#f56800]/70 bg-[#fff8f0] px-6 py-5 text-left md:grid-cols-[160px_1fr_auto] md:items-center"
        >
          <div className="text-center md:text-left">
            <p className="text-lg text-[#c97a25]">{plan.label}</p>
            <p className="mt-2 text-[34px] leading-none">{plan.price}</p>
            <p className="whitespace-nowrap text-xl leading-none">
              {plan.credits}
              {" / mois"}
            </p>
          </div>
          <p className="text-sm leading-snug text-black/75">{plan.copy}</p>
          <SquareCheckoutButton
            productId={plan.id}
            isLoggedIn={!!user}
            returnPath={returnPath}
            className={`md:w-auto ${checkoutButtonClassName} md:px-5 md:py-3 md:text-sm`}
          >
            Souscrire
          </SquareCheckoutButton>
        </div>
      ))}
    </div>
  );
}
