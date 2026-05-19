"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { HashLink } from "@/components/hash-link";
import { NAV_LINKS } from "@/lib/nav-links";

type MobileNavDrawerProps = {
  showadminLink?: boolean;
};

export function MobileNavDrawer({ showadminLink = false }: MobileNavDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 max-w-[80vw] p-6">
        <div className="flex flex-col h-full">
          <div className="mb-6 text-lg font-semibold">menu</div>
          <nav className="flex-1 space-y-4">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                <SheetClose asChild>
                  <Link
                    href={link.href}
                    className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
                {link.subLinks?.length ? (
                  <div className="mt-2 space-y-2 pl-4">
                    {link.subLinks.map((subLink) => (
                      <SheetClose asChild key={subLink.href}>
                        <HashLink
                          href={subLink.href}
                          className="block text-sm text-foreground/55 transition-colors hover:text-foreground"
                        >
                          {subLink.label}
                        </HashLink>
                      </SheetClose>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {showadminLink ? (
              <SheetClose asChild>
                <Link
                  href="/admin"
                  className="block text-lg font-semibold text-[#4a56dd] transition-colors hover:text-[#3540bf]"
                >
                  admin
                </Link>
              </SheetClose>
            ) : null}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}



