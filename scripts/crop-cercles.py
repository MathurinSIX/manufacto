#!/usr/bin/env python3
"""
Crop circle/oval shapes from cercles images using bounding boxes.
Outputs one folder per color: public/assets/cercles-cropped/{orange,bleu,vert,rose,jaune}/

Usage:
    python scripts/crop-cercles.py

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
INPUT_DIR = ASSETS / "cercles"
OUTPUT_BASE = ASSETS / "cercles-cropped"

COLORS = ["orange", "bleu", "vert", "rose", "jaune"]

# Annotation space = image size (2048×1536)
ANNOTATION_WIDTH = 2048
ANNOTATION_HEIGHT = 1536

ANNOTATIONS = [
    {"object": "oval_top_left", "bbox": {"x": 183, "y": 218, "width": 813, "height": 191}},
    {"object": "circle_top_right", "bbox": {"x": 1181, "y": 173, "width": 547, "height": 402}},
    {"object": "oval_middle_left", "bbox": {"x": 329, "y": 740, "width": 610, "height": 315}},
    {"object": "oval_middle_right", "bbox": {"x": 1279, "y": 702, "width": 598, "height": 183}},
    {"object": "oval_bottom_left", "bbox": {"x": 149, "y": 1167, "width": 523, "height": 229}},
    {"object": "oval_bottom_center", "bbox": {"x": 880, "y": 1143, "width": 648, "height": 205}},
]


def main():
    for color in COLORS:
        img_path = INPUT_DIR / f"cercles - {color}.png"
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

        print(f"Saved {len(ANNOTATIONS)} shapes → {out_dir}")

    print(f"\nDone. Output: {OUTPUT_BASE}")


if __name__ == "__main__":
    main()
