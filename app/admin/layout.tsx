import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AdminAppShell } from "@/components/admin-app-shell";

export const metadata: Metadata = {
  title: "Admin · Manufacto",
  description: "Administration Manufacto — utilisateurs, sessions, crédits.",
  applicationName: "Admin Manufacto",
  manifest: "/manifest-admin.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Admin Manufacto",
  },
};

export const viewport: Viewport = {
  themeColor: "#f56800",
  viewportFit: "cover",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AdminAppShell>{children}</AdminAppShell>
    </Suspense>
  );
}
