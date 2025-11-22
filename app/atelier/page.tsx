import { Navigation } from "@/components/navigation";

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
        </div>
      </div>
    </main>
  );
}
