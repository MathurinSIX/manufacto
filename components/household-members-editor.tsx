"use client";

import { useState, useTransition } from "react";

import { updateHouseholdMembers } from "@/app/account/documents/actions";
import {
  addAccountPartner,
  removeAccountPartner,
} from "@/app/account/partner-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountPartnerSummary } from "@/lib/account-share";
import { normalizeNameList } from "@/lib/household";

type HouseholdMembersEditorProps = {
  userId: string;
  memberNames?: string[] | null;
  childNames?: string[] | null;
  /** Login that owns credits and reservations. */
  ownerEmail?: string | null;
  partner?: AccountPartnerSummary | null;
  /** Titulaire or admin can send the second-login invite. */
  canInvite?: boolean;
  /** When true, edits another user's profile (admin). */
  asAdmin?: boolean;
};

function editableList(names: string[] | null | undefined, minRows = 1): string[] {
  const normalized = normalizeNameList(names);
  if (normalized.length >= minRows) return normalized;
  return [...normalized, ...Array.from({ length: minRows - normalized.length }, () => "")];
}

export function HouseholdMembersEditor({
  userId,
  memberNames,
  childNames,
  ownerEmail,
  partner = null,
  canInvite = true,
  asAdmin = false,
}: HouseholdMembersEditorProps) {
  const [members, setMembers] = useState(() => editableList(memberNames, 2));
  const [children, setChildren] = useState(() => editableList(childNames, 0));
  const [partnerEmail, setPartnerEmail] = useState("");
  const [linkedPartner, setLinkedPartner] = useState(partner);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateHouseholdMembers(
        userId,
        normalizeNameList(members),
        normalizeNameList(children),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Foyer enregistré.");
      setMembers(editableList(normalizeNameList(members), 2));
      setChildren(editableList(normalizeNameList(children), 0));
    });
  };

  const invitePartner = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await addAccountPartner(
        partnerEmail,
        asAdmin ? userId : undefined,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setLinkedPartner({
        email: partnerEmail.trim().toLowerCase(),
        userId: null,
        status: result.status === "active" ? "active" : "pending",
      });
      setPartnerEmail("");
      setMessage(result.message);
    });
  };

  const removePartner = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await removeAccountPartner(asAdmin ? userId : undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLinkedPartner(null);
      setMessage("Deuxième personne retirée.");
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {asAdmin ? "Foyer / duo" : "Mon foyer"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Deux personnes peuvent se connecter sur ce compte. Lors d&apos;une
          réservation, vous choisissez qui participe.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Deuxième connexion</Label>
        {ownerEmail ? (
          <p className="text-xs text-muted-foreground">
            Titulaire : {ownerEmail}
          </p>
        ) : null}
        {linkedPartner ? (
          <div className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm">{linkedPartner.email}</p>
              <p className="text-xs text-muted-foreground">
                {linkedPartner.status === "active"
                  ? "Compte lié — cette personne se connecte sur ce foyer."
                  : "Invitation envoyée — en attente de création du compte."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={removePartner}
            >
              Retirer
            </Button>
          </div>
        ) : canInvite ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={partnerEmail}
              placeholder="E-mail de la 2e personne"
              onChange={(event) => setPartnerEmail(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending || partnerEmail.trim().length === 0}
              onClick={invitePartner}
            >
              Ajouter
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {ownerEmail
              ? `Cette personne se connecte sur le compte ${ownerEmail}.`
              : "Cette personne est déjà liée à un autre compte."}
          </p>
        )}
        {!linkedPartner && canInvite ? (
          <p className="text-xs text-muted-foreground">
            Si le compte existe, la connexion ouvre ce foyer. Sinon, un e-mail
            invite à créer le compte.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Adultes (2 max)</Label>
        {members.slice(0, 2).map((name, index) => (
          <Input
            key={`member-${index}`}
            value={name}
            placeholder={index === 0 ? "Prénom du titulaire" : "Prénom du 2e adulte"}
            onChange={(event) => {
              const next = [...members];
              next[index] = event.target.value;
              setMembers(next.slice(0, 2));
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Enfants</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setChildren((current) => [...current, ""])}
          >
            Ajouter un enfant
          </Button>
        </div>
        {children.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun enfant renseigné.</p>
        ) : (
          children.map((name, index) => (
            <div key={`child-${index}`} className="flex gap-2">
              <Input
                value={name}
                placeholder={`Prénom de l'enfant ${index + 1}`}
                onChange={(event) => {
                  const next = [...children];
                  next[index] = event.target.value;
                  setChildren(next);
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setChildren((current) => current.filter((_, i) => i !== index))
                }
              >
                Retirer
              </Button>
            </div>
          ))
        )}
      </div>

      <Button type="button" size="sm" disabled={isPending} onClick={save}>
        {isPending ? "Enregistrement…" : "Enregistrer le foyer"}
      </Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
