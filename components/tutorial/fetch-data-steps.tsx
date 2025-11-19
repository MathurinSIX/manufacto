import { TutorialStep } from "./tutorial-step";
import { CodeBlock } from "./code-block";

const create = `create table notes (
  id bigserial primary key,
  title text
);

insert into notes(title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');
`.trim();

const rls = `alter table notes enable row level security;
create policy "Allow public read access" on notes
for select
using (true);`.trim();

const server = `import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

const client = `'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('notes').select()
      setNotes(data)
    }
    getData()
  }, [])

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

export function FetchDataSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Créer des tables et insérer des données">
        <p>
          Rendez-vous dans l&apos;{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Éditeur de Tables
          </a>{" "}
          de votre projet Supabase pour créer une table et insérer des données d&apos;exemple.
          Si vous manquez d&apos;inspiration, vous pouvez copier-coller le
          code suivant dans l&apos;{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Éditeur SQL
          </a>{" "}
          et cliquer sur EXÉCUTER !
        </p>
        <CodeBlock code={create} />
      </TutorialStep>

      <TutorialStep title="Activer la Sécurité au Niveau des Lignes (RLS)">
        <p>
          Supabase active la Sécurité au Niveau des Lignes (RLS) par défaut. Pour interroger les données
          de votre table <code>notes</code>, vous devez ajouter une politique. Vous pouvez
          le faire dans l&apos;{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Éditeur de Tables
          </a>{" "}
          ou via l&apos;{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Éditeur SQL
          </a>
          .
        </p>
        <p>
          Par exemple, vous pouvez exécuter le SQL suivant pour autoriser l&apos;accès en lecture
          public :
        </p>
        <CodeBlock code={rls} />
        <p>
          Vous pouvez en apprendre plus sur RLS dans la{" "}
          <a
            href="https://supabase.com/docs/guides/auth/row-level-security"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            documentation Supabase
          </a>
          .
        </p>
      </TutorialStep>

      <TutorialStep title="Interroger les données Supabase depuis Next.js">
        <p>
          Pour créer un client Supabase et interroger les données depuis un Composant Serveur
          Asynchrone, créez un nouveau fichier page.tsx à{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            /app/notes/page.tsx
          </span>{" "}
          et ajoutez le code suivant.
        </p>
        <CodeBlock code={server} />
        <p>Alternativement, vous pouvez utiliser un Composant Client.</p>
        <CodeBlock code={client} />
      </TutorialStep>

      <TutorialStep title="Explorez la Bibliothèque UI Supabase">
        <p>
          Rendez-vous sur la{" "}
          <a
            href="https://supabase.com/ui"
            className="font-bold hover:underline text-foreground/80"
          >
            bibliothèque UI Supabase
          </a>{" "}
          et essayez d&apos;installer quelques blocs. Par exemple, vous pouvez installer un
          bloc Chat en Temps Réel en exécutant :
        </p>
        <CodeBlock
          code={
            "npx shadcn@latest add https://supabase.com/ui/r/realtime-chat-nextjs.json"
          }
        />
      </TutorialStep>

      <TutorialStep title="Construisez en un week-end et passez à l'échelle de millions !">
        <p>Vous êtes prêt à lancer votre produit dans le monde ! 🚀</p>
      </TutorialStep>
    </ol>
  );
}
