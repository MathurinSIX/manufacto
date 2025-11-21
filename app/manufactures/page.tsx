import { Navigation } from "@/components/navigation";

export default async function ManufacturesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navigation />
      <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Manufactures
            </p>
            <h1 className="text-4xl md:text-5xl font-bold">
              Les Manufactures
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Découvrez nos manufactures et nos réalisations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

