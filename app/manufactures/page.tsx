import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ManufacturesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <Suspense fallback={<nav className="w-full h-16" />}>
          <Navigation />
        </Suspense>

        {/* Hero Section with Big Picture */}
        <div className="relative w-full h-[50vh] min-h-[400px]">
          <Image
            src="https://images.unsplash.com/photo-1651509245244-6674e242a3c1?auto=format&fit=crop&w=1920&q=80"
            alt="Les Manufactures Manufacto"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-3">
                <p className="text-sm uppercase tracking-wide text-foreground/80">
                  Les Manufactures
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  Des moments de pratique libre
                </h1>
                <p className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto">
                  Accédez librement à nos ateliers pour travailler sur vos projets personnels
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <section className="w-full max-w-7xl px-5 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Qu&apos;est-ce que les Manufactures ?</h2>
              <p className="text-lg text-muted-foreground">
                Les Manufactures sont des espaces de travail en autonomie où vous pouvez accéder 
                librement aux ateliers pour réaliser vos projets personnels. Que vous soyez débutant 
                ou expérimenté, vous pouvez utiliser les machines, outils et équipements professionnels 
                mis à votre disposition.
              </p>
              <p className="text-lg text-muted-foreground">
                En autonomie ou accompagné.e, Manufacto est ouvert à toute personne ayant un projet de 
                réparation et/ou de fabrication autour du travail du bois, du textile, de l&apos;électronique 
                ou de la céramique, quelque soit son niveau.
              </p>
              <Link href="/pratique-libre">
                <Button variant="outline" className="mt-4">
                  En savoir plus
                </Button>
              </Link>
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1597960194599-22929afc25b1?auto=format&fit=crop&w=800&q=80"
                alt="Manufactures Manufacto"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* Workshops Section */}
        <section className="w-full bg-muted/50 py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Nos ateliers disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Menuiserie</h3>
                <p className="text-base text-muted-foreground">
                  Accédez à l&apos;atelier de menuiserie pour travailler sur vos projets en bois. 
                  Utilisez les machines et outils disponibles (scies, raboteuses, ponceuses) pour 
                  réaliser vos meubles, objets en bois ou projets de rénovation. Des sessions en 
                  autonomie encadrée sont également disponibles pour les débutants.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Couture</h3>
                <p className="text-base text-muted-foreground">
                  Travaillez sur vos projets textiles dans l&apos;atelier de couture. Machines à coudre, 
                  surjeteuses et autres équipements sont à votre disposition pour réaliser vos vêtements, 
                  accessoires, travaux de retouche ou projets créatifs. Des sessions encadrées permettent 
                  d&apos;apprendre les bases ou de recevoir des conseils.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Céramique</h3>
                <p className="text-base text-muted-foreground">
                  Modeler, tourner et décorer vos créations en terre dans l&apos;atelier de céramique. 
                  Utilisez les tours de potier, fours et outils de modelage pour réaliser vos pièces en 
                  céramique, poterie ou sculpture. L&apos;assistance de l&apos;équipe est disponible pour 
                  vous guider dans vos réalisations.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Électronique</h3>
                <p className="text-base text-muted-foreground">
                  Réparez, modifiez ou créez vos projets électroniques dans l&apos;espace dédié. 
                  Utilisez les outils de soudure, composants et équipements de test disponibles. 
                  Idéal pour réparer vos appareils, créer des circuits ou apprendre l&apos;électronique 
                  de manière autonome.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Two Formulas Section */}
        <section className="w-full max-w-7xl px-5 py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Deux formules d&apos;autonomie</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border rounded-lg p-6 space-y-3">
              <h3 className="text-2xl font-semibold">Autonomie</h3>
              <p className="text-base text-muted-foreground">
                Accès libre à l&apos;atelier pour travailler sur vos projets personnels. 
                L&apos;équipe est présente pour vous assister si nécessaire, mais vous travaillez 
                de manière indépendante. Parfait si vous avez déjà une certaine expérience.
              </p>
            </div>
            <div className="border rounded-lg p-6 space-y-3">
              <h3 className="text-2xl font-semibold">Autonomie Encadrée</h3>
              <p className="text-base text-muted-foreground">
                Sessions en autonomie avec encadrement renforcé. Un encadrant est disponible pour 
                vous guider dans l&apos;utilisation des machines et vous conseiller sur vos réalisations. 
                Idéal pour les débutants ou pour les projets nécessitant un suivi plus rapproché.
              </p>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="w-full bg-muted/50 py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Comment ça fonctionne ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <h3 className="text-xl font-semibold">Réservez votre créneau</h3>
                <p className="text-base text-muted-foreground">
                  Choisissez l&apos;atelier et la session qui vous convient. Les créneaux sont 
                  disponibles selon nos horaires d&apos;ouverture.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <h3 className="text-xl font-semibold">Venez avec votre projet</h3>
                <p className="text-base text-muted-foreground">
                  Apportez vos matériaux et votre projet. Le matériel et les outils sont fournis 
                  sur place.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-semibold">Travaillez à votre rythme</h3>
                <p className="text-base text-muted-foreground">
                  Utilisez les équipements disponibles pour réaliser votre projet. L&apos;équipe 
                  est là pour vous aider si vous avez des questions ou besoin d&apos;assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full max-w-7xl px-5 py-20">
          <div className="bg-muted/50 border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Les avantages des Manufactures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-primary mt-1 text-xl">✓</span>
                <div>
                  <p className="font-semibold">Accès à du matériel professionnel</p>
                  <p className="text-sm text-muted-foreground">Machines et outils de qualité que vous n&apos;avez pas besoin d&apos;acheter.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary mt-1 text-xl">✓</span>
                <div>
                  <p className="font-semibold">Flexibilité</p>
                  <p className="text-sm text-muted-foreground">Travaillez sur vos propres projets à votre rythme, selon vos besoins.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary mt-1 text-xl">✓</span>
                <div>
                  <p className="font-semibold">Support disponible</p>
                  <p className="text-sm text-muted-foreground">L&apos;équipe est présente pour vous assister et répondre à vos questions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary mt-1 text-xl">✓</span>
                <div>
                  <p className="font-semibold">Apprentissage progressif</p>
                  <p className="text-sm text-muted-foreground">Choisissez entre autonomie simple ou encadrée selon votre niveau.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <span className="text-primary mt-1 text-xl">✓</span>
                <div>
                  <p className="font-semibold">Communauté</p>
                  <p className="text-sm text-muted-foreground">Rencontrez d&apos;autres artisans et partagez vos expériences dans un espace convivial.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credits System Section */}
        <section className="w-full py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <div className="bg-muted/50 border rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                <h2 className="text-2xl md:text-3xl font-bold flex-shrink-0">
                  Système de crédits
                </h2>
                <div className="flex-1 text-base md:text-lg text-muted-foreground">
                  <p>
                    L&apos;accès aux Manufactures fonctionne avec un système de crédits. Chaque session 
                    d&apos;autonomie consomme un certain nombre de crédits selon la durée et le type d&apos;atelier. 
                    Les sessions en autonomie encadrée nécessitent plus de crédits pour bénéficier de 
                    l&apos;accompagnement renforcé. Vous pouvez acheter des crédits et les utiliser pour 
                    réserver vos créneaux d&apos;autonomie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

