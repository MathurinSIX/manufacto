import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SquareReturnPage() {
  return (
    <main className="min-h-screen bg-[#fff8f0] px-5 py-20 text-black">
      <Card className="mx-auto max-w-[620px] rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="text-[30px] leading-tight">
            Paiement reçu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-normal text-black/70">
          <p>
            Merci pour votre achat. Square confirme le paiement en arrière-plan ;
            votre réservation ou vos crédits apparaîtront dans votre compte dans
            quelques instants.
          </p>
          <Link
            href="/account"
            className="inline-flex rounded-[14px] bg-[#4a56dd] px-5 py-3 font-semibold text-white transition hover:bg-[#3844c8]"
          >
            Retour à mon compte
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

