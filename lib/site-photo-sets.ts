import type { CourseDiscipline } from "@/lib/course-disciplines";

/**
 * Decorative photos on the public site. Each path is listed in exactly one set,
 * so the same picture is not shown on two pages or twice on one page.
 *
 * Two files are the same shot and are never shown:
 * - /assets/photos-carousel/manufacto.jpg (same as the contact storefront)
 * - /assets/photos-carousel/electronique/electronique-04.jpg (same as portraits/03)
 */

export const HOME_HERO_PHOTOS = [
  "/assets/photos-new/site/05_Menuiserie.jpg",
  "/assets/photos-new/site/06_Menuiserie_01.jpg",
  "/assets/photos-new/portraits/07_HD_Manufacto_Portraits_15.jpg",
] as const;

export const HOME_CRAFT_PHOTOS: Record<
  "menuiserie" | "couture" | "ceramique" | "electronique",
  string
> = {
  menuiserie: "/assets/photos-carousel/menuiserie/menuiserie-01.jpg",
  couture: "/assets/photos-carousel/couture/couture-01.jpg",
  ceramique: "/assets/photos-carousel/ceramique/ceramique-01.jpg",
  electronique: "/assets/photos-carousel/electronique/electronique-01.jpg",
};

/** Same portrait as the homepage “Je veux offrir” tile. */
export const GIFT_BANNER_PHOTO = HOME_HERO_PHOTOS[2];

export const RIBBON_SITE = [
  "/assets/photos-new/site/07_WhatsApp_Image_2026-07-31_at_23.01.31.jpg",
  "/assets/photos-new/site/08_WhatsApp_Image_2026-07-31_at_23.01.32_1_.jpg",
  "/assets/photos-new/site/09_WhatsApp_Image_2026-07-31_at_23.01.32_2_.jpg",
  "/assets/photos-new/site/10_WhatsApp_Image_2026-07-31_at_23.01.32_3_.jpg",
  "/assets/photos-new/site/11_WhatsApp_Image_2026-07-31_at_23.01.32.jpg",
  "/assets/photos-new/site/13_WhatsApp_Image_2026-07-31_at_23.01.34_1_.jpg",
  "/assets/photos-new/site/14_WhatsApp_Image_2026-07-31_at_23.01.34.jpg",
  "/assets/photos-new/site/04_Elec.jpg",
] as const;

export const RIBBON_LIEU = [
  "/assets/photos-new/lieu/15_20260630_154331.jpg",
  "/assets/photos-new/lieu/03_20260610_132212.jpg",
  "/assets/photos-new/lieu/04_20260610_180851.jpg",
  "/assets/photos-new/lieu/07_20260610_190639.jpg",
  "/assets/photos-new/lieu/11_20260617_201842.jpg",
  "/assets/photos-new/lieu/05_20260610_180935.jpg",
  "/assets/photos-new/lieu/08_20260612_092206.jpg",
  "/assets/photos-new/lieu/09_20260617_194733.jpg",
  "/assets/photos-new/lieu/16_20260707_193505.jpg",
  "/assets/photos-new/lieu/14_20260630_154234.jpg",
] as const;

export const INSTAGRAM_SHOTS = [
  "/assets/photos-new/portraits/05_HD_Manufacto_Portraits_13.jpg",
  "/assets/photos-new/portraits/10_HD_Manufacto_Portraits_18.jpg",
  "/assets/photos-new/portraits/14_HD_Manufacto_Portraits_22.jpg",
  "/assets/photos-new/portraits/17_HD_Manufacto_Portraits_25.jpg",
  "/assets/photos-new/lieu/02_20260610_101444.jpg",
  "/assets/photos-new/site/12_WhatsApp_Image_2026-07-31_at_23.01.33.jpg",
  "/assets/photos-new/atelier/06_20260511_180406.jpg",
  "/assets/photos-new/site/16_Photo_en_haut_carre_.jpg",
] as const;

/** Same photo as the homepage “Je veux apprendre” tile. */
export const COURS_HERO_PHOTO = HOME_HERO_PHOTOS[1];

export const OFFER_HERO_PHOTO =
  "/assets/photos-new/site/15_Photo_en_bas_verticale_.jpg";

export const CONTACT_PHOTO = "/assets/photos-new/lieu/01_20260526_185531.jpg";

export const AUTH_ASIDE_PHOTO = "/assets/photos-new/lieu/13_20260630_153317.jpg";

export const ATELIER_HERO_PHOTO = "/assets/photos-new/lieu/06_20260610_181128.jpg";

export const ATELIER_SIDE_PHOTO = "/assets/photos-new/lieu/12_20260625_104132.jpg";

export const ATELIER_RIBBON = [
  "/assets/photos-new/atelier/01_20260507_115655.jpg",
  "/assets/photos-new/atelier/02_20260511_085926.jpg",
  "/assets/photos-new/atelier/03_20260511_174519.jpg",
  "/assets/photos-new/atelier/04_20260511_180016.jpg",
  "/assets/photos-new/atelier/05_20260511_180118.jpg",
  "/assets/photos-new/atelier/07_20260514_123312.jpg",
  "/assets/photos-new/atelier/08_20260517_113741.jpg",
  "/assets/photos-new/atelier/09_20260518_205407.jpg",
  "/assets/photos-new/atelier/10_20260519_121144.jpg",
  "/assets/photos-new/atelier/11_20260519_141225.jpg",
] as const;

/** One still photo per craft on the atelier concept grid. */
export const DISCIPLINE_CAROUSEL_PHOTOS: Partial<
  Record<CourseDiscipline, readonly string[]>
> = {
  menuiserie: ["/assets/photos-carousel/menuiserie/menuiserie-02.jpg"],
  couture: ["/assets/photos-carousel/couture/couture-02.jpg"],
  ceramique: ["/assets/photos-carousel/ceramique/ceramique-02.jpg"],
  electronique: ["/assets/photos-carousel/electronique/electronique-02.jpg"],
};

export const PRATIQUE_HERO_PHOTO = "/assets/photos-new/lieu/10_20260617_194806.jpg";

export const PRATIQUE_CRAFT_PHOTOS: Partial<
  Record<CourseDiscipline, readonly string[]>
> = {
  menuiserie: ["/assets/photos-carousel/menuiserie/menuiserie-06.jpg"],
  couture: ["/assets/photos-carousel/couture/couture-04.jpg"],
  ceramique: ["/assets/photos-carousel/ceramique/ceramique-05.jpg"],
};

export const PRATIQUE_RIBBON = [
  "/assets/photos-new/portraits/01_HD_Manufacto_Portraits_1.jpg",
  "/assets/photos-new/portraits/03_HD_Manufacto_Portraits_11.jpg",
  "/assets/photos-new/portraits/06_HD_Manufacto_Portraits_14.jpg",
  "/assets/photos-new/portraits/09_HD_Manufacto_Portraits_17.jpg",
  "/assets/photos-new/portraits/13_HD_Manufacto_Portraits_21.jpg",
] as const;

/** @deprecated alias kept for pages that still import the portrait ribbon */
export const RIBBON_PORTRAITS = PRATIQUE_RIBBON;
