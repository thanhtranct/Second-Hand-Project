"""
Error Level Analysis (ELA)
Detects image edits/manipulations by comparing JPEG compression artifacts.
"""

import io
import numpy as np
from PIL import Image
from typing import Any


def perform_ela(image_bytes: bytes, quality: int = 90) -> dict[str, Any]:
    """
    Perform Error Level Analysis on an image.
    
    Process:
    1. Re-save the image at a known JPEG quality
    2. Compare the re-saved version with the original
    3. High error levels in specific areas suggest manipulation
    
    Returns analysis result with edit detection score.
    """
    result = {
        "edited": False,
        "confidence": 0.0,
        "max_error": 0.0,
        "mean_error": 0.0,
        "std_error": 0.0,
        "suspicious_area_pct": 0.0,
        "score": 50,
        "details": [],
    }

    try:
        # Open original image
        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Resize for performance
        max_dim = 512
        if max(original.size) > max_dim:
            ratio = max_dim / max(original.size)
            new_size = (int(original.size[0] * ratio), int(original.size[1] * ratio))
            original = original.resize(new_size, Image.LANCZOS)

        # Re-save at known quality
        buffer = io.BytesIO()
        original.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer).convert("RGB")

        # Calculate error levels
        orig_array = np.array(original, dtype=np.float64)
        resaved_array = np.array(resaved, dtype=np.float64)

        # Absolute difference
        diff = np.abs(orig_array - resaved_array)

        # Scale for visibility (multiply by a factor)
        ela_image = (diff * 10).clip(0, 255).astype(np.uint8)

        # Statistics
        result["max_error"] = round(float(diff.max()), 2)
        result["mean_error"] = round(float(diff.mean()), 2)
        result["std_error"] = round(float(diff.std()), 2)

        # Calculate suspicious area percentage
        # Areas with significantly higher error than the mean
        threshold = result["mean_error"] + 2 * result["std_error"]
        pixel_errors = diff.mean(axis=2)  # average across RGB channels
        suspicious_pixels = (pixel_errors > threshold).sum()
        total_pixels = pixel_errors.size
        result["suspicious_area_pct"] = round(
            (suspicious_pixels / total_pixels) * 100, 2
        )

        # Decision logic
        # High std deviation and suspicious areas indicate editing
        if result["std_error"] > 15 and result["suspicious_area_pct"] > 5:
            result["edited"] = True
            result["confidence"] = min(95, result["suspicious_area_pct"] * 3 + 40)
            result["score"] = max(10, int(100 - result["confidence"]))
            result["details"].append(
                f"Suspicious editing detected — {result['suspicious_area_pct']}% of image has inconsistent compression"
            )
        elif result["std_error"] > 10 and result["suspicious_area_pct"] > 3:
            result["edited"] = True
            result["confidence"] = min(70, result["suspicious_area_pct"] * 2 + 20)
            result["score"] = max(25, int(100 - result["confidence"]))
            result["details"].append(
                f"Minor editing indicators — {result['suspicious_area_pct']}% suspicious area"
            )
        else:
            result["edited"] = False
            result["confidence"] = max(0, result["suspicious_area_pct"] * 2)
            result["score"] = min(95, int(85 + (10 - result["std_error"])))
            result["details"].append("No significant editing detected — compression levels are consistent")

        result["confidence"] = round(result["confidence"], 1)

    except Exception as e:
        result["details"].append(f"ELA analysis error: {str(e)}")
        result["score"] = 50

    return result
