"use client";

import { useState } from "react";

type Offer = {
  title: string;
  summary: string;
  detail?: string;
};

export function OfferCardTabs({
  offers,
  columns = 3,
}: {
  offers: Offer[];
  columns?: 2 | 3;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeOffer = offers[activeIndex];

  return (
    <div>
      <div className={`mt-7 grid gap-6 ${columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {offers.map((offer, index) => (
          <button
            key={offer.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`flex min-h-[330px] flex-col justify-end bg-[#d9d9d9] p-6 text-left transition ${
              activeIndex === index ? "ring-2 ring-[#2d9cdb]" : "hover:bg-[#d0d0d0]"
            }`}
          >
            <h4 className="text-[26px] font-bold leading-tight">{offer.title}</h4>
            <p className="mt-4 text-xl leading-normal text-black/75">
              {offer.summary}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.45fr]">
        <div>
          <h4 className="text-[24px] font-bold leading-tight">
            {activeOffer.title}
          </h4>
          <p className="mt-6 whitespace-pre-line text-base leading-normal text-black/75">
            {activeOffer.detail ?? activeOffer.summary}
          </p>
        </div>
        <div className="min-h-[520px] rounded-[18px] border-2 border-[#2d9cdb] bg-[#d9d9d9]" />
      </div>
    </div>
  );
}
