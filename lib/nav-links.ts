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
      { href: "/atelier#horaires-et-tarifs", label: "horaires" },
      { href: "/atelier#tarifs", label: "tarifs" },
    ],
  },
  { href: "/cours", label: "cours" },
  {
    href: "/pratique-libre",
    label: "pratique libre",
    subLinks: [
      { href: "/pratique-libre#menuiserie", label: "menuiserie" },
      { href: "/pratique-libre#couture", label: "couture" },
      { href: "/pratique-libre#ceramique", label: "céramique" },
    ],
  },
  { href: "/offrir", label: "offrir" },
  { href: "/contact", label: "contact" },
];



