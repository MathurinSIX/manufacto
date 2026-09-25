import { updateSession } from "@/lib/supabase/proxy";
import {
  DISTINCT_ID_COOKIE,
  EXPERIMENT_OVERRIDE_COOKIE,
} from "@/lib/posthog/experiments";
import { type NextRequest } from "next/server";

const OVERRIDE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days for local QA

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  if (!request.cookies.get(DISTINCT_ID_COOKIE)?.value) {
    response.cookies.set(DISTINCT_ID_COOKIE, crypto.randomUUID(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // Persist ?ph_exp= across client navigations (Links drop the query string).
  const phExp = request.nextUrl.searchParams.get("ph_exp")?.trim();
  if (phExp === "clear" || phExp === "") {
    response.cookies.set(EXPERIMENT_OVERRIDE_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  } else if (phExp) {
    response.cookies.set(EXPERIMENT_OVERRIDE_COOKIE, phExp, {
      path: "/",
      maxAge: OVERRIDE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
