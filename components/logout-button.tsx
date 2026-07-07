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
    router.refresh();
    router.push("/");
  };

  return (
    <Button
      onClick={logout}
      className={cn(
        "h-auto rounded-none bg-transparent px-0 py-0 text-base font-semibold text-[#4a56dd] underline underline-offset-2 shadow-none hover:bg-transparent hover:text-[#3844c8]",
        className,
      )}
    >
      Déconnexion
    </Button>
  );
}
