#!/usr/bin/env python3
"""
Crop arrow symbols from flêches images using bounding boxes.
Outputs one folder per color: public/assets/fleches/{orange,bleue,verte,rose,jaune}/

Usage:
    python scripts/crop-fleches.py

Requires: pip install Pillow
"""

from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow required. Run: pip install Pillow")
    exit(1)

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ASSETS = PROJECT_ROOT / "public" / "assets"
# Find flêches dir (name may vary by filesystem encoding)
INPUT_DIR = ASSETS / "flêches"
if not INPUT_DIR.exists():
    candidates = [d for d in ASSETS.iterdir() if d.is_dir() and "fl" in d.name.lower() and "che" in d.name.lower()]
    INPUT_DIR = candidates[0] if candidates else INPUT_DIR
OUTPUT_BASE = ASSETS / "fleches"

COLORS = ["orange", "bleue", "verte", "rose", "jaune"]

# Annotation space = image size (2048×1536)
ANNOTATION_WIDTH = 2048
ANNOTATION_HEIGHT = 1536

ANNOTATIONS = [
    {"object": "curved_arrow_top_left", "bbox": {"x": 201, "y": 200, "width": 326, "height": 199}},
    {"object": "curved_arrow_top_center", "bbox": {"x": 805, "y": 191, "width": 690, "height": 201}},
    {"object": "arrow_up_top_right", "bbox": {"x": 1815, "y": 186, "width": 87, "height": 195}},
    {"object": "curved_arrow_middle_left", "bbox": {"x": 347, "y": 624, "width": 207, "height": 232}},
    {"object": "arrow_right_center", "bbox": {"x": 852, "y": 733, "width": 381, "height": 98}},
    {"object": "arrow_down_right", "bbox": {"x": 1617, "y": 549, "width": 113, "height": 283}},
    {"object": "loop_arrow_bottom_left", "bbox": {"x": 439, "y": 1227, "width": 407, "height": 149}},
    {"object": "zigzag_arrow_bottom_right", "bbox": {"x": 1335, "y": 1144, "width": 398, "height": 188}},
]


def main():
    for color in COLORS:
        img_path = INPUT_DIR / f"flêches - {color}.png"
        if not img_path.exists():
            print(f"Skip color '{color}': {img_path} not found")
            continue

        img = Image.open(img_path).convert("RGBA")
        scale_x = img.width / ANNOTATION_WIDTH
        scale_y = img.height / ANNOTATION_HEIGHT

        out_dir = OUTPUT_BASE / color
        out_dir.mkdir(parents=True, exist_ok=True)

        for ann in ANNOTATIONS:
            obj = ann["object"]
            bbox = ann["bbox"]
            x = int(bbox["x"] * scale_x)
            y = int(bbox["y"] * scale_y)
            w = int(bbox["width"] * scale_x)
            h = int(bbox["height"] * scale_y)

            x = max(0, min(x, img.width - 1))
            y = max(0, min(y, img.height - 1))
            w = min(w, img.width - x)
            h = min(h, img.height - y)

            if w <= 0 or h <= 0:
                print(f"Skip '{obj}' ({color}): invalid crop region")
                continue

            cropped = img.crop((x, y, x + w, y + h))
            cropped.save(out_dir / f"{obj}.png")

        print(f"Saved {len(ANNOTATIONS)} arrows → {out_dir}")

    print(f"\nDone. Output: {OUTPUT_BASE}")


if __name__ == "__main__":
    main()
