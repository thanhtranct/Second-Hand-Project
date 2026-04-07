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
import os
import logging
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))  # Load backend/.env
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from payos import PayOS
from payos.type import ItemData, PaymentData

from services.metadata_analyzer import analyze_metadata
from services.reverse_search import reverse_search
from services.ai_detection import detect_ai_image
from services.ela_analyzer import perform_ela
from services.decision_engine import make_decision

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resell-ai")

# Init PayOS
payos = PayOS(
    client_id=os.environ.get("PAYOS_CLIENT_ID", ""),
    api_key=os.environ.get("PAYOS_API_KEY", ""),
    checksum_key=os.environ.get("PAYOS_CHECKSUM_KEY", "")
)

app = FastAPI(
    title="ReSell AI Image Verification",
    description="Analyzes uploaded product images for authenticity using AI.",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


@app.on_event("startup")
async def startup_event():
    """Log service configuration status at startup."""
    import os
    logger.info("🚀 Starting ReSell AI Image Verification Service...")
    
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
    
    logger.info(" Service ready!")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "ReSell AI Image Verification",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /api/analyze-image",
        },
    }


@app.post("/api/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    """
    Analyze an uploaded image for authenticity.
    
    Runs 4 analysis pipelines:
    1. EXIF Metadata Analysis
    2. Reverse Image Search (SerpAPI)
    3. AI-Generated Detection (HuggingFace)
    4. Error Level Analysis (ELA)
    
    Returns a unified trust score and classification.
    """
    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image bytes
    image_bytes = await image.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 10MB")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        logger.info(f"📸 Analyzing image: {image.filename} ({len(image_bytes)} bytes)")

        # Run all analyses
        logger.info("  → EXIF metadata analysis...")
        metadata_result = analyze_metadata(image_bytes)

        logger.info("  → Reverse image search...")
        reverse_result = reverse_search(image_bytes)

        logger.info("  → AI detection...")
        ai_result = detect_ai_image(image_bytes)

        logger.info("  → ELA analysis...")
        ela_result = perform_ela(image_bytes)

        # Combine into final decision
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

@app.post("/api/payment/create-link")
async def create_payment_link(request: Request):
    """Create a PayOS payment link for an order."""
    data = await request.json()
    orderCode = int(data.get("orderCode", int(str(hash(data.get("orderId", "123")))[1:9])))
    amount = int(data.get("amount", 2000))
    description = data.get("description", "Thanh toan don hang")
    returnUrl = data.get("returnUrl", "http://localhost:3000/payment/success")
    cancelUrl = data.get("cancelUrl", "http://localhost:3000/payment/cancel")
    
    item = ItemData(name=description, quantity=1, price=amount)
    paymentData = PaymentData(
        orderCode=orderCode,
        amount=amount,
        description=description,
        items=[item],
        returnUrl=returnUrl,
        cancelUrl=cancelUrl
    )
    
    try:
        link = payos.createPaymentLink(paymentData)
        return {"checkoutUrl": link.checkoutUrl}
    except Exception as e:
        logger.error(f"PayOS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payment/webhook")
async def payos_webhook(request: Request):
    data = await request.json()
    try:
        # Validate webhook using checksum key
        payos.verifyPaymentWebhookData(data)
        logger.info(f"Payment success for orderCode {data['data']['orderCode']}")
        return JSONResponse(content={"error": 0, "message": "Ok", "data": None})
    except Exception as e:
        logger.error(f"Webhook failed to verify: {str(e)}")
        return JSONResponse(content={"error": -1, "message": "Failed", "data": None})
