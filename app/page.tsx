import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { CreditsDisplay } from "@/components/credits-display";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      title: "Fabrication Rationalisée",
      description:
        "Gérez l'ensemble de votre processus de fabrication du début à la fin avec notre plateforme intuitive. Suivez la production, les stocks et le contrôle qualité en un seul endroit.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Manufacturing",
    },
    {
      title: "Analyses en Temps Réel",
      description:
        "Obtenez des informations instantanées sur vos opérations avec des tableaux de bord et des rapports complets. Prenez des décisions basées sur les données pour optimiser l'efficacité de votre fabrication.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Analytics",
    },
    {
      title: "Intégration de la Chaîne d'Approvisionnement",
      description:
        "Connectez-vous facilement avec les fournisseurs et les distributeurs. Automatisez les commandes, suivez les expéditions et maintenez automatiquement des niveaux de stock optimaux.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Supply+Chain",
    },
    {
      title: "Assurance Qualité",
      description:
        "Assurez la qualité du produit à chaque étape avec des flux de travail de contrôle qualité intégrés. Documentez les inspections, suivez les défauts et maintenez les normes de conformité.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Quality+Control",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Top Navigation Bar */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex items-center gap-6">
              <Link
                href={"/"}
                className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
              >
                Manufacto
              </Link>
              <Link
                href="/activities"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Activités
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <>
                  <Suspense>
                    <CreditsDisplay />
                  </Suspense>
                  <Suspense>
                    <AuthButton />
                  </Suspense>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="w-full max-w-7xl px-5 pt-12 pb-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Transformez Votre Fabrication
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La solution complète pour les opérations de fabrication modernes. Rationalisez
              vos processus, augmentez la productivité et développez votre entreprise.
            </p>
          </div>
        </div>

        {/* Product Features Grid */}
        <div className="w-full max-w-7xl px-5 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative w-full h-64 bg-muted">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Propulsé par{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
