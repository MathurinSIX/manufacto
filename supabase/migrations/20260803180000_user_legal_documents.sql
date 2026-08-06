-- Client profile, legal document acceptances, habilitations, signature storage

CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  birth_date DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  insurance_company TEXT,
  insurance_policy_number TEXT,
  image_rights BOOLEAN,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  requires_signature BOOLEAN NOT NULL DEFAULT true,
  is_current BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_key, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS legal_document_one_current_per_key
  ON legal_document (doc_key)
  WHERE is_current;

CREATE TABLE IF NOT EXISTS user_legal_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_document_id UUID NOT NULL REFERENCES legal_document(id) ON DELETE RESTRICT,
  typed_name TEXT NOT NULL,
  signature_path TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('online', 'on_site', 'paper')),
  collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, legal_document_id)
);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptance_user_id
  ON user_legal_acceptance(user_id);

CREATE TABLE IF NOT EXISTS user_habilitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_key TEXT NOT NULL,
  label TEXT NOT NULL,
  notes TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, machine_key)
);

CREATE INDEX IF NOT EXISTS idx_user_habilitation_user_id
  ON user_habilitation(user_id);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legal_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habilitation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profile FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profile FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profile FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON user_profile FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Authenticated users can read current legal documents"
  ON legal_document FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage legal documents"
  ON legal_document FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can view their own legal acceptances"
  ON user_legal_acceptance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own online legal acceptances"
  ON user_legal_acceptance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND channel = 'online');

CREATE POLICY "Admins can manage all legal acceptances"
  ON user_legal_acceptance FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can manage habilitations"
  ON user_habilitation FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can view their own habilitations"
  ON user_habilitation FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Private bucket for handwritten signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-signatures',
  'legal-signatures',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users can upload their own signatures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'legal-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own signatures"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'legal-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can manage legal signatures"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'legal-signatures'
    AND (auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'legal-signatures'
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- Seed current legal documents (bodies also kept in app code as fallback)
INSERT INTO legal_document (doc_key, version, title, body_md, requires_signature, is_current)
VALUES
(
  'reglement_interieur',
  '2026-08',
  'Règlement intérieur',
  $md$
# Règlement intérieur

Bienvenue à Manufacto – Un atelier partagé où le savoir-faire et le respect vont de pair.

L’atelier est un lieu de travail partagé et multidisciplinaire, destiné à accueillir plusieurs activités :

- Des particuliers utilisant l’atelier dans le cadre de forfaits horaires (location d’un établi ou poste de travail et accès aux équipements).
- Des particuliers participant à des cours de montée en compétences organisés par Manufacto.
- Des résident·es ayant accès à l’atelier pour leur propre pratique, dans le cadre de la convention de résidence définie pour cet usage.
- La location ou la mise à disposition de l’atelier à des structures associatives, dans le cadre d’activités en lien avec celles proposées par Manufacto.

Le présent règlement a pour objet de définir les conditions d’utilisation des locaux et équipements, de garantir la sécurité des personnes et des biens, et de préserver un cadre de travail respectueux pour tous.

## Article 1 – Horaires et accès

Pour les particuliers :

- L’atelier est accessible uniquement sur les horaires d’ouvertures de Manufacto, à savoir :
  - le mardi de 13h à 20h
  - le mercredi de 9h à 21h
  - le jeudi de 13h à 21h
  - le vendredi de 9h à 16h
  - le samedi de 9h à 17h.
- L’accès est réservé aux personnes inscrites, à jour de leur règlement, et ayant accepté ce règlement intérieur.
- L’accès se fait sous la responsabilité des gestionnaires de l’atelier. Toute entrée en dehors des horaires autorisés est interdite.

## Article 2 – Respect et savoir-vivre

- Manufacto est un atelier partagé, ouvert à tous et toutes.
- Aucune discrimination ne sera tolérée au sein de l’atelier.

## Article 3 – Respect du voisinage

- Il est impératif de limiter les nuisances sonores et de respecter le voisinage. Pour cela, les fenêtres seront fermées si le bruit à l’intérieur de l’atelier devenait trop important.
- Les locaux sont strictement non-fumeurs.

## Article 4 – Utilisation des espaces

- Chaque utilisateur s’engage à respecter les locaux et le matériel mis à disposition.
- Toute dégradation devra être signalée au responsable d’atelier, ou à défaut, à un des salariés de Manufacto.
- Les espaces communs doivent être laissés propres et libres de tout encombrement. Les utilisateurs doivent nettoyer l’espace de travail qu’ils ont utilisé à la fin de leur séance. Le matériel nécessaire est à disposition.

## Article 5 – Matériel, équipements et consommables

- Les outils et machines doivent être utilisés conformément à leur usage et avec soin.
- Des formations spécifiques sont proposées sur la totalité des machines et outils disponibles. Nous vous demandons expressément de n’utiliser que celles que vous maîtrisez.
- Chaque outil doit être nettoyé et remis à sa place après utilisation.
- Toute anomalie, panne ou dégradation doit être signalée immédiatement aux responsables.
- Certains consommables (quincaillerie, fils, matériaux de réemploi etc.) peuvent être mis à disposition par l’atelier, dans la limite des stocks disponibles. Leur usage doit rester raisonnable. Tout consommable particulier est à la charge de l’utilisateur.
- L’utilisation de produits dangereux ou inflammables est soumise à autorisation préalable.

## Article 6 – Hygiène et sécurité

- Le port des équipements de protection individuels (gants, lunettes, masque anti-poussière) est recommandé ou obligatoire selon les travaux réalisés.
- Il est interdit de manipuler les machines sans en connaître le fonctionnement.
- Toute consommation d’alcool ou état d’ébriété est interdite dans l’atelier.
- Les repas et boissons ne doivent être consommés que dans les espaces prévus à cet effet.

## Article 7 – Gestion des déchets

- Les bacs et contenants de tri mis à disposition doivent être respectés.
- Les produits dangereux doivent être déposés dans les contenants adaptés.

## Article 8 – Responsabilités et assurances

- Chaque utilisateur est responsable de son comportement et de ses biens personnels.
- Les utilisateurs doivent disposer d’une assurance responsabilité civile couvrant leur activité.
- L’atelier décline toute responsabilité en cas de perte, vol ou détérioration d’effets personnels.
- En cas de détérioration volontaire ou par négligence du matériel ou des locaux, les réparations seront facturées à l’utilisateur concerné.

## Article 9 – Sanctions

Tout manquement répété ou grave aux règles du présent règlement pourra entraîner :

- Un rappel à l’ordre écrit ou oral.
- Une exclusion temporaire de l’atelier.
- Une exclusion définitive sans remboursement des sommes engagées.

Ce règlement intérieur est affiché dans l’atelier. Il s’applique à l’ensemble des utilisateurs et doit être respecté sans exception.
$md$,
  true,
  true
),
(
  'decharge_responsabilite',
  '2026-08',
  'Décharge de responsabilité',
  $md$
# Décharge de responsabilité

**Manufacto, atelier partagé**  
8 rue de Locarno, 13005 Marseille

## Préambule

L'atelier met à disposition des espaces de travail, outils et machines destinés à des activités de fabrication, bricolage, travail du bois, du textile, de l'électronique et de la céramique, ou autres activités manuelles susceptibles de présenter des risques de blessures corporelles ou de dommages matériels.

Le participant souhaite accéder à ces installations et reconnaît avoir été informé des risques associés.

## Article 1 – Reconnaissance des risques

Je reconnais être informé(e) que l'utilisation des locaux, outils, équipements et machines de l'atelier comporte notamment des risques de :

- coupures, perforations et écrasements ;
- brûlures ;
- projections de particules ou de matières ;
- électrocution ou choc électrique ;
- blessures liées à l'utilisation de machines motorisées ;
- dommages causés à mes biens personnels.

Je déclare comprendre la nature de ces risques et les accepter en connaissance de cause.

## Article 2 – Engagements du participant

Je m'engage à :

- respecter l'ensemble des consignes de sécurité affichées ou communiquées par l'atelier ;
- utiliser les équipements de protection individuelle requis ;
- ne pas utiliser une machine pour laquelle je n'ai pas reçu l'autorisation ou la formation requise ;
- signaler immédiatement tout dysfonctionnement ou situation dangereuse ;
- ne pas intervenir sur les dispositifs de sécurité des machines ;
- cesser immédiatement l'utilisation d'un équipement en cas de doute sur son fonctionnement.

Je reconnais que l'atelier peut me refuser l'accès à certaines machines ou interrompre mon activité en cas de non-respect des règles de sécurité.

## Article 3 – État de santé

Je déclare être physiquement et mentalement apte à utiliser les équipements auxquels j'aurai accès.

Je m'engage à ne pas utiliser les machines sous l'influence de l'alcool, de stupéfiants ou de toute substance susceptible d'altérer ma vigilance.

## Article 4 – Responsabilité

Je reconnais demeurer responsable de mes actes, de mes choix techniques et de l'utilisation que je fais des équipements mis à disposition.

Je reconnais que la présente déclaration ne limite pas les responsabilités qui ne peuvent être légalement exclues ou limitées par la loi.

## Article 5 – Assurance

Je déclare disposer d'une assurance responsabilité civile en cours de validité couvrant les dommages que je pourrais causer à des tiers dans le cadre de ma participation aux activités de l'atelier.

## Article 6 – Données d'urgence

Une personne à prévenir et un numéro de téléphone doivent être renseignés.

## Article 7 – Acceptation

Je reconnais avoir pris connaissance des risques liés à l'utilisation des installations de l'atelier, avoir reçu les informations nécessaires à ma sécurité et accepter de respecter l'ensemble des règles applicables.

Signature du participant précédée de la mention :  
« Lu et approuvé, je reconnais avoir été informé(e) des risques et m'engage à respecter les consignes de sécurité de l'atelier. »
$md$,
  true,
  true
)
ON CONFLICT (doc_key, version) DO UPDATE
SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  requires_signature = EXCLUDED.requires_signature,
  is_current = EXCLUDED.is_current;
