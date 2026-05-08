import Link from "next/link";

import { InstagramIcon } from "@/components/instagram-icon";

const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white">
      <div className="mx-auto grid max-w-[1030px] gap-10 px-5 py-12 text-base md:grid-cols-[1fr_150px_150px_220px]">
        <div>
          <p className="mb-20 text-2xl leading-normal">Manufacto</p>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-6 w-6" />
          </Link>
        </div>

        <div className="space-y-6 font-medium leading-normal">
          <div className="space-y-6 text-[#454545]">
            <Link href="/atelier" className="block hover:text-black">
              L&apos;Atelier
            </Link>
            <Link href="/cours" className="block hover:text-black">
              Cours
            </Link>
            <Link href="/pratique-libre" className="block hover:text-black">
              Pratique libre
            </Link>
          </div>
        </div>

        <div className="space-y-6 font-medium leading-normal">
          <div className="space-y-6 text-[#454545]">
            <Link href="/contact" className="block hover:text-black">
              Contact
            </Link>
            <Link href="/activities" className="block hover:text-black">
              Calendrier
            </Link>
            <Link href="/account" className="block hover:text-black">
              Mon compte
            </Link>
          </div>
        </div>

        <div className="space-y-3 font-medium leading-normal">
          <div className="space-y-1 text-[#454545]">
            <a href="tel:+33607080910" className="block hover:text-black">
              06 07 08 09 10
            </a>
            <a href="mailto:contact@manufacto-marseille.com" className="block hover:text-black">
              contact@manufacto-marseille.com
            </a>
            <p>8 rue de Locarno</p>
            <p>13005 Marseille</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
