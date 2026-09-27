/** PostHog experiments still running. Variants: `control` and `test`, 50/50.
 *
 * Shipped as the test version (no longer flagged): homepage body, hero subtext,
 * pratique tile, pratique libre, cours, and offrir.
 */
export const EXPERIMENTS = {
  /** Homepage hero: “Un atelier pour faire, apprendre ou offrir” vs “Faire soi-même, réparer, réemployer, créer.” */
  heroHeadline: "exp-hero-headline",
  /** L'atelier page: yesterday’s tarifs vs the credits / purchase layout. */
  atelier: "exp-atelier-retours",
  /** L'atelier hero: Marseille line vs the “quatre univers” paragraph. */
  atelierHero: "exp-atelier-hero",
  /** L'atelier tarifs: same cream layout. control hides checkout, test shows Acheter and Souscrire. */
  atelierTarifs: "exp-atelier-tarifs",
  /** Pratique libre offer cards: control without S'inscrire, test with a S'inscrire button. */
  pratiqueInscrire: "exp-pratique-inscrire",
  /** Course calendar on homepage and cours: month cells without photos vs day images. */
  calendarImages: "exp-calendar-images",
} as const;

export type ExperimentKey = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

export type ExperimentVariant = "control" | "test";

export const DISTINCT_ID_COOKIE = "mf_distinct_id";
/** Persists `?ph_exp=` across navigations until cleared with `?ph_exp=clear`. */
export const EXPERIMENT_OVERRIDE_COOKIE = "mf_ph_exp";
