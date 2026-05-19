export type NavLink = {
  href: string;
  label: string;
  subLinks?: {
    href: string;
    label: string;
  }[];
};

export const NAV_LINKS: NavLink[] = [
  {
    href: "/atelier",
    label: "l'atelier",
    subLinks: [
      { href: "/atelier#concept", label: "concept" },
      { href: "/atelier#fonctionnement", label: "fonctionnement" },
      { href: "/atelier#horaires-et-tarifs", label: "horaires & tarifs" },
    ],
  },
  { href: "/cours", label: "cours" },
  {
    href: "/pratique-libre",
    label: "pratique libre",
    subLinks: [
      { href: "/pratique-libre#menuiserie", label: "menuiserie" },
      { href: "/pratique-libre#couture", label: "couture" },
      { href: "/pratique-libre#electronique", label: "électronique" },
      { href: "/pratique-libre#ceramique", label: "céramique" },
    ],
  },
  { href: "/contact", label: "contact" },
];



