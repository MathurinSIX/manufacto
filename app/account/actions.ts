"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function cancelRegistration(registrationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Verify that the registration belongs to the user
  const { data: registration, error: regError } = await supabase
    .from("registration")
    .select("id, user_id")
    .eq("id", registrationId)
    .eq("user_id", user.id)
    .single();

  if (regError || !registration) {
    return { error: "Réservation introuvable" };
  }

  // Insert a new registration_status with CANCELLED status
  const { error: statusError } = await supabase
    .from("registration_status")
    .insert({
      registration_id: registrationId,
      status: "CANCELLED",
    });

  if (statusError) {
    console.error("Error cancelling registration:", statusError);
    return { error: "Erreur lors de l'annulation" };
  }

  revalidatePath("/account");
  return { success: true };
}


