import { createClient as createAdminClient } from "@supabase/supabase-js";
import { syncSupabaseUserToSquare } from "@/lib/square/server";
import { NextResponse } from "next/server";

const ALREADY_EXISTS_HINTS = [
  "user already registered",
  "email already registered",
  "already exists",
  "already registered",
  "user already exists",
  "duplicate key value",
];

function isAlreadyExistsError(message: string) {
  const lower = message.toLowerCase();
  return ALREADY_EXISTS_HINTS.some((hint) => lower.includes(hint));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuration d'authentification indisponible." },
        { status: 500 },
      );
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the account with the admin API so we can force-confirm the
    // email. The reservation/checkout flow expects to sign the user in
    // immediately after signup, which fails when the project has email
    // confirmations enabled. Force-confirming here keeps that contract
    // regardless of the project's auth settings (local or remote).
    const { data: createdUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (createError) {
      if (isAlreadyExistsError(createError.message)) {
        return NextResponse.json(
          {
            error:
              "Un compte avec cet e-mail existe déjà. Veuillez vous connecter ou réinitialiser votre mot de passe.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: createError.message },
        { status: 400 },
      );
    }

    if (createdUser?.user?.id) {
      try {
        await syncSupabaseUserToSquare({
          supabase: adminClient,
          userId: createdUser.user.id,
        });
      } catch (squareError) {
        console.error("Error syncing Square customer for new user:", squareError);
      }
    }

    return NextResponse.json(
      {
        message: "Compte créé avec succès.",
        userId: createdUser?.user?.id ?? null,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de la création du compte" },
      { status: 500 },
    );
  }
}

