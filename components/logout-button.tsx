"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <Button
      onClick={logout}
      className={cn(
        "h-auto rounded-[14px] bg-[#4a56dd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3844c8]",
        className,
      )}
    >
      Déconnexion
    </Button>
  );
}
