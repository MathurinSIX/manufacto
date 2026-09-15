"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  Home,
  LogOut,
  Ticket,
  Wrench,
} from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AccountTab } from "@/components/account-main-tabs";

const NAV = [
  {
    href: "/account?tab=reservations",
    tab: "reservations" as const,
    label: "Résas",
    Icon: Ticket,
  },
  {
    href: "/account?tab=cours",
    tab: "cours" as const,
    label: "Cours",
    Icon: CalendarDays,
  },
  {
    href: "/account?tab=pratique",
    tab: "pratique" as const,
    label: "Pratique",
    Icon: Wrench,
  },
  {
    href: "/account?tab=credits",
    tab: "credits" as const,
    label: "Crédits",
    Icon: CreditCard,
  },
] as const;

function AccountLogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login?next=/account");
  };

  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-sm font-semibold text-[#4a56dd] transition hover:bg-[#f0f1ff]",
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      <span className="hidden sm:inline">Déconnexion</span>
    </button>
  );
}

function AccountBottomNav() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "reservations") as AccountTab;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Navigation compte"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-1 pt-1">
        {NAV.map(({ href, tab, label, Icon }) => {
          const isActive = activeTab === tab;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition",
                isActive ? "text-[#4a56dd]" : "text-black/55 hover:text-[#4a56dd]",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Standalone shell for /account — no marketing header/footer. */
export function AccountAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/account";
  const onDocuments = pathname.startsWith("/account/documents");

  return (
    <div className="flex min-h-dvh flex-col bg-[#fff8f0] text-black">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 40% at 0% 0%, rgba(74,86,221,0.12), transparent 55%), radial-gradient(ellipse 50% 35% at 100% 0%, rgba(245,104,0,0.1), transparent 50%)",
        }}
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 md:h-16 md:max-w-[960px] md:px-5">
          <Link
            href="/account?tab=reservations"
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="relative h-8 w-[108px] shrink-0 md:h-9 md:w-[120px]">
              <Image
                src="/assets/figma-landing/logo-mark.png"
                alt="Manufacto"
                fill
                className="object-contain object-left"
                sizes="120px"
                priority
              />
            </span>
            <span className="truncate text-sm font-semibold text-black/70 md:text-base">
              Mon compte
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-sm font-medium text-black/50 transition hover:bg-black/5 hover:text-black/80"
              title="Retour au site"
            >
              <Home className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="hidden sm:inline">Site</span>
            </Link>
            <AccountLogoutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-5 md:max-w-[960px] md:px-5 md:pb-12 md:pt-8">
        {children}
      </div>

      {!onDocuments ? (
        <Suspense fallback={null}>
          <AccountBottomNav />
        </Suspense>
      ) : null}
    </div>
  );
}
