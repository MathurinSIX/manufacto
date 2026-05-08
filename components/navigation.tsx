import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav-links";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

const ASSETS = {
  logoMark: "/assets/figma-landing/logo-mark.png",
  accountIcon: "/assets/figma-landing/account-icon.png",
} as const;

export function Navigation() {
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
            <Link key={item.label} href={item.href} className="leading-normal hover:text-[#4a56dd]">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <MobileNavDrawer />
          <Link
            href="/account"
            className="flex items-center gap-3 text-base font-semibold text-[#4a56dd] underline underline-offset-2"
          >
            <span className="hidden sm:inline">Mon compte</span>
            <Image src={ASSETS.accountIcon} alt="" width={33} height={29} aria-hidden />
          </Link>
        </div>
      </div>
    </nav>
  );
}

