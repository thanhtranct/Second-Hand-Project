"""
AI Image Forgery Detection Service
FastAPI backend for analyzing uploaded images for authenticity.

Features:
- EXIF metadata analysis
- Reverse image search (SerpAPI / Google Lens)
- AI-generated image detection (umm-maybe/AI-image-detector)
- Error Level Analysis (ELA) for edit detection
- Unified trust score decision engine
"""

import io
import logging
import os

import magic
from dotenv import load_dotenv
load_dotenv()  # Load .env file for HF_TOKEN, SERPAPI_KEY, etc.
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from payos import PayOS, ItemData, PaymentData

from services.metadata_analyzer import analyze_metadata
from services.reverse_search import reverse_search
from services.ai_detection import detect_ai_image
from services.ela_analyzer import perform_ela
from services.decision_engine import make_decision

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resell-ai")

# Init PayOS
import os
payos = PayOS(
    client_id="4f902b55-1513-4080-ac3f-bc40ff2433f5",
    api_key="3b6ab720-74fa-4d7f-9176-7a541e1f87ac",
    checksum_key="e351d30a0887cd9466fdcde0b545ab7ebc3bbad2a03869aac05dc04836ee7fa8"
)

app = FastAPI(
    title="ReSell AI Image Verification",
    description="Analyzes uploaded product images for authenticity using AI.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict to known origins
_allowed_origins = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed image MIME types (verified via magic bytes, not just Content-Type)
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# ---------------------------------------------------------------------------
# Security: Firebase token verification dependency
# ---------------------------------------------------------------------------
_http_bearer = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(_http_bearer),
):
    """
    Validate a Firebase ID token passed as a Bearer token.
    Returns the decoded token payload.
    Raises 401 if Firebase Admin is configured but the token is invalid.
    If Firebase Admin is not configured, this dependency is a no-op.
    """
    if not _firebase_initialized:
        # Firebase Admin not configured — skip verification
        return None
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authorization header with Bearer token is required",
        )
    try:
        decoded = fb_auth.verify_id_token(credentials.credentials)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    """Log service configuration status at startup."""
    logger.info("🚀 Starting ReSell AI Image Verification Service...")
    _init_firebase()

    hf_token = os.environ.get("HF_TOKEN", "")
    serpapi_key = os.environ.get("SERPAPI_KEY", "")

    if hf_token:
        logger.info(" HF_TOKEN configured — AI detection via HuggingFace API enabled")
    else:
        logger.warning("⚠️ HF_TOKEN not set — AI detection will try local model fallback")
    
    if serpapi_key:
        logger.info(" SERPAPI_KEY configured — Reverse image search enabled")
    else:
        logger.warning("⚠️ SERPAPI_KEY not set — Reverse image search disabled")
    
    logger.info("🟢 Service ready!")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "ReSell AI Image Verification",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /api/analyze-image",
            "payment": "POST /api/payment/create-link",
        },
    }


@app.post("/api/analyze-image")
@limiter.limit("5/minute")
async def analyze_image(
    request: Request,
    image: UploadFile = File(...),
    _user=Depends(verify_firebase_token),
):
    """
    Analyze an uploaded image for authenticity.

    Runs 4 analysis pipelines:
    1. EXIF Metadata Analysis
    2. Reverse Image Search (SerpAPI)
    3. AI-Generated Detection (HuggingFace)
    4. Error Level Analysis (ELA)

    Returns a unified trust score and classification.
    """
    # Read image bytes first (needed for magic-byte check)
    image_bytes = await image.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 10MB")

    # Validate file type using magic bytes (not just Content-Type header)
    detected_mime = magic.from_buffer(image_bytes[:2048], mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{detected_mime}'. Allowed: jpeg, png, webp",
        )

    try:
        logger.info(f"📸 Analyzing image: {image.filename} ({len(image_bytes)} bytes)")

        logger.info("  → EXIF metadata analysis...")
        metadata_result = analyze_metadata(image_bytes)

        logger.info("  → Reverse image search...")
        reverse_result = reverse_search(image_bytes)

        logger.info("  → AI detection...")
        ai_result = detect_ai_image(image_bytes)

        logger.info("  → ELA analysis...")
        ela_result = perform_ela(image_bytes)

        logger.info("  → Computing final decision...")
        decision = make_decision(
            metadata_result,
            reverse_result,
            ai_result,
            ela_result,
        )

        logger.info(f"✅ Analysis complete — Trust Score: {decision.get('trustScore', '?')}%")
        return JSONResponse(content=decision)

    except Exception as e:
        logger.error(f"❌ Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

@app.post("/api/payment/create-link")
@limiter.limit("10/minute")
async def create_payment_link(
    request: Request,
    _user=Depends(verify_firebase_token),
):
    """Create a PayOS payment link for an order."""
    data = await request.json()
    raw_order_code = data.get("orderCode")
    order_code = int(raw_order_code) if raw_order_code is not None else 0
    if order_code is None or order_code <= 0:
        raise HTTPException(status_code=400, detail="orderCode must be a positive integer")
    amount = int(data.get("amount", 2000))
    description = str(data.get("description", "Thanh toan don hang"))[:25]  # PayOS limit
    return_url = data.get("returnUrl", "http://localhost:3000/payment/success")
    cancel_url = data.get("cancelUrl", "http://localhost:3000/payment/cancel")

    item = ItemData(name=description, quantity=1, price=amount)
    payment_data = PaymentData(
        orderCode=order_code,
        amount=amount,
        description=description,
        items=[item],
        returnUrl=return_url,
        cancelUrl=cancel_url,
    )

    try:
        link = payos.createPaymentLink(payment_data)
        return {"checkoutUrl": link.checkoutUrl}
    except Exception as e:
        logger.error(f"PayOS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payment/webhook")
async def payos_webhook(request: Request):
    """Receive PayOS payment webhook and update the corresponding order in Firestore."""
    data = await request.json()
    try:
        payos.verifyPaymentWebhookData(data)
        order_code = data.get("data", {}).get("orderCode")
        logger.info(f"✅ Payment verified for orderCode {order_code}")

        # Update order status in Firestore if Firebase Admin is configured
        if _firebase_initialized and order_code is not None:
            try:
                from firebase_admin import firestore as fb_firestore

                fs = fb_firestore.client()
                matched = list(
                    fs.collection("orders")
                    .where("orderCode", "==", order_code)
                    .stream()
                )
                if len(matched) > 1:
                    logger.warning(
                        f"Multiple orders ({len(matched)}) matched orderCode {order_code} — "
                        "possible hash collision; updating all matched orders"
                    )
                for doc_snap in matched:
                    doc_snap.reference.update({"status": "confirmed"})
                logger.info(
                    f"Updated {len(matched)} order(s) to 'confirmed' for orderCode {order_code}"
                )
            except Exception as exc:
                logger.error(f"Failed to update order status in Firestore: {exc}")

        return JSONResponse(content={"error": 0, "message": "Ok", "data": None})
    except Exception as e:
        logger.error(f"Webhook verification failed: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={"error": -1, "message": "Failed", "data": None},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
