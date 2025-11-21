import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navigation } from "@/components/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MonthlyActivitiesCalendar } from "@/components/monthly-activities-calendar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <Navigation />

        {/* Hero Section with Big Picture */}
        <div className="relative w-full h-[70vh] min-h-[500px]">
          <Image
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80"
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
                src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80"
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
                    vous présenteront le lieu et son fonctionnement. C&apos;est gratuit, sur inscription :
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

        {/* Monthly Activities Calendar Section */}
        <section className="w-full py-20">
          <div className="w-full max-w-7xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Les cours du mois
            </h2>
            <div className="bg-muted/30 border rounded-lg p-6 md:p-8">
              <MonthlyActivitiesCalendar />
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

        {/* Footer */}
        <footer className="w-full border-t py-16">
          <div className="w-full max-w-7xl mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Left: Social Media, Email, Phone */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Contact</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:contact@manufacto.fr"
                      className="hover:text-foreground transition-colors"
                    >
                      contact@manufacto.fr
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:+33123456789"
                      className="hover:text-foreground transition-colors"
                    >
                      +33 1 23 45 67 89
                    </a>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <a
                      href="https://facebook.com/manufacto"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground transition-colors"
                      aria-label="Facebook"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                    <a
                      href="https://instagram.com/manufacto"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground transition-colors"
                      aria-label="Instagram"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Middle: Manufacto with Address */}
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-bold">Manufacto</h3>
                <div className="text-sm text-muted-foreground">
                  <p>123 Rue de l&apos;Atelier</p>
                  <p>75000 Paris, France</p>
                </div>
              </div>

              {/* Right: Theme Switch */}
              <div className="flex justify-end">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
