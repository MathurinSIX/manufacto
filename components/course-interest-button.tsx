"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { toggleCourseInterest } from "@/app/cours/actions";
import { cn } from "@/lib/utils";

type CourseInterestButtonProps = {
  activityId: string;
  isLoggedIn: boolean;
  isInterested: boolean;
  redirectPath: string;
  className?: string;
};

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

  if (!isLoggedIn) {
    const loginHref = `/auth/login?next=${encodeURIComponent(redirectPath)}`;

    return (
      <Link
        href={loginHref}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-[#4a56dd] px-4 py-2 text-base font-semibold text-[#4a56dd] transition hover:bg-[#4a56dd]/5",
          className,
        )}
      >
        je suis intéressé·e
      </Link>
    );
  }

  const handleToggle = () => {
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

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
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
