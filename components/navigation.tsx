import Link from "next/link";
import { Suspense } from "react";
import { NavLinks } from "@/components/nav-links";
import { CreditsDisplay } from "@/components/credits-display";

export function Navigation() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="w-full max-w-7xl flex items-center justify-between p-3 px-5 text-sm">
        <Link
          href={"/"}
          className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Manufacto
        </Link>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavLinks />
        </div>
        <div className="flex items-center">
          <Suspense>
            <CreditsDisplay />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

