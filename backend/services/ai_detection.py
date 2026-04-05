"""
AI-Generated Image Detection
Uses the prithivMLmods/Deep-Fake-Detector-v2-Model (ViT architecture)
to classify images as Real or AI-Generated/Deepfake.

Accuracy: 92.12% on test set.

Two modes (priority: Local first for accuracy):
1. Local: Downloads model locally (~350MB, high accuracy, requires first-time download)
2. Online fallback: HuggingFace Inference API (fast, no GPU needed, requires HF_TOKEN)
"""

import io
import os
import logging
import requests
from PIL import Image
from typing import Any

logger = logging.getLogger("resell-ai")

# Model configuration
MODEL_NAME = "prithivMLmods/Deep-Fake-Detector-v2-Model"

# HuggingFace Inference API (fallback)
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_API_URL = f"https://api-inference.huggingface.co/models/{MODEL_NAME}"

# Lazy-load local model components
_model = None
_processor = None
_model_loaded = False
_model_load_failed = False


def _get_local_model():
    """Lazy-load the Deep-Fake-Detector-v2 model locally for maximum accuracy."""
    global _model, _processor, _model_loaded, _model_load_failed

    if _model_load_failed:
        return None, None

    if _model_loaded:
        return _model, _processor

    try:
        import torch
        from transformers import AutoImageProcessor, AutoModelForImageClassification

        logger.info(f"Loading AI model locally: {MODEL_NAME}...")
        logger.info("(First time may take a few minutes to download ~350MB)")

        _processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
        _model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
        _model.eval()  # Set to evaluation mode

        _model_loaded = True
        logger.info("✅ AI model loaded locally — ready for inference!")
        return _model, _processor

    except Exception as e:
        logger.warning(f"Could not load local AI model: {e}")
        _model_load_failed = True
        return None, None


def _detect_via_local(image_bytes: bytes) -> dict[str, Any] | None:
    """
    Classify image using local model (highest accuracy).
    Uses AutoImageProcessor + AutoModelForImageClassification.
    Returns None if model is not available.
    """
    try:
        import torch

        model, processor = _get_local_model()
        if model is None or processor is None:
            return None

        # Open and preprocess image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Process image for the model
        inputs = processor(images=img, return_tensors="pt")

        # Run inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)

        # Get model's label mapping
        id2label = model.config.id2label

        # Build predictions list (same format as HuggingFace API)
        predictions = []
        for idx, prob in enumerate(probs[0]):
            label = id2label.get(idx, f"LABEL_{idx}")
            predictions.append({
                "label": label,
                "score": float(prob),
            })

        # Sort by confidence (highest first)
        predictions.sort(key=lambda x: x["score"], reverse=True)

        logger.info(f"Local model predictions: {predictions}")
        return predictions

    except Exception as e:
        logger.warning(f"Local model inference error: {e}")
        return None


def _detect_via_api(image_bytes: bytes) -> list[dict] | None:
    """
    Classify image using HuggingFace Inference API (fallback).
    Returns None if API is not available.
    """
    if not HF_TOKEN:
        logger.info("HF_TOKEN not set — skipping HuggingFace Inference API")
        return None

    try:
        headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        response = requests.post(
            HF_API_URL,
            headers=headers,
            data=image_bytes,
            timeout=30,
        )

        if response.status_code == 503:
            # Model is loading on HF servers
            logger.warning("HuggingFace model is loading, retrying...")
            import time
            time.sleep(10)
            response = requests.post(
                HF_API_URL,
                headers=headers,
                data=image_bytes,
                timeout=60,
            )

        if response.status_code != 200:
            logger.warning(f"HuggingFace API returned {response.status_code}: {response.text[:200]}")
            return None

        predictions = response.json()
        logger.info(f"HuggingFace API predictions: {predictions}")
        return predictions

    except requests.Timeout:
        logger.warning("HuggingFace API timed out")
        return None
    except Exception as e:
        logger.warning(f"HuggingFace API error: {e}")
        return None


def _normalize_label(label: str) -> str:
    """
    Normalize label from the model to a standard format.
    Deep-Fake-Detector-v2 uses: 'Realism' (real) and 'Deepfake' (fake).
    Handle potential label inversion issues.
    """
    label_lower = label.lower().strip()

    # Real/authentic labels
    if label_lower in ("realism", "real", "human", "authentic", "original"):
        return "real"

    # Fake/AI-generated labels
    if label_lower in ("deepfake", "fake", "artificial", "ai", "synthetic", "ai-generated"):
        return "fake"

    return label_lower


def _parse_predictions(predictions: list[dict]) -> dict[str, Any]:
    """Parse model predictions into structured result."""
    result = {
        "is_ai": False,
        "confidence": 0.0,
        "label": "unknown",
        "score": 50,
        "details": [],
    }

    if not predictions:
        result["details"].append("No predictions returned from AI model")
        return result

    # Find the real and fake scores
    real_score = 0.0
    fake_score = 0.0

    for pred in predictions:
        normalized = _normalize_label(pred["label"])
        conf = pred["score"]

        if normalized == "real":
            real_score = conf
        elif normalized == "fake":
            fake_score = conf

    # If we found both labels
    if real_score > 0 or fake_score > 0:
        if fake_score > real_score:
            # Image classified as AI-generated/deepfake
            result["is_ai"] = True
            result["label"] = "AI-Generated"
            result["confidence"] = round(fake_score * 100, 1)
            result["score"] = max(5, int((1 - fake_score) * 100))
            result["details"].append(
                f"Image classified as AI-generated/deepfake with {result['confidence']}% confidence "
                f"(Model: Deep-Fake-Detector-v2, ViT architecture)"
            )
        else:
            # Image classified as real
            result["is_ai"] = False
            result["label"] = "Real"
            result["confidence"] = round(real_score * 100, 1)
            result["score"] = int(real_score * 100)
            result["details"].append(
                f"Image classified as real photograph with {result['confidence']}% confidence "
                f"(Model: Deep-Fake-Detector-v2, ViT architecture)"
            )
    else:
        # Fallback: use first prediction if labels didn't match expected format
        if predictions:
            top = predictions[0]
            result["details"].append(
                f"Model prediction: {top['label']} ({round(top['score'] * 100, 1)}%)"
            )
            result["score"] = int(top["score"] * 100)

    return result


def detect_ai_image(image_bytes: bytes) -> dict[str, Any]:
    """
    Classify an image as Real or AI-Generated/Deepfake.

    Strategy: Local model FIRST (higher accuracy: 92.12%).
    Falls back to HuggingFace Inference API if local model fails.
    """
    result = {
        "is_ai": False,
        "confidence": 0.0,
        "label": "unknown",
        "score": 50,
        "details": [],
    }

    try:
        # Priority 1: Local model (highest accuracy)
        logger.info("Trying local AI model (Deep-Fake-Detector-v2)...")
        predictions = _detect_via_local(image_bytes)

        # Priority 2: HuggingFace Inference API (fallback)
        if predictions is None:
            logger.info("Local model unavailable — trying HuggingFace Inference API...")
            predictions = _detect_via_api(image_bytes)

        if predictions is None:
            result["details"].append(
                "AI detection unavailable — neither local model "
                "nor HuggingFace API (set HF_TOKEN env var) could be used"
            )
            result["score"] = 50
            return result

        return _parse_predictions(predictions)

    except Exception as e:
        logger.error(f"AI detection failed: {e}")
        result["details"].append(f"AI detection error: {str(e)}")
        result["score"] = 50
        return result
