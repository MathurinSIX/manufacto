import { Suspense } from "react";

import { NewsletterPanel } from "@/app/newsletter/page";
import { ReservationModal } from "@/components/reservation-modal";

type Search = {
  error?: string;
  success?: string;
};

export default function NewsletterModalPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <ReservationModal title="s'inscrire à la newsletter">
      <Suspense
        fallback={
          <div className="px-5 py-16 text-center text-black/70">
            Chargement…
          </div>
        }
      >
        <NewsletterPanel searchParams={searchParams} isModal />
      </Suspense>
    </ReservationModal>
  );
}
