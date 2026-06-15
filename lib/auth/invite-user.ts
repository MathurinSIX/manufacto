import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const ALREADY_EXISTS_HINTS = [
  "user already registered",
  "email already registered",
  "already exists",
  "already registered",
  "user already exists",
  "duplicate key value",
];

export function isAlreadyExistsError(message: string) {
  const lower = message.toLowerCase();
  return ALREADY_EXISTS_HINTS.some((hint) => lower.includes(hint));
}

function createPublicAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configuration d'authentification indisponible.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type InviteUserResult = {
  user: User | null;
  emailSent: boolean;
  error: string | null;
};

export async function inviteNewUserByEmail(
  adminClient: SupabaseClient,
  email: string,
  options: {
    data?: Record<string, string>;
    redirectTo: string;
  },
): Promise<InviteUserResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: options.data,
      redirectTo: options.redirectTo,
    },
  );

  if (error) {
    return {
      user: null,
      emailSent: false,
      error: error.message,
    };
  }

  return {
    user: data.user,
    emailSent: true,
    error: null,
  };
}

export type SendAccountAccessEmailResult = {
  emailSent: boolean;
  method: "recovery" | "magiclink";
  error: string | null;
};

export async function sendAccountAccessEmail(
  email: string,
  redirectTo: string,
): Promise<SendAccountAccessEmailResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const publicClient = createPublicAuthClient();

  const { error: resetError } = await publicClient.auth.resetPasswordForEmail(
    normalizedEmail,
    { redirectTo },
  );

  if (!resetError) {
    return {
      emailSent: true,
      method: "recovery",
      error: null,
    };
  }

  const { error: otpError } = await publicClient.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (otpError) {
    return {
      emailSent: false,
      method: "magiclink",
      error: otpError.message,
    };
  }

  return {
    emailSent: true,
    method: "magiclink",
    error: null,
  };
}
