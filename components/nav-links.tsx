"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/atelier", label: "L'Atelier" },
    { href: "/cours", label: "Cours" },
    { href: "/pratique-libre", label: "Pratique Libre" },
    { href: "/manufactures", label: "Manufactures" },
  ];

  return (
    <div className="flex items-center gap-4">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-base font-medium transition-colors ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

