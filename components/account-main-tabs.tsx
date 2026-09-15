"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const ACCOUNT_TABS = [
  "reservations",
  "cours",
  "pratique",
  "credits",
] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number];

const TAB_LABELS: Record<AccountTab, string> = {
  reservations: "Mes réservations",
  cours: "Cours",
  pratique: "Pratique libre",
  credits: "Crédits et abonnements",
};

function isAccountTab(value: string | null | undefined): value is AccountTab {
  return (
    !!value && (ACCOUNT_TABS as readonly string[]).includes(value)
  );
}

function tabFromHash(hash: string): AccountTab | null {
  const id = hash.replace(/^#/, "");
  if (id === "credits") return "credits";
  if (id === "reservations") return "reservations";
  if (id === "reserver" || id === "cours") return "cours";
  if (id === "pratique") return "pratique";
  return null;
}

type AccountMainTabsProps = {
  reservations: ReactNode;
  cours: ReactNode;
  pratique: ReactNode;
  credits: ReactNode;
};

export function AccountMainTabs({
  reservations,
  cours,
  pratique,
  credits,
}: AccountMainTabsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/account";
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const [tab, setTab] = useState<AccountTab>(
    isAccountTab(paramTab) ? paramTab : "reservations",
  );

  useEffect(() => {
    if (isAccountTab(paramTab)) {
      setTab(paramTab);
      return;
    }
    const fromHash = tabFromHash(window.location.hash);
    if (fromHash) {
      setTab(fromHash);
      router.replace(`${pathname}?tab=${fromHash}`, { scroll: false });
    }
  }, [paramTab, pathname, router]);

  const onTabChange = (value: string) => {
    if (!isAccountTab(value)) return;
    setTab(value);
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-6 hidden h-auto w-full grid-cols-4 gap-1 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60 md:grid">
        {ACCOUNT_TABS.map((id) => (
          <TabsTrigger
            key={id}
            value={id}
            className={cn(
              "rounded-[11px] px-2 py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm",
              id === "pratique"
                ? "data-[state=active]:text-[#f56800]"
                : "data-[state=active]:text-[#4a56dd]",
            )}
          >
            {TAB_LABELS[id]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="reservations" className="mt-0 space-y-6">
        {reservations}
      </TabsContent>
      <TabsContent value="cours" className="mt-0 space-y-6">
        {cours}
      </TabsContent>
      <TabsContent value="pratique" className="mt-0 space-y-6">
        {pratique}
      </TabsContent>
      <TabsContent value="credits" className="mt-0 space-y-6">
        {credits}
      </TabsContent>
    </Tabs>
  );
}
