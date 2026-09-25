/** Household / duo account helpers (pragmatic MVP). */

export function normalizeNameList(names: string[] | null | undefined): string[] {
  return (names ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Adult members available for booking. Falls back to the account display name
 * when the profile has not been filled yet.
 */
export function resolveAdultMemberNames(
  memberNames: string[] | null | undefined,
  accountDisplayName: string | null | undefined,
): string[] {
  const fromProfile = normalizeNameList(memberNames);
  if (fromProfile.length > 0) {
    return fromProfile;
  }
  const fallback = accountDisplayName?.trim();
  return fallback ? [fallback] : [];
}

export function resolveChildNames(
  childNames: string[] | null | undefined,
): string[] {
  return normalizeNameList(childNames);
}

export function allHouseholdNames(options: {
  memberNames?: string[] | null;
  childNames?: string[] | null;
  accountDisplayName?: string | null;
}): string[] {
  return [
    ...resolveAdultMemberNames(options.memberNames, options.accountDisplayName),
    ...resolveChildNames(options.childNames),
  ];
}

/** Map selected household names onto participant_count + companion_first_names. */
export function selectionToParticipants(selectedNames: string[]): {
  participantCount: number;
  companionFirstNames: string[];
  primaryName: string | null;
} {
  const names = normalizeNameList(selectedNames);
  if (names.length === 0) {
    return { participantCount: 1, companionFirstNames: [], primaryName: null };
  }
  return {
    participantCount: names.length,
    companionFirstNames: names.slice(1),
    primaryName: names[0] ?? null,
  };
}
