import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTab } from "@/components/admin-users-tab";
import { AdminActivitiesTab } from "@/components/admin-activities-tab";
import { AdminAddActivitiesTab } from "@/components/admin-add-activities-tab";
import { AdminActivitiesManagementTab } from "@/components/admin-activities-management-tab";

async function AdminContent() {
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
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                <TabsTrigger value="activities-management">Activités</TabsTrigger>
                <TabsTrigger value="activities">Sessions</TabsTrigger>
                <TabsTrigger value="add-activities">Ajouter des sessions</TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="mt-4">
                <AdminUsersTab />
              </TabsContent>
              <TabsContent value="activities-management" className="mt-4">
                <AdminActivitiesManagementTab />
              </TabsContent>
              <TabsContent value="activities" className="mt-4">
                <AdminActivitiesTab />
              </TabsContent>
              <TabsContent value="add-activities" className="mt-4">
                <AdminAddActivitiesTab />
              </TabsContent>
            </Tabs>
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

