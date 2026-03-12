#!/usr/bin/env python3
"""
Crop the "manufacto" portion from the logo and save to public/assets/logo/manufacto.png.

Usage:
    python scripts/crop-logo.py

Source: public/assets/01. Identité visuelle/Logo/MANUFACTO - logo.png (or --source path)
Requires: pip install Pillow
"""

import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow required. Run: pip install Pillow")
    exit(1)

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DEFAULT_SOURCE = PROJECT_ROOT / "public" / "assets" / "01. Identité visuelle" / "Logo" / "MANUFACTO - logo.png"
OUTPUT_PATH = PROJECT_ROOT / "public" / "assets" / "logo" / "manufacto.png"

# Bbox for "manufacto" in source image (1736×520)
BBOX = {"x": 70, "y": 99, "width": 1508, "height": 212}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Path to logo source image")
    args = parser.parse_args()
    src = Path(args.source)

    if not src.exists():
        print(f"Source not found: {src}")
        print("Add the logo file or run with --source /path/to/logo.png")
        exit(1)

    img = Image.open(src).convert("RGBA")
    x, y, w, h = BBOX["x"], BBOX["y"], BBOX["width"], BBOX["height"]
    cropped = img.crop((x, y, x + w, y + h))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(OUTPUT_PATH)
    print(f"Saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
