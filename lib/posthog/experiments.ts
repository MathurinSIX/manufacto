/** PostHog experiment flag keys — create matching experiments in the PostHog UI.
 *
 * Variants (standard A/B naming):
 * - `control` = yesterday’s UI-v2 (last committed feat/ui-v2 before retours)
 * - `test` = today’s retours 2.0 changes
 */
export const EXPERIMENTS = {
  /** Homepage retours 2.0 (copy, électronique strip, privatisation, newsletter, calendar…). */
  homepage: "exp-homepage-retours",
  /** L'atelier: today’s quatre univers / copy vs yesterday’s trois univers UI-v2. */
  atelier: "exp-atelier-retours",
  /** Pratique libre retours vs yesterday’s pratique libre UI-v2. */
  pratiqueLibre: "exp-pratique-retours",
  /** Cours: monthly calendar + privatisation vs yesterday’s points calendar. */
  cours: "exp-cours-retours",
  /** Offrir: new gift copy/packs vs yesterday’s offrir page. */
  offrir: "exp-offrir-retours",
  /** Homepage hero: current headline vs “Faire soi-même, réparer, réemployer, créer.” */
  heroHeadline: "exp-hero-headline",
  /** Homepage hero subtext: short Marseille line vs the “Manufacto rassemble…” paragraph. */
  heroSubtext: "exp-hero-subtext",
  /** Pratique tile: “Je veux pratiquer” vs “Je veux faire” + autonome ou encadrée. */
  tilePratique: "exp-tile-pratique",
  /** L'atelier hero: previous Marseille line vs the “quatre univers” paragraph. */
  atelierHero: "exp-atelier-hero",
  /** Course calendar on homepage and cours: month cells without photos vs day images. */
  calendarImages: "exp-calendar-images",
} as const;

export type ExperimentKey = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

export type ExperimentVariant = "control" | "test";

export const DISTINCT_ID_COOKIE = "mf_distinct_id";
/** Persists `?ph_exp=` across navigations until cleared with `?ph_exp=clear`. */
export const EXPERIMENT_OVERRIDE_COOKIE = "mf_ph_exp";
