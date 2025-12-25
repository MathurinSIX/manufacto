import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { unstable_noStore } from "next/cache";

export async function AdminButton() {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Check if user is admin - use getClaims to access app_metadata
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const isAdmin = (claims as any)?.app_metadata?.role === "admin";

  if (!isAdmin) {
    return null;
  }

  return (
    <Link href="/admin">
      <Button variant="outline" size="sm">
        <Shield className="h-4 w-4 mr-2" />
        Admin
      </Button>
    </Link>
  );
}

