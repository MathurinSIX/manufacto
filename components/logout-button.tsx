"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Refresh the router to clear server-side state
    router.refresh();
    // Redirect to home page (landing page)
    router.push("/");
  };

  return <Button onClick={logout}>Déconnexion</Button>;
}
