/**
 * Bounding boxes for flêches (arrow symbols).
 * Pre-cropped images: public/assets/fleches/{color}/{object}.png
 *
 * Bbox format: XYWH in 2048×1536 annotation space.
 */

export const FLECHES = {
  image: {
    annotationSize: { width: 2048, height: 1536 },
    basePath: "/assets/fleches",
  },
  colors: ["orange", "bleue", "verte", "rose", "jaune"] as const,
  annotations: [
    { object: "curved_arrow_top_left", bbox: { x: 201, y: 200, width: 326, height: 199 } },
    { object: "curved_arrow_top_center", bbox: { x: 805, y: 191, width: 690, height: 201 } },
    { object: "arrow_up_top_right", bbox: { x: 1815, y: 186, width: 87, height: 195 } },
    { object: "curved_arrow_middle_left", bbox: { x: 347, y: 624, width: 207, height: 232 } },
    { object: "arrow_right_center", bbox: { x: 852, y: 733, width: 381, height: 98 } },
    { object: "arrow_down_right", bbox: { x: 1617, y: 549, width: 113, height: 283 } },
    { object: "loop_arrow_bottom_left", bbox: { x: 439, y: 1227, width: 407, height: 149 } },
    { object: "zigzag_arrow_bottom_right", bbox: { x: 1335, y: 1144, width: 398, height: 188 } },
  ] as const,
} as const;

export type FlecheObject = (typeof FLECHES.annotations)[number]["object"];
