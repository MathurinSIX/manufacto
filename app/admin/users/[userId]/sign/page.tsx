import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { DocumentSigningForm } from "@/components/legal/document-signing-form";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/square/server";
import { getUserLegalCompliance } from "@/lib/legal/status";

type PageProps = {
  params: Promise<{ userId: string }>;
};

async function AdminSignContent({ params }: PageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/admin");
  }

  const adminClient = getAdminClient();
  const { data: target, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !target.user) {
    notFound();
  }

  const status = await getUserLegalCompliance(supabase, userId);
  const defaultTypedName = [
    target.user.user_metadata?.first_name,
    target.user.user_metadata?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <Link
          href={`/admin/users/${userId}`}
          className="text-sm font-semibold text-[#f56800] underline underline-offset-2"
        >
          ← retour à la fiche
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Signature sur place</h1>
        <p className="mt-2 text-muted-foreground">
          {target.user.email}
          {defaultTypedName ? ` · ${defaultTypedName}` : ""}
        </p>
      </div>

      {status.complete ? (
        <div className="rounded-lg border bg-green-50 p-4 text-sm text-green-800">
          Les documents sont déjà signés pour ce compte.
        </div>
      ) : (
        <div className="rounded-lg border bg-[#fff8f0] p-6">
          <DocumentSigningForm
            documents={status.documents}
            profile={status.profile}
            defaultTypedName={defaultTypedName}
            targetUserId={userId}
            channel="on_site"
            returnTo={`/admin/users/${userId}`}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminUserSignPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement…</div>}>
      <AdminSignContent {...props} />
    </Suspense>
  );
}
