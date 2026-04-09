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
from contextlib import asynccontextmanager

try:
    import magic  # type: ignore
except ImportError:
    magic = None
from dotenv import load_dotenv
from PIL import Image
load_dotenv()  # Load .env file for HF_TOKEN, SERPAPI_KEY, etc.
import firebase_admin
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as fb_auth
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from services.metadata_analyzer import analyze_metadata
from services.reverse_search import reverse_search
from services.ai_detection import detect_ai_image
from services.ela_analyzer import perform_ela
from services.decision_engine import make_decision
from services.payment_provider import (
    build_checkout_info,
    generate_payment_code,
    verify_webhook_api_key,
    check_webhook_ip,
    process_webhook,
    confirm_delivery,
    release_payment,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resell-ai")

if magic is None:
    logger.warning("python-magic is not installed; using Pillow fallback for MIME detection.")

limiter = Limiter(key_func=get_remote_address)
_firebase_initialized = False


def _init_firebase() -> None:
    """Initialize Firebase Admin SDK if credentials are configured."""
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        _firebase_initialized = True
        return

    cred_path = os.environ.get("FIREBASE_ADMIN_CREDENTIALS")
    if not cred_path:
        logger.warning(
            "FIREBASE_ADMIN_CREDENTIALS not set; protected endpoints run without token verification."
        )
        return

    if not os.path.exists(cred_path):
        logger.error(f"Firebase credentials file not found: {cred_path}")
        return

    try:
        cred = firebase_admin.credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin initialized successfully")
    except Exception as exc:
        logger.error(f"Failed to initialize Firebase Admin: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: run startup logic, then yield for shutdown."""
    logger.info("🚀 Starting ReSell AI Image Verification Service...")
    _init_firebase()

    hf_token = os.environ.get("HF_TOKEN", "")
    serpapi_key = os.environ.get("SERPAPI_KEY", "")

    if hf_token:
        logger.info(" HF_TOKEN configured — AI detection via HuggingFace API enabled")
    else:
        logger.warning(" HF_TOKEN not set — AI detection will try local model fallback")

    if serpapi_key:
        logger.info(" SERPAPI_KEY configured — Reverse image search enabled")
    else:
        logger.warning(" SERPAPI_KEY not set — Reverse image search disabled")

    # SePay payment config
    sepay_bank = os.environ.get("SEPAY_BANK_CODE", "")
    sepay_acc = os.environ.get("SEPAY_ACCOUNT_NUMBER", "")
    if sepay_bank and sepay_acc:
        logger.info(f" SePay configured — bank={sepay_bank} acc=***{sepay_acc[-4:]}")
    else:
        logger.warning(" SEPAY_BANK_CODE / SEPAY_ACCOUNT_NUMBER not set — payment endpoints will fail")

    if os.environ.get("SEPAY_WEBHOOK_API_KEY"):
        logger.info(" SEPAY_WEBHOOK_API_KEY configured")
    else:
        logger.warning(" SEPAY_WEBHOOK_API_KEY not set — webhook auth disabled")

    # Ngrok tunnel URL (injected by start-dev.ps1)
    ngrok_url = os.environ.get("NGROK_PUBLIC_URL", "")
    if ngrok_url:
        logger.info(f" Ngrok public URL: {ngrok_url}")
        logger.info(f" SePay webhook URL: {ngrok_url}/api/payment/sepay-webhook")
    else:
        logger.info(" NGROK_PUBLIC_URL not set — running without tunnel (production or manual config)")

    logger.info(" Service ready!")
    yield


app = FastAPI(
    title="ReSell AI Image Verification",
    description="Analyzes uploaded product images for authenticity using AI.",
    version="1.0.0",
    lifespan=lifespan,
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
# Auto-add ngrok URL to CORS when running locally
_ngrok_url = os.environ.get("NGROK_PUBLIC_URL", "").strip()
if _ngrok_url and _ngrok_url not in _allowed_origins:
    _allowed_origins.append(_ngrok_url)
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


def detect_mime_type(image_bytes: bytes) -> str:
    """Detect MIME type using libmagic when available, otherwise Pillow."""
    if magic is not None:
        return magic.from_buffer(image_bytes[:2048], mime=True)

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            fmt = (img.format or "").upper()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse image: {exc}")

    format_to_mime = {
        "JPEG": "image/jpeg",
        "PNG": "image/png",
        "WEBP": "image/webp",
    }
    return format_to_mime.get(fmt, "application/octet-stream")

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
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "ReSell AI Image Verification",
        "status": "running",
        "version": "2.0.0",
        "endpoints": {
            "analyze": "POST /api/analyze-image",
            "create_checkout": "POST /api/payment/create-checkout",
            "sepay_webhook": "POST /api/payment/sepay-webhook",
            "payment_status": "GET /api/payment/status/{orderId}",
            "confirm_delivery": "POST /api/orders/{orderId}/confirm-delivery",
            "release_payment": "POST /api/admin/orders/{orderId}/release-payment",
        },
    }


@app.post("/api/analyze-image")
@limiter.limit("20/minute")
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
    detected_mime = detect_mime_type(image_bytes)
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

@app.post("/api/payment/create-checkout")
@limiter.limit("10/minute")
async def create_checkout(
    request: Request,
    _user=Depends(verify_firebase_token),
):
    """Build checkout info (QR URL + bank details) for an order.

    Expects JSON: { "orderId": "...", "amount": 250000 }
    Returns: paymentCode, qrUrl, bank info, amount, transferContent.
    """
    data = await request.json()
    order_id = data.get("orderId")
    if not order_id or not isinstance(order_id, str):
        raise HTTPException(status_code=400, detail="orderId is required")

    amount = int(data.get("amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be a positive integer (VND)")

    try:
        info = build_checkout_info(order_id, amount)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Persist paymentCode + amountVND into the order doc if Firebase is ready
    if _firebase_initialized:
        try:
            from firebase_admin import firestore as fb_firestore
            from google.cloud.firestore import SERVER_TIMESTAMP

            fs = fb_firestore.client()
            order_ref = fs.collection("orders").document(order_id)
            order_ref.update({
                "paymentCode": info["paymentCode"],
                "amountVND": amount,
                "updatedAt": SERVER_TIMESTAMP,
            })
        except Exception as exc:
            logger.error(f"Failed to persist paymentCode to order {order_id}: {exc}")

    return JSONResponse(content=info)


@app.post("/api/payment/sepay-webhook")
async def sepay_webhook(request: Request):
    """Receive and process SePay webhook.

    Pipeline: verify API key → parse → idempotency → find order →
    verify amount → state transition → side effects → store record.
    """
    # 1. Verify API key
    auth_header = request.headers.get("Authorization")
    if not verify_webhook_api_key(auth_header):
        logger.warning("SePay webhook rejected: invalid API key")
        return JSONResponse(status_code=401, content={"success": False})

    # 2. Optional IP whitelist
    client_ip = request.client.host if request.client else ""
    if not check_webhook_ip(client_ip):
        logger.warning(f"SePay webhook rejected: IP {client_ip} not in whitelist")
        return JSONResponse(status_code=403, content={"success": False})

    # 3. Parse payload
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"success": False})

    logger.info(
        f"📥 SePay webhook received: id={payload.get('id')} "
        f"amount={payload.get('transferAmount')} code={payload.get('code')}"
    )

    # 4. Process (requires Firebase)
    if not _firebase_initialized:
        logger.error("Cannot process webhook: Firebase Admin not initialized")
        return JSONResponse(status_code=500, content={"success": False, "message": "Server not ready"})

    try:
        result = process_webhook(payload)
    except Exception as exc:
        logger.error(f"Webhook processing error: {exc}")
        return JSONResponse(content={"success": False, "message": "Internal error"})

    logger.info(f"Webhook result: {result}")
    return JSONResponse(content=result)


@app.get("/api/payment/status/{order_id}")
@limiter.limit("30/minute")
async def payment_status(
    order_id: str,
    request: Request,
    _user=Depends(verify_firebase_token),
):
    """Poll payment status for an order (used before Pusher realtime is wired)."""
    if not _firebase_initialized:
        raise HTTPException(status_code=503, detail="Firebase not configured")

    from firebase_admin import firestore as fb_firestore

    fs = fb_firestore.client()
    doc = fs.collection("orders").document(order_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Order not found")

    data = doc.to_dict()
    paid_at = data.get("paidAt")
    if hasattr(paid_at, "timestamp"):
        paid_at = int(paid_at.timestamp() * 1000)

    return {
        "orderId": order_id,
        "status": data.get("status", "pending"),
        "paidAt": paid_at,
        "payoutStatus": data.get("payoutStatus", "none"),
    }


@app.post("/api/orders/{order_id}/confirm-delivery")
@limiter.limit("10/minute")
async def api_confirm_delivery(
    order_id: str,
    request: Request,
    _user=Depends(verify_firebase_token),
):
    """Buyer confirms they received the goods → order shipped → delivered."""
    if not _firebase_initialized:
        raise HTTPException(status_code=503, detail="Firebase not configured")

    if _user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = _user.get("uid") if isinstance(_user, dict) else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = confirm_delivery(order_id, user_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed"))

    return result


@app.post("/api/admin/orders/{order_id}/release-payment")
@limiter.limit("10/minute")
async def api_release_payment(
    order_id: str,
    request: Request,
    _user=Depends(verify_firebase_token),
):
    """Admin releases escrowed payment to seller → order delivered → completed."""
    if not _firebase_initialized:
        raise HTTPException(status_code=503, detail="Firebase not configured")

    if _user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    admin_uid = _user.get("uid") if isinstance(_user, dict) else None
    if not admin_uid:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Verify admin role via Firestore
    from firebase_admin import firestore as fb_firestore

    fs = fb_firestore.client()
    admin_doc = fs.collection("users").document(admin_uid).get()
    if not admin_doc.exists or admin_doc.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    result = release_payment(order_id, admin_uid)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed"))

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
