"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Home,
  LogOut,
  MapPin,
  Sun,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin?tab=today", tab: "today", label: "Aujourd'hui", Icon: Sun },
  { href: "/admin?tab=users", tab: "users", label: "Users", Icon: Users },
  { href: "/admin?tab=courses", tab: "courses", label: "Cours", Icon: CalendarDays },
  {
    href: "/admin?tab=free-practice",
    tab: "free-practice",
    label: "Pratique",
    Icon: Wrench,
  },
  { href: "/admin?tab=visits", tab: "visits", label: "Visites", Icon: MapPin },
] as const;

function AdminLogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login?next=/admin");
  };

  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-sm font-semibold text-[#f56800] transition hover:bg-[#fff3e8]",
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      <span className="hidden sm:inline">Déconnexion</span>
    </button>
  );
}

/** Standalone shell for /admin — separate PWA from mon compte. */
export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "today";
  const onUserDetail = pathname.startsWith("/admin/users/");

  return (
    <div className="flex min-h-dvh flex-col bg-[#fff8f0] text-black">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 40% at 0% 0%, rgba(245,104,0,0.14), transparent 55%), radial-gradient(ellipse 50% 35% at 100% 0%, rgba(74,86,221,0.08), transparent 50%)",
        }}
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 md:h-16 md:max-w-[1200px] md:px-5">
          <Link href="/admin?tab=today" className="flex min-w-0 items-center gap-2.5">
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
            <span className="truncate rounded-md bg-[#fff3e8] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#f56800] md:text-sm">
              Admin
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-sm font-medium text-black/50 transition hover:bg-black/5 hover:text-black/80"
              title="Mon compte"
            >
              Compte
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-sm font-medium text-black/50 transition hover:bg-black/5 hover:text-black/80"
              title="Retour au site"
            >
              <Home className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="hidden sm:inline">Site</span>
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-5 md:max-w-[1200px] md:px-5 md:pb-12 md:pt-8">
        {children}
      </div>

      {!onUserDetail ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          aria-label="Navigation admin"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1">
            {NAV.map(({ href, tab, label, Icon }) => {
              const isActive = !onUserDetail && activeTab === tab;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition",
                    isActive ? "text-[#f56800]" : "text-black/55 hover:text-[#f56800]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
