import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
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
      title: "Streamlined Manufacturing",
      description:
        "Manage your entire manufacturing process from start to finish with our intuitive platform. Track production, inventory, and quality control all in one place.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Manufacturing",
    },
    {
      title: "Real-Time Analytics",
      description:
        "Get instant insights into your operations with comprehensive dashboards and reports. Make data-driven decisions to optimize your manufacturing efficiency.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Analytics",
    },
    {
      title: "Supply Chain Integration",
      description:
        "Seamlessly connect with suppliers and distributors. Automate ordering, track shipments, and maintain optimal inventory levels automatically.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Supply+Chain",
    },
    {
      title: "Quality Assurance",
      description:
        "Ensure product quality at every stage with built-in quality control workflows. Document inspections, track defects, and maintain compliance standards.",
      image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Quality+Control",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Top Navigation Bar */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <Link
              href={"/"}
              className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              Manufacto
            </Link>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="w-full max-w-7xl px-5 pt-12 pb-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Transform Your Manufacturing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The complete solution for modern manufacturing operations. Streamline
              your processes, boost productivity, and scale your business.
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
            Powered by{" "}
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
