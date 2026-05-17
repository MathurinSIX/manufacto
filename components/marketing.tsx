import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const MARKETING_LINK_CLASS =
  "text-2xl font-semibold text-[#4a56dd] underline underline-offset-2";

export function MarketingPageContainer({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1274px] px-5 pb-20 pt-16 md:pb-[140px] md:pt-[86px]",
        className,
      )}
      {...props}
    />
  );
}

export function MarketingPageHeader({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("max-w-[1190px]", className)}>
      <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
        {title}
      </h1>
      {children ? (
        <div className="mt-8 max-w-[1048px] space-y-5 text-xl leading-normal text-black/75">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function MarketingSectionTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={cn("text-[30px] font-bold leading-tight text-black/80", className)}
      {...props}
    />
  );
}

export function MarketingBody({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("space-y-5 text-xl leading-normal text-black/75", className)}
      {...props}
    />
  );
}

export function MarketingLink({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link>) {
  return <Link className={cn(MARKETING_LINK_CLASS, className)} {...props} />;
}

export function VisitAtelierCallout({
  className,
}: {
  className?: string;
}) {
  return (
    <section className={cn("bg-[#fff8f0]", className)}>
      <div className="mx-auto grid max-w-[1274px] gap-6 px-5 py-9 md:grid-cols-[286px_1fr_161px] md:items-center">
        <h2 className="text-[30px] font-bold leading-none tracking-[-0.6px] text-[#f56800]">
          venez découvrir <br />
          l&apos;atelier
        </h2>
        <div className="text-xl leading-normal text-black/75">
          <p>
            Tous les mardi soir, de 18h30 à 19h, Martin, Nafissa, Cyprien et
            Delphine vous présenteront le lieu et son fonctionnement
          </p>
          <p>C&apos;est gratuit, sur inscription.</p>
        </div>
        <MarketingLink href="/reserver" className="md:text-right">
          réserver
        </MarketingLink>
      </div>
    </section>
  );
}
