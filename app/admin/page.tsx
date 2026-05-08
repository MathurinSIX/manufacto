import { createClient } from "@/lib/supabase/server";
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

const panelClassName =
  "rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5";

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
    <div className="flex-1 w-full bg-[#fff8f0] text-black">
      <div className="mx-auto w-full max-w-[1274px] px-5 pb-20 pt-16 md:pb-[140px] md:pt-[86px]">
        <div className="mb-10 max-w-[760px] md:mb-14">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#f56800]">
            Espace administrateur
          </p>
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
            Administration
          </h1>
          <p className="mt-5 text-xl leading-normal text-black/75">
            Gérez les utilisateurs, les activités et les sessions
          </p>
        </div>

        <Card className={panelClassName}>
          <CardHeader className="border-b border-black/10 p-6 md:p-8">
            <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
              Panneau d'administration
            </CardTitle>
            <CardDescription className="mt-3 text-base leading-normal text-black/65">
              Accédez aux différentes fonctionnalités d'administration
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <AdminTabsWrapper />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-[#fff8f0] text-black">Chargement...</div>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

