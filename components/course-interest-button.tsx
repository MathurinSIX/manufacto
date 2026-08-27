"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { toggleCourseInterest } from "@/app/cours/actions";
import { AuthModal } from "@/components/auth-modal";
import { cn } from "@/lib/utils";

type CourseInterestButtonProps = {
  activityId: string;
  isLoggedIn: boolean;
  isInterested: boolean;
  redirectPath: string;
  className?: string;
};

function interestRedirectUrl(redirectPath: string) {
  const url = new URL(redirectPath, window.location.origin);
  url.searchParams.set("interest", "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function CourseInterestButton({
  activityId,
  isLoggedIn,
  isInterested: initialIsInterested,
  redirectPath,
  className,
}: CourseInterestButtonProps) {
  const [isInterested, setIsInterested] = useState(initialIsInterested);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [authOpen, setAuthOpen] = useState(false);
  const autoInterestHandled = useRef(false);

  const registerInterest = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleCourseInterest(activityId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsInterested(result.interested);
    });
  };

  // After login/signup, land with ?interest=1 so cookies are present before the server action.
  useEffect(() => {
    if (!isLoggedIn || initialIsInterested || autoInterestHandled.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("interest") !== "1") return;

    autoInterestHandled.current = true;
    params.delete("interest");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);

    registerInterest();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for ?interest=1
  }, [isLoggedIn, initialIsInterested, activityId]);

  if (!isLoggedIn) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-[#4a56dd] px-4 py-2 text-base font-semibold text-[#4a56dd] transition hover:bg-[#4a56dd]/5",
          )}
        >
          je suis intéressé·e
        </button>
        <AuthModal
          open={authOpen}
          onOpenChange={setAuthOpen}
          defaultView="login"
          onSuccess={() => {
            setAuthOpen(false);
            window.location.assign(interestRedirectUrl(redirectPath));
          }}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={registerInterest}
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-base font-semibold transition disabled:opacity-60",
          isInterested
            ? "border-black/20 bg-black/5 text-black/75"
            : "border-[#4a56dd] text-[#4a56dd] hover:bg-[#4a56dd]/5",
        )}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isInterested ? "intérêt enregistré" : "je suis intéressé·e"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
