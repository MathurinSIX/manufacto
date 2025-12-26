import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AtelierPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <Suspense fallback={<nav className="w-full h-16" />}>
          <Navigation />
        </Suspense>

        {/* Hero Section with Big Picture */}
        <div className="relative w-full h-[50vh] min-h-[400px]">
          <Image
            src="https://images.unsplash.com/photo-1522065893269-6fd20f6d7438?auto=format&fit=crop&w=1920&q=80"
            alt="L'Atelier Manufacto"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-3">
                <p className="text-sm uppercase tracking-wide text-foreground/80">
                  L&apos;Atelier
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  Des ateliers de montée en compétence
                </h1>
                <p className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto">
                  Apprenez de nouvelles techniques artisanales avec nos encadrants expérimentés
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <section className="w-full max-w-7xl px-5 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Qu&apos;est-ce que L&apos;Atelier ?</h2>
              <p className="text-lg text-muted-foreground">
                L&apos;Atelier Manufacto propose des sessions d&apos;initiation et de formation 
                encadrées par des professionnels expérimentés. Ces ateliers sont conçus pour vous 
                permettre d&apos;apprendre des techniques artisanales spécifiques dans un cadre 
                structuré et pédagogique.
              </p>
              <p className="text-lg text-muted-foreground">
                Que vous soyez débutant ou plus avancé, découvrez nos propositions de cours ponctuels 
                pour développer de nouvelles compétences, et pouvoir ensuite donner vie à vos projets.
              </p>
              <Link href="/cours">
                <Button variant="outline" className="mt-4">
                  Voir nos cours
                </Button>
              </Link>
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1597960194599-22929afc25b1?auto=format&fit=crop&w=800&q=80"
                alt="Atelier Manufacto"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* Domains Section */}
        <section className="w-full bg-muted/50 py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Nos domaines d&apos;expertise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Menuiserie</h3>
                <p className="text-base text-muted-foreground">
                  Apprenez les techniques de base et avancées du travail du bois : découpes précises, 
                  assemblages traditionnels (tenons-mortaises, queues d&apos;aronde), utilisation de la 
                  défonceuse, et maîtrise du tour à bois pour créer des objets cylindriques.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Couture</h3>
                <p className="text-base text-muted-foreground">
                  De l&apos;initiation pour débutants aux techniques intermédiaires, découvrez la 
                  couture à la machine : points de base, ourlets, fermetures éclair, poches, manches, 
                  et apprenez à créer vos propres patrons sur mesure.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Tapisserie</h3>
                <p className="text-base text-muted-foreground">
                  Redonnez vie à vos meubles avec les techniques de tapisserie traditionnelle : 
                  rembourrage, pose de tissus et finitions pour transformer vos meubles anciens en 
                  pièces uniques.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">Repair Café</h3>
                <p className="text-base text-muted-foreground">
                  Un atelier collaboratif où vous pouvez réparer vos objets du quotidien avec l&apos;aide 
                  de bénévoles expérimentés. Apprenez à réparer plutôt que jeter, dans une ambiance 
                  conviviale et solidaire.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="w-full max-w-7xl px-5 py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Comment ça fonctionne ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold">Choisissez votre atelier</h3>
              <p className="text-base text-muted-foreground">
                Consultez notre programme d&apos;ateliers disponibles. Chaque atelier a un nombre 
                de crédits requis et un prix fixe.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold">Réservez votre place</h3>
              <p className="text-base text-muted-foreground">
                Inscrivez-vous à la session qui vous convient. Les ateliers ont des places limitées 
                pour garantir un encadrement de qualité.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold">Apprenez et créez</h3>
              <p className="text-base text-muted-foreground">
                Participez à l&apos;atelier encadré par un professionnel. Vous repartirez avec de 
                nouvelles compétences et, selon l&apos;atelier, avec votre réalisation.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <div className="bg-muted/50 border rounded-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Pourquoi choisir nos ateliers ?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-xl">✓</span>
                  <div>
                    <p className="font-semibold">Encadrement professionnel</p>
                    <p className="text-sm text-muted-foreground">Nos encadrants sont des artisans expérimentés qui vous guident pas à pas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-xl">✓</span>
                  <div>
                    <p className="font-semibold">Matériel fourni</p>
                    <p className="text-sm text-muted-foreground">Tout le matériel et les outils nécessaires sont mis à votre disposition.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-xl">✓</span>
                  <div>
                    <p className="font-semibold">Groupes réduits</p>
                    <p className="text-sm text-muted-foreground">Des sessions avec un nombre limité de participants pour un apprentissage optimal.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-xl">✓</span>
                  <div>
                    <p className="font-semibold">Progression structurée</p>
                    <p className="text-sm text-muted-foreground">Des ateliers adaptés à tous les niveaux, du débutant à l&apos;intermédiaire.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <span className="text-primary mt-1 text-xl">✓</span>
                  <div>
                    <p className="font-semibold">Réalisations concrètes</p>
                    <p className="text-sm text-muted-foreground">Repartez avec vos créations et les compétences pour continuer chez vous.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
