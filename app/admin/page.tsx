import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { unstable_noStore } from "next/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminTabsWrapper } from "@/components/admin-tabs-wrapper";

async function AdminContent() {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (user.app_metadata?.role !== "admin") {
    redirect("/account");
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
      <div className="w-full max-w-6xl space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">Administration</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Gérez les utilisateurs, les activités et les sessions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Panneau d'administration</CardTitle>
            <CardDescription>
              Accédez aux différentes fonctionnalités d'administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminTabsWrapper />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navigation />
      <Suspense fallback={<div className="flex-1 w-full flex items-center justify-center">Chargement...</div>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

