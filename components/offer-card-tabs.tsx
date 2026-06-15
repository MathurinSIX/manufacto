"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type Offer = {
  title: string;
  summary: string;
  detail?: string | ReactNode;
  image?: string;
  detailImage?: string;
  activityId?: string;
  activityCredits?: number | null;
  reservable?: boolean;
};

export function OfferCardTabs({
  offers,
  columns = 3,
  isLoggedIn = false,
}: {
  offers: Offer[];
  columns?: 2 | 3;
  isLoggedIn?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeOffer = activeIndex === null ? null : offers[activeIndex];

  const body = activeOffer ? activeOffer.detail ?? activeOffer.summary : null;
  const showReservation = activeOffer?.reservable !== false;
  const reservationHref = activeOffer?.activityId
    ? `/reserver?activity=${encodeURIComponent(activeOffer.activityId)}`
    : "/reserver";

  const reserveLinkClass =
    "mt-8 inline-flex text-base font-semibold text-[#4a56dd] underline underline-offset-4 transition hover:text-[#3540bf] md:text-lg";

  const reserveControl = showReservation ? (
    <Link href={reservationHref} className={reserveLinkClass}>
      réserver
    </Link>
  ) : null;

  return (
    <div>
      <div className={`mt-7 grid gap-6 ${columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {offers.map((offer, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={offer.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative flex min-h-[330px] flex-col justify-end overflow-hidden bg-[#d9d9d9] p-6 text-left transition ${
                isActive
                  ? "ring-2 ring-[#2d9cdb]"
                  : "opacity-60 hover:opacity-85"
              }`}
            >
            {offer.image ? (
              <Image
                src={offer.image}
                alt=""
                fill
                className="object-cover"
                sizes={columns === 3 ? "(max-width: 768px) 100vw, 360px" : "(max-width: 768px) 100vw, 520px"}
                aria-hidden
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white/85 to-white/0" />
            <h4 className="relative text-[26px] font-bold leading-tight">{offer.title}</h4>
            <p className="relative mt-4 whitespace-pre-line text-xl leading-normal text-black/75">
              {offer.summary}
            </p>
            </button>
          );
        })}
      </div>

      {activeOffer ? (
        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.45fr]">
          <div>
            <h4 className="text-[24px] font-bold leading-tight">
              {activeOffer.title}
            </h4>
            <div className="mt-6 text-base leading-normal text-black/75">
              {typeof body === "string" ? (
                <p className="whitespace-pre-line">{body}</p>
              ) : (
                body
              )}
            </div>
            {reserveControl}
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-[18px] bg-[#d9d9d9]">
            {activeOffer.detailImage || activeOffer.image ? (
              <Image
                src={activeOffer.detailImage || activeOffer.image || ""}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 680px"
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      ) : null}

    </div>
  );
}
