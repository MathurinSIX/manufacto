import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (!user) {
    return null;
  }

  const userMetadata =
    user.user_metadata ||
    ("user_metadata" in user ? (user as { user_metadata?: Record<string, string> }).user_metadata : undefined);

  const firstName =
    user.first_name ||
    user.given_name ||
    userMetadata?.first_name ||
    userMetadata?.firstName;
  const lastName =
    user.last_name ||
    user.family_name ||
    userMetadata?.last_name ||
    userMetadata?.lastName;

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || user.name || user.email;

  return (
    <div className="flex items-center gap-4">
      Salut, {displayName} !
      <LogoutButton />
    </div>
  );
}
