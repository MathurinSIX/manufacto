import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the origin from the request headers
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Sign up the user
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm`,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (signUpError) {
      // Check if the error indicates the account already exists
      const errorMessage = signUpError.message.toLowerCase();
      if (
        errorMessage.includes("user already registered") ||
        errorMessage.includes("email already registered") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("already registered") ||
        errorMessage.includes("user already exists")
      ) {
        return NextResponse.json(
          { error: "Un compte avec cet e-mail existe déjà. Veuillez vous connecter ou réinitialiser votre mot de passe." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Explicitly sign out to ensure user is not logged in until email is confirmed
    await supabase.auth.signOut();

    return NextResponse.json(
      { message: "Compte créé avec succès. Veuillez vérifier votre e-mail pour confirmer votre compte." },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de la création du compte" },
      { status: 500 }
    );
  }
}

