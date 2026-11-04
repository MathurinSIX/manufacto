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
      { href: "/atelier#horaires", label: "horaires" },
      { href: "/atelier#tarifs", label: "tarifs" },
    ],
  },
  {
    href: "/cours",
    label: "cours",
    subLinks: [
      { href: "/cours#calendrier", label: "calendrier" },
      { href: "/cours#offres", label: "tous les cours" },
    ],
  },
  {
    href: "/pratique-libre",
    label: "pratique libre",
    subLinks: [
      { href: "/pratique-libre#menuiserie", label: "menuiserie" },
      { href: "/pratique-libre#couture", label: "couture" },
      { href: "/pratique-libre#ceramique", label: "céramique" },
    ],
  },
  {
    href: "/offrir",
    label: "offrir",
    subLinks: [
      { href: "/offrir#credits", label: "cartes cadeaux" },
      { href: "/contact#visite", label: "réserver une visite" },
    ],
  },
  {
    href: "/contact",
    label: "contact",
    subLinks: [
      { href: "/contact#visite", label: "visite" },
      { href: "/contact#adresse", label: "nous trouver" },
    ],
  },
];



