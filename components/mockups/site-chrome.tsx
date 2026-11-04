"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import { MockupSwitcher } from "@/components/mockups/shared";
import { HashLink } from "@/components/hash-link";
import { NAV_LINKS } from "@/lib/nav-links";
import {
  mockupHref,
  scopeHref,
  PROPOSAL_BASE,
  type ProposalId,
  type SiteScope,
} from "@/components/mockups/paths";

export type { ProposalId, SiteScope };
export { mockupHref, scopeHref, PROPOSAL_BASE };

function AccountButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/account"
      className={`inline-flex items-center gap-2 rounded-[12px] border-2 border-[#4a56dd] bg-white px-4 py-2.5 text-base font-semibold text-[#4a56dd] transition hover:bg-[#f0f1ff] ${className}`}
    >
      <User className="h-[1.1em] w-[1.1em] shrink-0" strokeWidth={2.25} aria-hidden />
      mon compte
    </Link>
  );
}

function Topbar({
  scope,
  activePath = "/",
  stickyClass = "sticky top-0 z-40",
}: {
  scope: SiteScope;
  activePath?: string;
  stickyClass?: string;
}) {
  const home = scopeHref(scope);

  return (
    <header className={`${stickyClass} border-b border-black/10 bg-white`}>
      <div className="mx-auto flex h-[88px] max-w-[1320px] items-center justify-between gap-4 px-5 md:px-8">
        <Link href={home} className="relative h-[48px] w-[160px] shrink-0">
          <Image
            src="/assets/figma-landing/logo-mark.png"
            alt="Manufacto"
            fill
            className="object-contain object-left"
            sizes="160px"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 text-base md:flex">
          {NAV_LINKS.map((item) => {
            const href = scopeHref(scope, item.href);
            const isActive =
              activePath === item.href || activePath.startsWith(`${item.href}/`);
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={href}
                  className={`inline-flex py-6 leading-normal transition hover:text-[#4a56dd] ${
                    isActive ? "font-semibold text-[#4a56dd]" : "text-black"
                  }`}
                >
                  {item.label}
                </Link>
                {item.subLinks?.length ? (
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 hidden w-max -translate-x-1/2 group-hover:block group-focus-within:block">
                    <div className="pointer-events-auto flex min-w-[168px] flex-col gap-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-tight text-black/60 shadow-lg">
                      {item.subLinks.map((subLink) => (
                        <HashLink
                          key={subLink.href}
                          href={scopeHref(scope, subLink.href)}
                          className="whitespace-nowrap py-1 hover:text-[#4a56dd]"
                        >
                          {subLink.label}
                        </HashLink>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <AccountButton className="hidden sm:inline-flex" />
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-md bg-[#f2f2f2] px-3 py-2 text-sm font-semibold">
              Menu
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-black/10 bg-white p-3 shadow-lg">
              <Link href={home} className="block px-2 py-2 hover:text-[#4a56dd]">
                accueil
              </Link>
              {NAV_LINKS.map((item) => (
                <div key={item.href} className="py-1">
                  <Link
                    href={scopeHref(scope, item.href)}
                    className="block px-2 py-2 font-medium hover:text-[#4a56dd]"
                  >
                    {item.label}
                  </Link>
                  {item.subLinks?.length ? (
                    <div className="pb-1 pl-4">
                      {item.subLinks.map((subLink) => (
                        <HashLink
                          key={subLink.href}
                          href={scopeHref(scope, subLink.href)}
                          className="block px-2 py-1.5 text-sm text-black/60 hover:text-[#4a56dd]"
                        >
                          {subLink.label}
                        </HashLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <Link
                href="/account"
                className="mt-2 flex items-center justify-center gap-2 rounded-[12px] border-2 border-[#4a56dd] px-3 py-2.5 text-center font-semibold text-[#4a56dd]"
              >
                <User className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                mon compte
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function Footer({ scope }: { scope: SiteScope }) {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white">
      <div className="mx-auto grid max-w-[1030px] gap-10 px-5 py-12 text-base md:grid-cols-[1fr_150px_150px_220px]">
        <div>
          <Link
            href={scopeHref(scope)}
            className="relative mb-12 block h-[57px] w-[190px]"
          >
            <Image
              src="/assets/figma-landing/logo-mark.png"
              alt="Manufacto"
              fill
              className="object-contain object-left"
              sizes="190px"
            />
          </Link>
          <a
            href="https://www.instagram.com/manufacto.marseille/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-6 w-6" />
          </a>
        </div>

        <div className="space-y-4 font-medium text-[#454545]">
          <Link href={scopeHref(scope, "/atelier")} className="block hover:text-black">
            L&apos;Atelier
          </Link>
          <Link href={scopeHref(scope, "/cours")} className="block hover:text-black">
            Cours
          </Link>
          <Link href={scopeHref(scope, "/pratique-libre")} className="block hover:text-black">
            Pratique libre
          </Link>
        </div>

        <div className="space-y-4 font-medium text-[#454545]">
          <Link href={scopeHref(scope, "/offrir")} className="block hover:text-black">
            Offrir / carte cadeau
          </Link>
          <Link href={scopeHref(scope, "/contact")} className="block hover:text-black">
            Contact & visite
          </Link>
          <Link href="/account" className="block font-semibold text-[#4a56dd] hover:text-[#3540bf]">
            Mon compte
          </Link>
        </div>

        <div className="space-y-2 text-[#454545]">
          <p>8 rue de Locarno</p>
          <p>13005 Marseille</p>
          <a href="mailto:contact@manufacto-marseille.fr" className="block hover:text-black">
            contact@manufacto-marseille.fr
          </a>
          <a href="tel:+33743461214" className="block hover:text-black">
            07 43 46 12 14
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Production topbar (Chemin + cours) */
export function SiteTopbar() {
  const pathname = usePathname() ?? "/";
  return <Topbar scope="site" activePath={pathname} stickyClass="sticky top-0 z-40" />;
}

export function SiteFooter() {
  return <Footer scope="site" />;
}

export function MockupTopbar({
  proposal,
  activePath = "/",
}: {
  proposal: ProposalId;
  activePath?: string;
}) {
  return (
    <Topbar
      scope={proposal}
      activePath={activePath}
      stickyClass="sticky top-[45px] z-40"
    />
  );
}

export function MockupFooter({ proposal }: { proposal: ProposalId }) {
  return <Footer scope={proposal} />;
}

export function MockupSiteShell({
  proposal,
  children,
}: {
  proposal: ProposalId;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const base = PROPOSAL_BASE[proposal];
  let activePath = pathname.startsWith(base) ? pathname.slice(base.length) : "/";
  if (!activePath) activePath = "/";

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <MockupSwitcher active={proposal} />
      <MockupTopbar proposal={proposal} activePath={activePath} />
      <div className="flex-1">{children}</div>
      <MockupFooter proposal={proposal} />
    </div>
  );
}
