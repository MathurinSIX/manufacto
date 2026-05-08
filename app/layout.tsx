import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Manufacto Marseille",
  description:
    "Atelier partagé et multidisciplinaire au coeur de Marseille, ouvert à toutes celles et ceux qui veulent faire de leurs mains.",
  manifest: "/manifest.webmanifest",
  applicationName: "Manufacto",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Manufacto",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/assets/favicon.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a56dd",
};

const golosText = localFont({
  src: "../public/assets/font/GolosText-VariableFont_wght.ttf",
  variable: "--font-golos-text",
  display: "swap",
  weight: "400 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={golosText.variable}>
      <body
        className={`${golosText.className} font-sans antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <Navigation />
          </Suspense>
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <PwaRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
