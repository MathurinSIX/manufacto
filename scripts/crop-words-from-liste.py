#!/usr/bin/env python3
"""
Create one image per word by cropping the liste de mots images using bounding boxes.
Outputs one folder per color: public/assets/words/{orange,bleue,verte,rose,noire,jaune}/

Usage:
    python scripts/crop-words-from-liste.py

Output:
    public/assets/words/orange/
    public/assets/words/bleue/
    public/assets/words/verte/
    public/assets/words/rose/
    public/assets/words/noire/
    public/assets/words/jaune/

Requires: pip install Pillow
"""

import re
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow required. Run: pip install Pillow")
    exit(1)

# Paths (relative to project root)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_DIR = PROJECT_ROOT / "public" / "assets" / "liste-de-mots"
OUTPUT_BASE = PROJECT_ROOT / "public" / "assets" / "words"

# All color variants to generate
COLORS = ["orange", "bleue", "verte", "rose", "noire", "jaune"]

# Annotation space (2048×911) -> actual image size (4305×1916)
ANNOTATION_WIDTH = 2048
ANNOTATION_HEIGHT = 911
ACTUAL_WIDTH = 4305
ACTUAL_HEIGHT = 1916
SCALE_X = ACTUAL_WIDTH / ANNOTATION_WIDTH
SCALE_Y = ACTUAL_HEIGHT / ANNOTATION_HEIGHT

# Annotations: bbox in 2048×911 space {x, y, width, height}
ANNOTATIONS = {
    "alternative": {"x": 52, "y": 34, "width": 184, "height": 31},
    "alternatives": {"x": 44, "y": 99, "width": 192, "height": 32},
    "apprendre": {"x": 44, "y": 162, "width": 170, "height": 50},
    "apprentissage": {"x": 50, "y": 226, "width": 218, "height": 51},
    "artisanat": {"x": 50, "y": 294, "width": 149, "height": 28},
    "atelier": {"x": 55, "y": 353, "width": 101, "height": 36},
    "ateliers": {"x": 54, "y": 420, "width": 117, "height": 33},
    "autonome": {"x": 54, "y": 484, "width": 150, "height": 33},
    "autonomie": {"x": 52, "y": 550, "width": 164, "height": 32},
    "avoir": {"x": 50, "y": 621, "width": 93, "height": 25},
    "bois": {"x": 54, "y": 674, "width": 66, "height": 37},
    "bricolage": {"x": 51, "y": 744, "width": 176, "height": 54},
    "bricoler": {"x": 54, "y": 809, "width": 138, "height": 34},
    "ceramique": {"x": 319, "y": 23, "width": 204, "height": 62},
    "collaboratif": {"x": 315, "y": 91, "width": 192, "height": 51},
    "collaborative": {"x": 318, "y": 158, "width": 217, "height": 35},
    "collectif": {"x": 320, "y": 219, "width": 143, "height": 51},
    "collective": {"x": 322, "y": 284, "width": 171, "height": 38},
    "compétence": {"x": 319, "y": 346, "width": 208, "height": 60},
    "compétences": {"x": 317, "y": 411, "width": 220, "height": 59},
    "compétences manuelles": {"x": 312, "y": 476, "width": 422, "height": 61},
    "concevoir": {"x": 309, "y": 558, "width": 162, "height": 23},
    "couture": {"x": 322, "y": 618, "width": 133, "height": 30},
    "créer": {"x": 317, "y": 670, "width": 97, "height": 36},
    "découvrir": {"x": 316, "y": 738, "width": 159, "height": 39},
    "dessiner": {"x": 316, "y": 798, "width": 150, "height": 36},
    "économie circulaire": {"x": 772, "y": 31, "width": 331, "height": 37},
    "electronique": {"x": 770, "y": 93, "width": 222, "height": 59},
    "être": {"x": 777, "y": 154, "width": 76, "height": 42},
    "fabriquer": {"x": 773, "y": 224, "width": 178, "height": 58},
    "faire": {"x": 783, "y": 291, "width": 93, "height": 55},
    "faire soi-même": {"x": 779, "y": 353, "width": 298, "height": 62},
    "formation": {"x": 774, "y": 416, "width": 203, "height": 58},
    "formations": {"x": 778, "y": 538, "width": 160, "height": 63},
    "inclusif": {"x": 771, "y": 601, "width": 191, "height": 45},
    "insertion": {"x": 778, "y": 673, "width": 204, "height": 38},
    "low-tech": {"x": 778, "y": 673, "width": 204, "height": 38},
    "manufacture de proximité": {"x": 773, "y": 735, "width": 546, "height": 60},
    "menuiserie": {"x": 773, "y": 798, "width": 236, "height": 43},
    "multidisciplinaire": {"x": 1189, "y": 32, "width": 332, "height": 48},
    "nouvelle vie": {"x": 1196, "y": 94, "width": 263, "height": 40},
    "partagé": {"x": 1195, "y": 157, "width": 160, "height": 61},
    "partager": {"x": 1198, "y": 225, "width": 183, "height": 60},
    "pratique": {"x": 1198, "y": 293, "width": 174, "height": 52},
    "recyclage": {"x": 1195, "y": 353, "width": 196, "height": 59},
    "recycler": {"x": 1200, "y": 420, "width": 157, "height": 50},
    "réemploi": {"x": 1209, "y": 476, "width": 177, "height": 59},
    "réparer": {"x": 1201, "y": 545, "width": 152, "height": 56},
    "responsable": {"x": 1196, "y": 609, "width": 222, "height": 60},
    "réutiliser": {"x": 1207, "y": 681, "width": 175, "height": 31},
    "savoir-faire": {"x": 1582, "y": 26, "width": 226, "height": 47},
    "seconde-main": {"x": 1582, "y": 99, "width": 272, "height": 32},
    "sécurité": {"x": 1581, "y": 157, "width": 155, "height": 38},
    "se perfectionner": {"x": 1580, "y": 226, "width": 311, "height": 49},
    "se former": {"x": 1579, "y": 289, "width": 226, "height": 47},
    "solution": {"x": 1584, "y": 352, "width": 177, "height": 37},
    "solutions": {"x": 1580, "y": 418, "width": 178, "height": 39},
    "textile": {"x": 1580, "y": 482, "width": 143, "height": 34},
    "transformer": {"x": 1576, "y": 546, "width": 253, "height": 45},
    "upcycling": {"x": 1574, "y": 609, "width": 213, "height": 58},
}


def safe_filename(word: str) -> str:
    """Convert word to safe filename (no spaces, no special chars)."""
    # Replace spaces and problematic chars
    safe = re.sub(r'[^\w\-]', '-', word.lower())
    return re.sub(r'-+', '-', safe).strip('-')


def scale_bbox(bbox: dict) -> tuple[int, int, int, int]:
    """Scale bbox from annotation space to actual image space. Returns (x, y, w, h)."""
    x = int(bbox["x"] * SCALE_X)
    y = int(bbox["y"] * SCALE_Y)
    w = int(bbox["width"] * SCALE_X)
    h = int(bbox["height"] * SCALE_Y)
    return x, y, w, h


def main():
    identite_dir = PROJECT_ROOT / "public" / "assets" / "01. Identité visuelle" / "Liste de mots"

    def get_image_path(color: str) -> Path:
        simple = INPUT_DIR / f"{color}.png"
        if simple.exists():
            return simple
        full = identite_dir / f"liste de mots - {color}.png"
        if full.exists():
            return full
        raise FileNotFoundError(f"Image not found for color: {color}")

    image_cache: dict[str, Image.Image] = {}

    for color in COLORS:
        try:
            img_path = get_image_path(color)
            image_cache[color] = Image.open(img_path).convert("RGBA")
        except FileNotFoundError as e:
            print(f"Skip color '{color}': {e}")
            continue

        out_dir = OUTPUT_BASE / color
        out_dir.mkdir(parents=True, exist_ok=True)

        for word, bbox in ANNOTATIONS.items():
            img = image_cache[color]
            x, y, w, h = scale_bbox(bbox)

            x = max(0, min(x, img.width - 1))
            y = max(0, min(y, img.height - 1))
            w = min(w, img.width - x)
            h = min(h, img.height - y)

            if w <= 0 or h <= 0:
                print(f"Skip '{word}' ({color}): invalid crop region")
                continue

            cropped = img.crop((x, y, x + w, y + h))
            out_name = safe_filename(word) + ".png"
            out_path = out_dir / out_name
            cropped.save(out_path)

        print(f"Saved {len(ANNOTATIONS)} words → {out_dir}")

    print(f"\nDone. Output: {OUTPUT_BASE}")


if __name__ == "__main__":
    main()
