import Image from "next/image";
import { Navigation } from "@/components/navigation";

export default async function AtelierPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navigation />
      <div className="flex-1 w-full flex flex-col items-center">
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
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-3">
                <p className="text-sm uppercase tracking-wide text-foreground/80">
                  L&apos;Atelier
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Bienvenue à L&apos;Atelier
                </h1>
                <p className="text-lg text-foreground/90 max-w-3xl mx-auto">
                  Découvrez notre espace de création et de fabrication. L&apos;atelier
                  est un lieu dédié à la couture, à la création et à l&apos;apprentissage.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
          <div className="w-full max-w-6xl space-y-10">
          </div>
        </div>
      </div>
    </main>
  );
}
