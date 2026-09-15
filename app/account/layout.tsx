import type { Metadata, Viewport } from "next";
import { AccountAppShell } from "@/components/account-app-shell";

export const metadata: Metadata = {
  title: "Mon compte · Manufacto",
  description:
    "Réservations, crédits et abonnements Manufacto — espace personnel.",
  applicationName: "Mon compte Manufacto",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mon compte",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a56dd",
  viewportFit: "cover",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountAppShell>{children}</AccountAppShell>;
}
