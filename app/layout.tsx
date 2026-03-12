import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Manufacto Marseille",
  description:
    "Atelier partagé et multidisciplinaire au coeur de Marseille, ouvert à toutes celles et ceux qui veulent faire de leurs mains.",
  icons: {
    icon: "/assets/favicon.png",
  },
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
          <div className="flex-1 flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
