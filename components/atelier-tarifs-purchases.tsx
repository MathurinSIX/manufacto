import { CreditPackPurchaseCard } from "@/components/credit-pack-purchase-card";
import { DiscoveryPackReservationButton } from "@/components/discovery-pack-reservation-button";
import {
  DiscoveryPackModalTrigger,
  type DiscoveryPackOption,
} from "@/components/discovery-pack-modal";
import { SquareCheckoutButton } from "@/components/square-checkout-button";
import { loadSquareProducts } from "@/lib/square/load-products";
import { createClient } from "@/lib/supabase/server";

const DISCOVERY_PACKS = [
  {
    discipline: "couture",
    title: "Pack découverte couture",
    price: "15€",
    line1: "2h de couture en",
    line2: "autonomie encadrée",
    accent: "#4a56dd",
    reserveClassName:
      "mt-2 text-sm font-semibold text-[#4a56dd] underline underline-offset-2",
  },
  {
    discipline: "menuiserie",
    title: "Pack découverte menuiserie",
    price: "30€",
    line1: "2h de menuiserie / de céramique en autonomie encadrée",
    line2: "",
    accent: "#f56800",
    reserveClassName:
      "mt-2 text-sm font-semibold text-[#f56800] underline underline-offset-2",
  },
] as const;

const discoveryCheckoutButtonClassName =
  "mt-3 inline-flex w-full shrink-0 justify-center rounded-[12px] bg-[#4a56dd] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3d47c4] disabled:cursor-not-allowed disabled:opacity-60";

const discoveryCheckoutButtonCompactClassName =
  "mt-2 inline-flex w-full shrink-0 justify-center rounded-[10px] bg-[#4a56dd] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#3d47c4] disabled:cursor-not-allowed disabled:opacity-60";

const ATELIER_SUBSCRIPTION_PLANS = [
  {
    id: "formule-01",
    label: "abonnement 01",
    price: "90€",
    credits: "20 crédits",
    copy: "L’abonnement idéal si vous voulez utiliser l’espace couture de manière régulière.",
    summary: "Idéal si vous utilisez l’espace couture régulièrement.",
  },
  {
    id: "formule-02",
    label: "abonnement 02",
    price: "170€",
    credits: "40 crédits",
    copy: "L’abonnement idéal si vous avez une pratique intermédiaire, et que vous voulez utilisez nos différents espaces régulièrement.",
    summary:
      "Pour une pratique intermédiaire dans plusieurs espaces de l’atelier.",
  },
  {
    id: "formule-03",
    label: "abonnement 03",
    price: "240€",
    credits: "60 crédits",
    copy: "L’abonnement idéal si vous avez une pratique intensive de la menuiserie ou de la céramique.",
    summary:
      "Pour une pratique intensive, notamment en menuiserie ou céramique.",
  },
] as const;

const checkoutButtonClassName =
  "inline-flex w-full shrink-0 justify-center rounded-[12px] bg-[#f56800] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#d95700] disabled:cursor-not-allowed disabled:opacity-60";

const ATELIER_TARIFS_RETURN_PATH = "/atelier#tarifs";

type TarifsPurchaseProps = {
  returnPath?: string;
};

export async function DiscoveryPackPremiereVisiteButton({
  className = "",
}: {
  className?: string;
} = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activities } = await supabase
    .from("activity")
    .select("id, discipline, square_product_id")
    .eq("type", "pack_decouverte")
    .in(
      "discipline",
      DISCOVERY_PACKS.map((pack) => pack.discipline),
    )
    .is("deleted_at", null);

  const activityIdByDiscipline = new Map(
    (activities ?? []).map((activity) => [activity.discipline, activity]),
  );

  const packs: DiscoveryPackOption[] = DISCOVERY_PACKS.flatMap((pack) => {
    const activity = activityIdByDiscipline.get(pack.discipline);
    const squareProductId = activity?.square_product_id ?? null;
    if (!activity || !squareProductId) return [];
    return [
      {
        discipline: pack.discipline,
        title: pack.title,
        price: pack.price,
        line1: pack.line1,
        line2: pack.line2,
        activityId: activity.id,
        squareProductId,
      },
    ];
  });

  return (
    <DiscoveryPackModalTrigger
      packs={packs}
      isLoggedIn={!!user}
      label="Pack découvertes"
      className={className}
    />
  );
}

export async function AtelierDiscoveryPackGrid({
  compact = false,
}: {
  compact?: boolean;
} = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activities } = await supabase
    .from("activity")
    .select("id, discipline, square_product_id")
    .eq("type", "pack_decouverte")
    .in(
      "discipline",
      DISCOVERY_PACKS.map((pack) => pack.discipline),
    )
    .is("deleted_at", null);

  const activityIdByDiscipline = new Map(
    (activities ?? []).map((activity) => [activity.discipline, activity]),
  );

  return (
    <div className={`grid gap-2 md:grid-cols-2 ${compact ? "max-w-xl" : ""}`}>
      {DISCOVERY_PACKS.map((pack) => {
        const activity = activityIdByDiscipline.get(pack.discipline);
        const squareProductId = activity?.square_product_id ?? null;

        return (
          <div
            key={pack.discipline}
            className={
              compact
                ? "flex min-h-0 flex-col items-center justify-center rounded-[12px] border border-[#4a56dd]/60 bg-white px-3 py-3 text-center"
                : "flex min-h-[155px] flex-col items-center justify-center rounded-[14px] border border-[#4a56dd]/70 bg-[#fff8f0] p-3 text-center"
            }
          >
            <p className={compact ? "text-[26px] leading-none" : "text-[34px] leading-none"}>
              {pack.price}
            </p>
            <p
              className={
                compact
                  ? "mt-1 text-sm font-semibold leading-tight"
                  : "text-lg font-semibold leading-none"
              }
            >
              {pack.line1}
            </p>
            {pack.line2 ? (
              <p className={compact ? "text-sm leading-tight text-black/75" : "text-lg leading-none"}>
                {pack.line2}
              </p>
            ) : null}
            {activity && squareProductId ? (
              <DiscoveryPackReservationButton
                activityId={activity.id}
                activityTitle={pack.title}
                squareProductId={squareProductId}
                isLoggedIn={!!user}
                label="Acheter"
                className={
                  compact
                    ? discoveryCheckoutButtonCompactClassName
                    : discoveryCheckoutButtonClassName
                }
              />
            ) : (
              <p className="mt-2 text-xs leading-snug text-black/50">
                {activity ? "Produit Square manquant" : "Créneaux indisponibles"}
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
  purchasableOnly = false,
  showPurchaseButton = true,
}: TarifsPurchaseProps & {
  purchasableOnly?: boolean;
  showPurchaseButton?: boolean;
} = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const products = await loadSquareProducts(supabase);
  const creditPacks = products
    .filter(
      (product) =>
        product.kind === "credit_pack" &&
        (!purchasableOnly || product.catalogObjectId),
    )
    .sort((a, b) => a.amountCents - b.amountCents);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
      {creditPacks.map((pack) => (
        <CreditPackPurchaseCard
          key={pack.id}
          productId={pack.id}
          amountCents={pack.amountCents}
          credits={pack.credits}
          catalogObjectId={pack.catalogObjectId}
          isLoggedIn={!!user}
          returnPath={returnPath}
          showPurchaseButton={showPurchaseButton}
          buttonClassName={checkoutButtonClassName}
        />
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
  const products = await loadSquareProducts(supabase);
  const mappedProductIds = new Set(
    products
      .filter((product) => product.kind === "subscription" && product.catalogObjectId)
      .map((product) => product.id),
  );

  return (
    <div className="space-y-3">
      {ATELIER_SUBSCRIPTION_PLANS.map((plan) => {
        const hasSquareMapping = mappedProductIds.has(plan.id);

        return (
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
            {hasSquareMapping ? (
              <SquareCheckoutButton
                productId={plan.id}
                isLoggedIn={!!user}
                returnPath={returnPath}
                className={`md:w-auto ${checkoutButtonClassName} md:px-5 md:py-3 md:text-sm`}
              >
                Souscrire
              </SquareCheckoutButton>
            ) : (
              <p className="text-center text-xs leading-snug text-black/50 md:text-right">
                Paiement indisponible
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export async function AtelierSubscriptionCards({
  returnPath = ATELIER_TARIFS_RETURN_PATH,
  showCheckout = true,
}: TarifsPurchaseProps & { showCheckout?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const products = await loadSquareProducts(supabase);
  const mappedProductIds = new Set(
    products
      .filter(
        (product) => product.kind === "subscription" && product.catalogObjectId,
      )
      .map((product) => product.id),
  );

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ATELIER_SUBSCRIPTION_PLANS.map((plan) => {
        const hasSquareMapping = mappedProductIds.has(plan.id);

        return (
          <div
            key={plan.id}
            className="flex h-full flex-col rounded-[14px] border border-[#f56800]/60 bg-[#fff8f0] p-5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c97a25]">
              {plan.label}
            </p>
            <p className="mt-3 text-[34px] font-semibold leading-none text-black">
              {plan.price}
            </p>
            <p className="mt-1 text-lg font-semibold leading-tight text-black/80">
              {plan.credits} / mois
            </p>
            <p className="mt-4 flex-1 text-sm leading-snug text-black/65">
              {plan.summary}
            </p>
            {showCheckout ? (
              hasSquareMapping ? (
                <SquareCheckoutButton
                  productId={plan.id}
                  isLoggedIn={!!user}
                  returnPath={returnPath}
                  className={`mt-5 ${checkoutButtonClassName} py-3 text-sm`}
                >
                  Souscrire
                </SquareCheckoutButton>
              ) : (
                <p className="mt-5 text-center text-xs leading-snug text-black/50">
                  Paiement indisponible
                </p>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export async function AtelierDiscoveryPackStrip() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activities } = await supabase
    .from("activity")
    .select("id, discipline, square_product_id")
    .eq("type", "pack_decouverte")
    .in(
      "discipline",
      DISCOVERY_PACKS.map((pack) => pack.discipline),
    )
    .is("deleted_at", null);

  const activityIdByDiscipline = new Map(
    (activities ?? []).map((activity) => [activity.discipline, activity]),
  );

  return (
    <div className="flex flex-col gap-5 rounded-[19px] border border-black/10 bg-white px-5 py-5 lg:flex-row lg:items-center lg:gap-6">
      <div className="shrink-0 lg:w-44">
        <p className="text-[22px] font-semibold leading-tight text-[#f56800]">
          pack
          <br />
          découverte
        </p>
      </div>
      <p className="max-w-[220px] text-sm leading-snug text-black/70">
        Une première venue pour tester l&apos;atelier.
        <span className="mt-1 block text-black/45">
          limitée à un achat par personne
        </span>
      </p>
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        {DISCOVERY_PACKS.map((pack) => {
          const activity = activityIdByDiscipline.get(pack.discipline);
          const squareProductId = activity?.square_product_id ?? null;

          return (
            <div
              key={pack.discipline}
              className="flex min-h-[148px] flex-col items-center justify-center rounded-[14px] border bg-white px-4 py-4 text-center"
              style={{ borderColor: pack.accent }}
            >
              <p
                className="text-[28px] font-semibold leading-none"
                style={{ color: pack.accent }}
              >
                {pack.price}
              </p>
              <p className="mt-2 text-sm font-semibold leading-tight text-black/80">
                {pack.line1}
              </p>
              {pack.line2 ? (
                <p className="text-sm leading-tight text-black/70">{pack.line2}</p>
              ) : null}
              {activity && squareProductId ? (
                <DiscoveryPackReservationButton
                  activityId={activity.id}
                  activityTitle={pack.title}
                  squareProductId={squareProductId}
                  isLoggedIn={!!user}
                  label="Réserver"
                  className={pack.reserveClassName}
                />
              ) : (
                <p className="mt-2 text-xs leading-snug text-black/50">
                  {activity ? "Produit Square manquant" : "Créneaux indisponibles"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
