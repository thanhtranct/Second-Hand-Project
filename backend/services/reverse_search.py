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
        result["score"] = 50  # uncertain
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
                timeout=30,
            )

        # Clean up
        os.unlink(tmp_path)

        if response.status_code != 200:
            result["details"].append(f"SerpAPI returned status {response.status_code}")
            result["score"] = 50
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
            if result["match_count"] >= 5:
                result["score"] = 15
                result["details"].append(
                    f"Found {result['match_count']} matches online — likely not an original photo"
                )
            elif result["match_count"] >= 2:
                result["score"] = 35
                result["details"].append(
                    f"Found {result['match_count']} similar images online"
                )
            else:
                result["score"] = 55
                result["details"].append("Found 1 similar image online — may be coincidental")
        else:
            result["score"] = 85
            result["details"].append("No matches found online — likely an original photo")

    except requests.Timeout:
        result["details"].append("Reverse search timed out")
        result["score"] = 50
    except Exception as e:
        result["details"].append(f"Reverse search error: {str(e)}")
        result["score"] = 50

    return result
