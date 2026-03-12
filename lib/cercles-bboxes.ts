/**
 * Bounding boxes for cercles (circle/oval shapes).
 * Pre-cropped images: public/assets/cercles-cropped/{color}/{object}.png
 *
 * Bbox format: XYWH in 2048×1536 annotation space.
 */

export const CERCLES = {
  image: {
    annotationSize: { width: 2048, height: 1536 },
    basePath: "/assets/cercles-cropped",
  },
  colors: ["orange", "bleu", "vert", "rose", "jaune"] as const,
  annotations: [
    { object: "oval_top_left", bbox: { x: 183, y: 218, width: 813, height: 191 } },
    { object: "circle_top_right", bbox: { x: 1181, y: 173, width: 547, height: 402 } },
    { object: "oval_middle_left", bbox: { x: 329, y: 740, width: 610, height: 315 } },
    { object: "oval_middle_right", bbox: { x: 1279, y: 702, width: 598, height: 183 } },
    { object: "oval_bottom_left", bbox: { x: 149, y: 1167, width: 523, height: 229 } },
    { object: "oval_bottom_center", bbox: { x: 880, y: 1143, width: 648, height: 205 } },
  ] as const,
} as const;

export type CercleObject = (typeof CERCLES.annotations)[number]["object"];
