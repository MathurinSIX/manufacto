"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mf_pwa_hint_dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function AccountPwaHint() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (isStandalone()) return;
    const ua = navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua));
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-[16px] border border-[#4a56dd]/25 bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-black/85">
          Ajouter Mon compte sur votre écran d&apos;accueil
        </p>
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-black/45"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
        >
          OK
        </button>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-black/70">
        {ios ? (
          <>
            <li>Ouvrez cette page dans Safari.</li>
            <li>Touchez le bouton Partager.</li>
            <li>Choisissez Sur l&apos;écran d&apos;accueil, puis Ajouter.</li>
          </>
        ) : (
          <>
            <li>Ouvrez cette page dans Chrome.</li>
            <li>Touchez le menu ⋮ en haut à droite.</li>
            <li>Choisissez Ajouter à l&apos;écran d&apos;accueil, puis Installer.</li>
          </>
        )}
      </ol>
    </div>
  );
}
