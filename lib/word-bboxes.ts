/**
 * Central registry of bounding boxes for cropped word images.
 * Reference a word by name to use its bbox when adding it somewhere.
 *
 * Usage:
 * - Liste de mots: import { LISTE_DE_MOTS } from "@/lib/word-bboxes"
 *   Then use LISTE_DE_MOTS.annotations["wordName"] for any word
 * - Logo: import { LOGO } from "@/lib/word-bboxes"
 *   Use LOGO.manufacto for the "manufacto" crop
 *
 * Bbox format - Axis-Aligned Bounding Boxes (AABB) / XYWH:
 * - x = left coordinate (from image left edge)
 * - y = top coordinate (from image top edge)
 * - width = box width
 * - height = box height
 * The box is always parallel to the image edges (not rotated).
 *
 * IMPORTANT - Scaling: Bboxes are in annotation space (2048×911), calculated on
 * a scaled-down image. The actual image files are larger (4305×1916). Components
 * must scale: actualX = bbox.x * (actualWidth / 2048), etc.
 */

/** Liste de mots - bboxes in 2048×911 space, actual files are 4305×1916 */
export const LISTE_DE_MOTS = {
  image: {
    /** Coordinate space of the bboxes (scaled-down image used for annotation) */
    annotationSize: { width: 2048, height: 911 },
    /** Actual image file dimensions - scale bbox coords by (actual/annotation) */
    actualSize: { width: 4305, height: 1916 },
    basePath: "/assets/liste-de-mots",
  },
  /** Color variant per word: which liste de mots image to use */
  colorVariants: {
    menuiserie: "orange",
    couture: "bleue",
    electronique: "verte",
    ceramique: "rose",
  } as const,
  annotations: {
    alternative: { x: 52, y: 34, width: 184, height: 31 },
    alternatives: { x: 44, y: 99, width: 192, height: 32 },
    apprendre: { x: 44, y: 162, width: 170, height: 50 },
    apprentissage: { x: 50, y: 226, width: 218, height: 51 },
    artisanat: { x: 50, y: 294, width: 149, height: 28 },
    atelier: { x: 55, y: 353, width: 101, height: 36 },
    ateliers: { x: 54, y: 420, width: 117, height: 33 },
    autonome: { x: 54, y: 484, width: 150, height: 33 },
    autonomie: { x: 52, y: 550, width: 164, height: 32 },
    avoir: { x: 50, y: 621, width: 93, height: 25 },
    bois: { x: 54, y: 674, width: 66, height: 37 },
    bricolage: { x: 51, y: 744, width: 176, height: 54 },
    bricoler: { x: 54, y: 809, width: 138, height: 34 },

    ceramique: { x: 319, y: 23, width: 204, height: 62 },
    collaboratif: { x: 315, y: 91, width: 192, height: 51 },
    collaborative: { x: 318, y: 158, width: 217, height: 35 },
    collectif: { x: 320, y: 219, width: 143, height: 51 },
    collective: { x: 322, y: 284, width: 171, height: 38 },
    "compétence": { x: 319, y: 346, width: 208, height: 60 },
    compétences: { x: 317, y: 411, width: 220, height: 59 },
    "compétences manuelles": { x: 312, y: 476, width: 422, height: 61 },
    concevoir: { x: 309, y: 558, width: 162, height: 23 },
    couture: { x: 322, y: 618, width: 133, height: 30 },
    créer: { x: 317, y: 670, width: 97, height: 36 },
    découvrir: { x: 316, y: 738, width: 159, height: 39 },
    dessiner: { x: 316, y: 798, width: 150, height: 36 },

    "économie circulaire": { x: 772, y: 31, width: 331, height: 37 },
    electronique: { x: 770, y: 93, width: 222, height: 59 },
    être: { x: 777, y: 154, width: 76, height: 42 },
    fabriquer: { x: 773, y: 224, width: 178, height: 58 },
    faire: { x: 783, y: 291, width: 93, height: 55 },
    "faire soi-même": { x: 779, y: 353, width: 298, height: 62 },
    formation: { x: 774, y: 416, width: 203, height: 58 },
    formations: { x: 778, y: 538, width: 160, height: 63 },
    inclusif: { x: 771, y: 601, width: 191, height: 45 },
    insertion: { x: 778, y: 673, width: 204, height: 38 },
    "low-tech": { x: 778, y: 673, width: 204, height: 38 },
    "manufacture de proximité": { x: 773, y: 735, width: 546, height: 60 },
    menuiserie: { x: 773, y: 798, width: 236, height: 43 },

    multidisciplinaire: { x: 1189, y: 32, width: 332, height: 48 },
    "nouvelle vie": { x: 1196, y: 94, width: 263, height: 40 },
    partagé: { x: 1195, y: 157, width: 160, height: 61 },
    partager: { x: 1198, y: 225, width: 183, height: 60 },
    pratique: { x: 1198, y: 293, width: 174, height: 52 },
    recyclage: { x: 1195, y: 353, width: 196, height: 59 },
    recycler: { x: 1200, y: 420, width: 157, height: 50 },
    réemploi: { x: 1209, y: 476, width: 177, height: 59 },
    réparer: { x: 1201, y: 545, width: 152, height: 56 },
    responsable: { x: 1196, y: 609, width: 222, height: 60 },
    réutiliser: { x: 1207, y: 681, width: 175, height: 31 },

    "savoir-faire": { x: 1582, y: 26, width: 226, height: 47 },
    "seconde-main": { x: 1582, y: 99, width: 272, height: 32 },
    sécurité: { x: 1581, y: 157, width: 155, height: 38 },
    "se perfectionner": { x: 1580, y: 226, width: 311, height: 49 },
    "se former": { x: 1579, y: 289, width: 226, height: 47 },
    solution: { x: 1584, y: 352, width: 177, height: 37 },
    solutions: { x: 1580, y: 418, width: 178, height: 39 },
    textile: { x: 1580, y: 482, width: 143, height: 34 },
    transformer: { x: 1576, y: 546, width: 253, height: 45 },
    upcycling: { x: 1574, y: 609, width: 213, height: 58 },
  } as const,
} as const;

export type ListeDeMotsWord = keyof typeof LISTE_DE_MOTS.annotations;

/** Logo - MANUFACTO - logo.png, 1736×520 */
export const LOGO = {
  image: {
    path: "/assets/01. Identité visuelle/Logo/MANUFACTO - logo.png",
    width: 1736,
    height: 520,
  },
  /** Bbox for "manufacto" (x adjusted to show more on left) */
  manufacto: { x: 70, y: 99, width: 1508, height: 212 } as const,
} as const;
