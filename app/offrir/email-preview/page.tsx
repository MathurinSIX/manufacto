const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const SAMPLE = {
  code: "MANU-K7H2-9QMP",
  expiresOn: "14 septembre 2027",
  message: "Joyeux anniversaire ! On a hâte de te voir à l'atelier.",
  recipientEmail: "ami@exemple.fr",
};

function EmailShell({
  title,
  subject,
  children,
}: {
  title: string;
  subject: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 bg-[#f5f5f5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
          {title}
        </p>
        <p className="mt-1 text-sm text-black/70">
          <span className="font-medium text-black/85">Objet :</span> {subject}
        </p>
      </div>
      <div className="px-5 py-6 text-[15px] leading-relaxed text-[#111]">
        {children}
      </div>
    </section>
  );
}

export default function GiftCardEmailPreviewPage() {
  const creditsSummary = "12 crédits pour la pratique libre";
  const courseSummary = `Un cours Manufacto (${priceFormatter.format(72)})`;

  return (
    <main className="min-h-screen bg-[#e8e4df] px-5 py-12">
      <div className="mx-auto max-w-[640px] space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-black/90">
            Aperçu e-mails carte cadeau
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Preview locale — pas envoyé. Code exemple : {SAMPLE.code}
          </p>
        </header>

        <EmailShell
          title="Destinataire — pack crédits"
          subject={`Votre carte cadeau Manufacto — ${creditsSummary}`}
        >
          <p>Bonjour,</p>
          <p className="mt-3">
            Vous avez reçu une carte cadeau Manufacto :{" "}
            <strong>{creditsSummary}</strong>.
          </p>
          <p className="my-4 rounded-[12px] bg-[#fff8f0] p-4 text-[#333]">
            {SAMPLE.message}
          </p>
          <p className="my-6">
            <span className="inline-block rounded-[12px] bg-[#f56800] px-5 py-3.5 text-[22px] font-bold tracking-[0.08em] text-white">
              {SAMPLE.code}
            </span>
          </p>
          <p>
            Pour l&apos;utiliser, connectez-vous sur le site Manufacto, choisissez
            votre créneau, puis sélectionnez <strong>Carte cadeau</strong> comme
            mode de paiement et saisissez ce code.
          </p>
          <p className="mt-3 text-[#555]">Valable jusqu&apos;au {SAMPLE.expiresOn}.</p>
          <p className="mt-6 text-[#555]">
            À bientôt à l&apos;atelier,
            <br />
            L&apos;équipe Manufacto
          </p>
        </EmailShell>

        <EmailShell
          title="Destinataire — cours (catégorie 02)"
          subject={`Votre carte cadeau Manufacto — ${courseSummary}`}
        >
          <p>Bonjour,</p>
          <p className="mt-3">
            Vous avez reçu une carte cadeau Manufacto :{" "}
            <strong>{courseSummary}</strong>.
          </p>
          <p className="my-6">
            <span className="inline-block rounded-[12px] bg-[#f56800] px-5 py-3.5 text-[22px] font-bold tracking-[0.08em] text-white">
              {SAMPLE.code}
            </span>
          </p>
          <p>
            Pour l&apos;utiliser, connectez-vous sur le site Manufacto, choisissez
            votre créneau, puis sélectionnez <strong>Carte cadeau</strong> comme
            mode de paiement et saisissez ce code.
          </p>
          <p className="mt-3 text-[#555]">Valable jusqu&apos;au {SAMPLE.expiresOn}.</p>
          <p className="mt-6 text-[#555]">
            À bientôt à l&apos;atelier,
            <br />
            L&apos;équipe Manufacto
          </p>
        </EmailShell>

        <EmailShell
          title="Acheteur (si e-mail différent du destinataire)"
          subject="Confirmation — votre carte cadeau Manufacto"
        >
          <p>Bonjour,</p>
          <p className="mt-3">
            Merci pour votre achat. Nous avons envoyé la carte cadeau à{" "}
            <strong>{SAMPLE.recipientEmail}</strong>.
          </p>
          <p className="mt-3">
            Code : <strong>{SAMPLE.code}</strong>
          </p>
          <p className="mt-6 text-[#555]">L&apos;équipe Manufacto</p>
        </EmailShell>
      </div>
    </main>
  );
}
