"""
EXIF Metadata Analyzer
Extracts and analyzes image metadata to assess authenticity.
"""

import io
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from typing import Any


# Known AI/editing software signatures
AI_SOFTWARE_SIGNATURES = [
    "dall-e", "midjourney", "stable diffusion", "adobe firefly",
    "craiyon", "nightcafe", "artbreeder", "deepai",
    "photoshop", "gimp", "canva", "pixlr", "snapseed",
    "lightroom", "capture one",
]

SOCIAL_MEDIA_SIGNATURES = [
    "instagram", "facebook", "twitter", "tiktok", "snapchat",
    "whatsapp", "telegram", "messenger",
]


def extract_exif(image_bytes: bytes) -> dict[str, Any]:
    """Extract EXIF metadata from image bytes."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_data = img._getexif()

        if not exif_data:
            return {"has_exif": False, "raw": {}}

        parsed = {}
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, str(tag_id))
            if isinstance(value, bytes):
                try:
                    value = value.decode("utf-8", errors="ignore")
                except Exception:
                    value = str(value)
            parsed[tag_name] = value

        return {"has_exif": True, "raw": parsed}
    except Exception:
        return {"has_exif": False, "raw": {}}


def analyze_metadata(image_bytes: bytes) -> dict[str, Any]:
    """Analyze image metadata for authenticity signals."""
    exif = extract_exif(image_bytes)

    result = {
        "has_exif": exif["has_exif"],
        "camera": None,
        "software": None,
        "gps": False,
        "datetime": None,
        "ai_software_detected": False,
        "social_media_detected": False,
        "editing_software_detected": False,
        "score": 50,  # neutral starting score
        "details": [],
    }

    if not exif["has_exif"]:
        result["score"] = 20
        result["details"].append("No EXIF metadata found — may have been stripped or is a screenshot")
        return result

    raw = exif["raw"]

    # Camera info
    make = raw.get("Make", "")
    model = raw.get("Model", "")
    if make or model:
        result["camera"] = f"{make} {model}".strip()
        result["score"] += 15
        result["details"].append(f"Camera detected: {result['camera']}")

    # Software
    software = str(raw.get("Software", "")).lower()
    if software:
        result["software"] = raw.get("Software", "")

        # Check for AI tools
        for sig in AI_SOFTWARE_SIGNATURES[:8]:  # AI tools
            if sig in software:
                result["ai_software_detected"] = True
                result["score"] -= 25
                result["details"].append(f"AI/editing software detected: {result['software']}")
                break

        # Check for editing software
        for sig in AI_SOFTWARE_SIGNATURES[8:]:  # editing tools
            if sig in software:
                result["editing_software_detected"] = True
                result["score"] -= 10
                result["details"].append(f"Editing software detected: {result['software']}")
                break

    # GPS
    gps_info = raw.get("GPSInfo")
    if gps_info:
        result["gps"] = True
        result["score"] += 10
        result["details"].append("GPS location data present — indicates genuine photo")

    # DateTime
    dt = raw.get("DateTimeOriginal") or raw.get("DateTime")
    if dt:
        result["datetime"] = str(dt)
        result["score"] += 5
        result["details"].append(f"Original datetime: {result['datetime']}")

    # Clamp score
    result["score"] = max(0, min(100, result["score"]))

    return result
