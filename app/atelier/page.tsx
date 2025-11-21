import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";

export default async function AtelierPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navigation />
      <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              L&apos;Atelier
            </p>
            <h1 className="text-4xl md:text-5xl font-bold">
              Bienvenue à L&apos;Atelier
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Découvrez notre espace de création et de fabrication. L&apos;atelier
              est un lieu dédié à la couture, à la création et à l&apos;apprentissage.
            </p>
          </div>

          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Venez visiter l&apos;atelier !
            </h2>

            {/* Banner Section */}
            <div className="bg-muted/50 border rounded-lg p-6 md:p-8 space-y-4">
              <p className="text-lg text-muted-foreground">
                Tous les mardi soir, de 18h30 à 19h, Martin, Nafissa, Cyprien et Delphine
                vous présenteront le lieu et son fonctionnement
              </p>
              <p className="text-lg text-muted-foreground">
                C&apos;est gratuit, sur inscription :
              </p>
              <Button className="mt-4">
                Réserver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
