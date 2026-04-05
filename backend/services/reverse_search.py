"""
Reverse Image Search via SerpAPI
Searches Google Images to find if the uploaded image exists online.
"""

import os
import requests
import tempfile
from typing import Any


SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")
SERPAPI_URL = "https://serpapi.com/search.json"
SERPAPI_TIMEOUT_SECONDS = 30

# Score values
SCORE_MANY_MATCHES = 15   # 5+ matches found — very likely not original
SCORE_FEW_MATCHES = 35    # 2-4 matches found — possibly not original
SCORE_ONE_MATCH = 55      # 1 match — may be coincidental
SCORE_NO_MATCHES = 85     # no matches — likely original
SCORE_SERVICE_ERROR = 50  # service unavailable — uncertain

# Match-count thresholds
MATCH_THRESHOLD_MANY = 5
MATCH_THRESHOLD_FEW = 2


def reverse_search(image_bytes: bytes) -> dict[str, Any]:
    """
    Perform reverse image search using SerpAPI's Google Lens.
    Returns information about whether the image was found online.
    """
    result = {
        "found": False,
        "match_count": 0,
        "sources": [],
        "score": 70,  # neutral — no matches is good for secondhand
        "details": [],
    }

    if not SERPAPI_KEY:
        result["details"].append(
            "SerpAPI key not configured — reverse search skipped"
        )
        result["score"] = SCORE_SERVICE_ERROR
        return result

    try:
        # Save image to temp file for upload
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        # Use SerpAPI Google Lens endpoint
        params = {
            "engine": "google_lens",
            "api_key": SERPAPI_KEY,
        }

        with open(tmp_path, "rb") as f:
            response = requests.post(
                SERPAPI_URL,
                params=params,
                files={"image": f},
                timeout=SERPAPI_TIMEOUT_SECONDS,
            )

        # Clean up
        os.unlink(tmp_path)

        if response.status_code != 200:
            result["details"].append(f"SerpAPI returned status {response.status_code}")
            result["score"] = SCORE_SERVICE_ERROR
            return result

        data = response.json()

        # Parse visual matches
        visual_matches = data.get("visual_matches", [])

        if visual_matches:
            result["found"] = True
            result["match_count"] = len(visual_matches)
            result["sources"] = [
                {
                    "title": match.get("title", "Unknown"),
                    "link": match.get("link", ""),
                    "source": match.get("source", ""),
                }
                for match in visual_matches[:5]  # top 5 matches
            ]

            # More matches = more likely it's not an original photo
            if result["match_count"] >= MATCH_THRESHOLD_MANY:
                result["score"] = SCORE_MANY_MATCHES
                result["details"].append(
                    f"Found {result['match_count']} matches online — likely not an original photo"
                )
            elif result["match_count"] >= MATCH_THRESHOLD_FEW:
                result["score"] = SCORE_FEW_MATCHES
                result["details"].append(
                    f"Found {result['match_count']} similar images online"
                )
            else:
                result["score"] = SCORE_ONE_MATCH
                result["details"].append("Found 1 similar image online — may be coincidental")
        else:
            result["score"] = SCORE_NO_MATCHES
            result["details"].append("No matches found online — likely an original photo")

    except requests.Timeout:
        result["details"].append("Reverse search timed out")
        result["score"] = SCORE_SERVICE_ERROR
    except Exception as e:
        result["details"].append(f"Reverse search error: {str(e)}")
        result["score"] = SCORE_SERVICE_ERROR

    return result
