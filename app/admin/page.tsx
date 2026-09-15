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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  if (user.app_metadata?.role !== "admin") {
    redirect("/account");
  }

  return (
    <div className="w-full text-black">
      <div className="mb-6 max-w-[760px] md:mb-8">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[34px]">
          Administration
        </h1>
        <p className="mt-2 text-base leading-normal text-black/65 md:text-lg">
          Utilisateurs, activités et sessions.
        </p>
      </div>

      <Card className={panelClassName}>
        <CardHeader className="border-b border-black/10 p-5 md:p-6">
          <CardTitle className="text-[22px] font-semibold leading-tight text-black/80 md:text-[26px]">
            Panneau
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-normal text-black/65">
            Accédez aux fonctionnalités d&apos;administration
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <AdminTabsWrapper />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] w-full items-center justify-center text-base text-black/60">
          Chargement…
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
