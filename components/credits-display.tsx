import { createClient } from "@/lib/supabase/server";
import { CreditsDisplayClient } from "./credits-display-client";
import { unstable_noStore } from "next/cache";

export async function CreditsDisplay() {
  unstable_noStore();
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  let credits = 0;

  if (user?.id) {
    // Fetch all credits for the user and sum the amount
    const { data: creditsData, error } = await supabase
      .from("credit")
      .select("amount")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching credits:", error);
    } else if (creditsData && Array.isArray(creditsData)) {
      // Sum all amounts from the credits table for this user
      credits = creditsData.reduce((sum, row) => {
        // Handle different data types - amount is real in PostgreSQL
        let amount = 0;
        if (row.amount != null) {
          if (typeof row.amount === 'number') {
            amount = row.amount;
          } else if (typeof row.amount === 'string') {
            amount = parseFloat(row.amount) || 0;
          }
        }
        return sum + amount;
      }, 0);
    }
  }

  return <CreditsDisplayClient credits={credits} isLoggedIn={!!user} />;
}

