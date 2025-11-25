import { Navigation } from "@/components/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <Navigation />

        {/* Hero Section with Big Picture */}
        <div className="relative w-full h-[70vh] min-h-[500px]">
          <Image
            src="https://images.unsplash.com/photo-1659930087003-2d64e33181f7?auto=format&fit=crop&w=1920&q=80"
            alt="Manufacto Atelier"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-2 text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                <span>Fabriquer</span>
                <span>Réparer</span>
                <span>Bricoler</span>
                <span>Apprendre</span>
                <span>Découvrir</span>
                <span>Faire soi-même</span>
              </div>
            </div>
          </div>
        </div>

        {/* Concept Section */}
        <section className="w-full max-w-7xl px-5 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Le Concept</h2>
              <p className="text-lg text-muted-foreground">
                Manufacto est un espace de fabrication et de création où vous pouvez
                apprendre, créer, réparer et donner vie à vos projets. Que vous soyez
                débutant ou expérimenté, notre atelier vous offre les outils, les machines
                et l&apos;accompagnement nécessaires pour réaliser vos idées.
              </p>
              <p className="text-lg text-muted-foreground">
                Nous proposons des cours pour monter en compétence, des moments de pratique
                libre pour vos projets personnels, et des manufactures pour découvrir de
                nouvelles techniques et matériaux.
              </p>
              <Link href="/atelier">
                <Button variant="outline" className="mt-4">
                  En savoir plus
                </Button>
              </Link>
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1597960194599-22929afc25b1?auto=format&fit=crop&w=800&q=80"
                alt="Concept Manufacto"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* Visit Banner Section */}
        <section className="w-full py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <div className="bg-muted/50 border rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                <h2 className="text-2xl md:text-3xl font-bold flex-shrink-0">
                  Venez visiter l&apos;atelier !
                </h2>
                <div className="flex-1 text-base md:text-lg text-muted-foreground">
                  <p>
                    Tous les mardi soir, de 18h30 à 19h, Martin, Nafissa, Cyprien et Delphine
                    vous présenteront le lieu et son fonctionnement. C&apos;est gratuit, sur réservation :
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button>
                    Réserver
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Main Sections */}
        <section className="w-full bg-muted/50 py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Section 1: Des ateliers de montée en compétence */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Des ateliers de montée en compétence
                </h2>
                <p className="text-base text-muted-foreground">
                  Vous voulez apprendre à utiliser une machine à coudre, une scie
                  circulaire, une raboteuse, un fer à souder ?
                </p>
                <p className="text-base text-muted-foreground">
                  À rénover un meuble, à faire une lampe, à fabriquer votre table basse,
                  réparer du petit électroménager ?
                </p>
                <p className="text-base text-muted-foreground">
                  Vous êtes au bon endroit. Que vous soyez débutants ou plus avancés,
                  découvrez nos propositions de cours ponctuels pour développer de
                  nouvelles compétences, et pouvoir ensuite donner vie à projets.
                </p>
                <Link href="/cours">
                  <Button variant="outline" className="mt-4">
                    En savoir plus
                  </Button>
                </Link>
              </div>

              {/* Section 2: Des moments de pratique libre */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Des moments de pratique libre
                </h2>
                <p className="text-base text-muted-foreground">
                  Vous cherchez un lieu où bricoler, fabriquer, réparer ou donner vie à
                  vos projets en ayant accès à des machines adaptées ?
                </p>
                <p className="text-base text-muted-foreground">
                  En autonomie ou accompagné.e, Manufacto est ouvert à toute personne
                  ayant un projet de réparation et/ou de fabrication autour du travail du
                  bois, du textile, de l&apos;électronique ou de la céramique, quelque
                  soit son niveau.
                </p>
                <Link href="/pratique-libre">
                  <Button variant="outline" className="mt-4">
                    En savoir plus
                  </Button>
                </Link>
              </div>

              {/* Section 3: Des Manufactures */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">Des Manufactures</h2>
                <p className="text-base text-muted-foreground">
                  textetextetextetexte
                </p>
                <p className="text-base text-muted-foreground">
                  textetextetextetexte
                </p>
                <p className="text-base text-muted-foreground">
                  textetextetextetexte
                </p>
                <Link href="/manufactures">
                  <Button variant="outline" className="mt-4">
                    En savoir plus
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Banner Section */}
        <section className="w-full py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <div className="bg-muted/50 border rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                <h2 className="text-2xl md:text-3xl font-bold flex-shrink-0">
                  Newsletter
                </h2>
                <div className="flex-1 text-base md:text-lg text-muted-foreground">
                  <p>
                    Pour rester au courant de nos actualités, laissez nous votre mail. On n&apos;inonde pas votre boite mail, vous recevrez un mail en début de mois.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button>
                    S&apos;inscrire
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
