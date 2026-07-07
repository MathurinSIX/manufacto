import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav-links";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { HashLink } from "@/components/hash-link";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";

const ASSETS = {
  logoMark: "/assets/figma-landing/logo-mark.png",
} as const;

type ClaimsWithAppMetadata = {
  app_metadata?: {
    role?: string;
  };
};

export async function Navigation() {
  unstable_noStore();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as ClaimsWithAppMetadata | undefined;
  const isadmin = claims?.app_metadata?.role === "admin";

  return (
    <nav className="w-full bg-white">
      <div className="mx-auto flex h-[105px] max-w-[1320px] items-center justify-between px-5 text-black md:px-10">
        <Link href="/" className="relative h-[57px] w-[190px] shrink-0">
          <Image
            src={ASSETS.logoMark}
            alt="Manufacto"
            fill
            className="object-contain object-left"
            priority
            sizes="190px"
          />
        </Link>

        <div className="hidden items-center gap-8 text-center text-base md:flex">
          {NAV_LINKS.map((item) => (
            <div key={item.label} className="group relative flex min-w-[90px] flex-col items-center py-8">
              <Link href={item.href} className="leading-normal hover:text-[#4a56dd]">
                {item.label}
              </Link>
              {item.subLinks?.length ? (
                <div className="invisible absolute left-1/2 top-full z-20 flex min-w-[150px] -translate-x-1/2 flex-col gap-1 rounded-xl bg-white px-4 py-3 text-sm leading-tight text-black/55 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  {item.subLinks.map((subLink) => (
                    <HashLink key={subLink.href} href={subLink.href} className="hover:text-[#4a56dd]">
                      {subLink.label}
                    </HashLink>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {isadmin ? (
            <Link href="/admin" className="leading-normal font-semibold text-[#4a56dd] hover:text-[#3540bf]">
              admin
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <MobileNavDrawer showadminLink={isadmin} />
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-[#4a56dd] transition-colors hover:text-[#3540bf]"
          >
            <User className="h-[1.1em] w-[1.1em] shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="hidden underline underline-offset-2 sm:inline">mon compte</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

