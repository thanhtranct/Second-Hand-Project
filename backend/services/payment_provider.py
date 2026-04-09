"""
SePay Payment Provider — replaces PayOS.

Responsibilities:
- Generate payment codes from order IDs
- Build QR URL and checkout info for the frontend
- Verify incoming SePay webhooks (API key + IP whitelist)
- Extract payment code from webhook payload
- Idempotency guard via Firestore `sepayTransactions` collection
- Order state transition: pending → paid, product active → sold
"""

import logging
import os
import re
import time
from typing import Optional

logger = logging.getLogger("resell-ai")

# SePay webhook sender IPs (for optional IP whitelist)
SEPAY_WEBHOOK_IPS: set[str] = {
    "172.236.138.20",
    "172.233.83.68",
    "171.244.35.2",
    "151.158.108.68",
    "151.158.109.79",
    "103.255.238.139",
}

_PAYMENT_CODE_REGEX = re.compile(r"DH(\d+)")


def _get_required_env(key: str) -> str:
    val = os.environ.get(key, "").strip()
    if not val:
        raise RuntimeError(f"Missing required env var: {key}")
    return val


# ---------------------------------------------------------------------------
# Payment code generation
# ---------------------------------------------------------------------------

def generate_payment_code(order_id: str) -> str:
    """Deterministic payment code from Firestore order ID.

    Format: DH + 6-digit zero-padded number derived from a hash.
    Must match the frontend implementation exactly.
    """
    h = 5381
    for ch in order_id:
        h = ((h << 5) + h) + ord(ch)
        h &= 0x7FFFFF  # 23-bit positive int
    code_num = (h % 999_999) + 1
    return f"DH{code_num:06d}"


# ---------------------------------------------------------------------------
# Checkout info builder
# ---------------------------------------------------------------------------

def build_checkout_info(order_id: str, amount_vnd: int) -> dict:
    """Return all info the frontend needs to display the bank transfer QR page."""
    bank_code = _get_required_env("SEPAY_BANK_CODE")
    account_number = _get_required_env("SEPAY_ACCOUNT_NUMBER")
    account_holder = _get_required_env("SEPAY_ACCOUNT_HOLDER")

    payment_code = generate_payment_code(order_id)

    qr_url = (
        f"https://qr.sepay.vn/img"
        f"?acc={account_number}"
        f"&bank={bank_code}"
        f"&amount={amount_vnd}"
        f"&des={payment_code}"
        f"&template=compact"
    )

    return {
        "paymentCode": payment_code,
        "qrUrl": qr_url,
        "bankName": bank_code,
        "bankCode": bank_code,
        "accountNumber": account_number,
        "accountHolder": account_holder,
        "amount": amount_vnd,
        "transferContent": payment_code,
    }


# ---------------------------------------------------------------------------
# Webhook verification
# ---------------------------------------------------------------------------

def verify_webhook_api_key(authorization_header: Optional[str]) -> bool:
    """Check the Apikey header sent by SePay."""
    expected = os.environ.get("SEPAY_WEBHOOK_API_KEY", "").strip()
    if not expected:
        logger.warning("SEPAY_WEBHOOK_API_KEY not configured — skipping API key check")
        return True  # allow in dev when key isn't set

    if not authorization_header:
        return False

    # SePay sends: "Apikey <key>"
    parts = authorization_header.split(" ", 1)
    if len(parts) != 2 or parts[0] != "Apikey":
        return False

    return parts[1].strip() == expected


def check_webhook_ip(client_ip: str) -> bool:
    """Optional IP whitelist check. Returns True if IP is allowed or check is disabled."""
    enforce = os.environ.get("SEPAY_ENFORCE_IP_WHITELIST", "false").lower() == "true"
    if not enforce:
        return True
    return client_ip in SEPAY_WEBHOOK_IPS


# ---------------------------------------------------------------------------
# Payload parsing
# ---------------------------------------------------------------------------

def extract_payment_code(payload: dict) -> Optional[str]:
    """Extract the payment code from the SePay webhook payload.

    Prefer the `code` field (auto-detected by SePay config).
    Fall back to regex on `content`.
    """
    code = payload.get("code")
    if code and isinstance(code, str) and _PAYMENT_CODE_REGEX.search(code):
        return code.strip()

    content = payload.get("content", "")
    m = _PAYMENT_CODE_REGEX.search(content)
    if m:
        return f"DH{m.group(1)}"

    return None


# ---------------------------------------------------------------------------
# Firestore helpers (require firebase_admin initialized)
# ---------------------------------------------------------------------------

def _get_firestore_client():
    from firebase_admin import firestore as fb_firestore
    return fb_firestore.client()


def is_duplicate_transaction(sepay_txn_id: int) -> bool:
    """Check if this SePay transaction has already been processed."""
    fs = _get_firestore_client()
    doc = fs.collection("sepayTransactions").document(str(sepay_txn_id)).get()
    return doc.exists


def process_webhook(payload: dict) -> dict:
    """Full webhook processing pipeline.

    Returns a result dict with keys: success, message, order_id (optional).
    """
    # 1. Guard: only incoming transfers
    if payload.get("transferType") != "in":
        return {"success": True, "message": "Ignored outgoing transfer"}

    sepay_txn_id = payload.get("id")
    if sepay_txn_id is None:
        return {"success": False, "message": "Missing transaction id"}

    # 2. Idempotency
    if is_duplicate_transaction(sepay_txn_id):
        logger.info(f"Duplicate webhook for sepayTransactionId={sepay_txn_id}, skipping")
        return {"success": True, "message": "Duplicate, already processed"}

    # 3. Extract payment code
    payment_code = extract_payment_code(payload)
    if not payment_code:
        logger.warning(f"Could not extract payment code from webhook id={sepay_txn_id}")
        return {"success": False, "message": "Payment code not found in transfer content"}

    # 4. Find matching order
    fs = _get_firestore_client()
    orders = list(
        fs.collection("orders")
        .where("paymentCode", "==", payment_code)
        .where("status", "==", "pending")
        .limit(1)
        .stream()
    )

    if not orders:
        logger.warning(f"No pending order found for paymentCode={payment_code}")
        return {"success": False, "message": f"No pending order for {payment_code}"}

    order_snap = orders[0]
    order_data = order_snap.to_dict()
    order_id = order_snap.id

    # 5. Verify amount
    transfer_amount = payload.get("transferAmount", 0)
    expected_amount = order_data.get("amountVND", 0)
    if expected_amount and transfer_amount != expected_amount:
        logger.warning(
            f"Amount mismatch for order {order_id}: "
            f"expected {expected_amount}, got {transfer_amount}"
        )
        return {"success": False, "message": "Amount mismatch"}

    # 6. State transition — order: pending → paid
    from google.cloud.firestore import SERVER_TIMESTAMP

    order_snap.reference.update({
        "status": "paid",
        "sepayTransactionId": sepay_txn_id,
        "bankReferenceCode": payload.get("referenceCode", ""),
        "paidAt": SERVER_TIMESTAMP,
        "updatedAt": SERVER_TIMESTAMP,
    })
    logger.info(f"Order {order_id} marked as paid (sepayTxn={sepay_txn_id})")

    # 7. State transition — product: active → sold
    product_id = order_data.get("productId")
    if product_id:
        product_ref = fs.collection("products").document(product_id)
        product_snap = product_ref.get()
        if product_snap.exists and product_snap.to_dict().get("status") == "active":
            product_ref.update({
                "status": "sold",
                "soldOrderId": order_id,
                "soldAt": SERVER_TIMESTAMP,
                "updatedAt": SERVER_TIMESTAMP,
            })
            logger.info(f"Product {product_id} marked as sold")

    # 8. Store SePay transaction record (idempotency + audit)
    fs.collection("sepayTransactions").document(str(sepay_txn_id)).set({
        "sepayTransactionId": sepay_txn_id,
        "gateway": payload.get("gateway", ""),
        "transactionDate": payload.get("transactionDate", ""),
        "accountNumber": payload.get("accountNumber", ""),
        "transferAmount": transfer_amount,
        "paymentCode": payment_code,
        "referenceCode": payload.get("referenceCode", ""),
        "orderId": order_id,
        "rawPayload": payload,
        "processedAt": SERVER_TIMESTAMP,
    })

    # 9. Side effects — notification (Pusher is Phase 5, skip for now)
    try:
        _create_payment_notification(fs, order_data, order_id)
    except Exception as exc:
        logger.error(f"Failed to create payment notification: {exc}")

    return {"success": True, "message": "Payment processed", "orderId": order_id}


def _create_payment_notification(fs, order_data: dict, order_id: str) -> None:
    """Create Firestore notification documents for buyer and seller."""
    now_ms = int(time.time() * 1000)
    product_title = order_data.get("productTitle", "sản phẩm")

    # Notify buyer
    buyer_id = order_data.get("buyerId")
    if buyer_id:
        fs.collection("notifications").add({
            "userId": buyer_id,
            "title": "Thanh toán thành công",
            "message": f"Đơn hàng {product_title} đã được thanh toán thành công.",
            "read": False,
            "type": "payment",
            "link": f"/profile",
            "createdAt": now_ms,
        })

    # Notify seller
    seller_id = order_data.get("sellerId")
    if seller_id:
        fs.collection("notifications").add({
            "userId": seller_id,
            "title": "Đơn hàng mới đã thanh toán",
            "message": f"Người mua đã thanh toán cho {product_title}.",
            "read": False,
            "type": "payment",
            "link": f"/profile",
            "createdAt": now_ms,
        })


# ---------------------------------------------------------------------------
# Escrow: Buyer confirm delivery
# ---------------------------------------------------------------------------

def confirm_delivery(order_id: str, user_id: str) -> dict:
    """Buyer confirms they received the goods.

    Transitions order shipped → delivered and notifies admin.
    """
    fs = _get_firestore_client()
    order_ref = fs.collection("orders").document(order_id)
    order_snap = order_ref.get()

    if not order_snap.exists:
        return {"success": False, "message": "Order not found"}

    order_data = order_snap.to_dict()

    if order_data.get("buyerId") != user_id:
        return {"success": False, "message": "Not authorized"}

    if order_data.get("status") != "shipped":
        return {"success": False, "message": f"Order status is '{order_data.get('status')}', expected 'shipped'"}

    from google.cloud.firestore import SERVER_TIMESTAMP

    order_ref.update({
        "status": "delivered",
        "payoutStatus": "pending_release",
        "deliveredAt": SERVER_TIMESTAMP,
        "updatedAt": SERVER_TIMESTAMP,
    })
    logger.info(f"Order {order_id} marked as delivered by buyer {user_id}")

    # Notify all admins
    _notify_admins_pending_release(fs, order_data, order_id)

    return {"success": True, "message": "Delivery confirmed, admin notified for payment release"}


def _notify_admins_pending_release(fs, order_data: dict, order_id: str) -> None:
    """Notify admin users that a payout is pending release."""
    now_ms = int(time.time() * 1000)
    product_title = order_data.get("productTitle", "sản phẩm")

    # Find admin users
    admins = list(
        fs.collection("users")
        .where("role", "==", "admin")
        .stream()
    )
    for admin_snap in admins:
        fs.collection("notifications").add({
            "userId": admin_snap.id,
            "title": "Chờ release payment",
            "message": f"Buyer đã xác nhận nhận hàng cho đơn {product_title}. Cần release payment cho seller.",
            "read": False,
            "type": "payment",
            "link": "/admin",
            "createdAt": now_ms,
        })


# ---------------------------------------------------------------------------
# Escrow: Admin release payment
# ---------------------------------------------------------------------------

def release_payment(order_id: str, admin_uid: str) -> dict:
    """Admin releases escrowed payment to seller.

    Returns payout info including QR URL for the admin to transfer manually.
    """
    fs = _get_firestore_client()
    order_ref = fs.collection("orders").document(order_id)
    order_snap = order_ref.get()

    if not order_snap.exists:
        return {"success": False, "message": "Order not found"}

    order_data = order_snap.to_dict()

    if order_data.get("status") != "delivered":
        return {"success": False, "message": f"Order status is '{order_data.get('status')}', expected 'delivered'"}

    if order_data.get("payoutStatus") != "pending_release":
        return {"success": False, "message": "Payout not pending"}

    # Get seller bank info
    seller_id = order_data.get("sellerId")
    seller_snap = fs.collection("users").document(seller_id).get()
    if not seller_snap.exists:
        return {"success": False, "message": "Seller not found"}

    seller_data = seller_snap.to_dict()
    seller_bank_code = seller_data.get("bankCode", "")
    seller_account = seller_data.get("bankAccountNumber", "")
    seller_holder = seller_data.get("bankAccountHolder", "")

    if not seller_bank_code or not seller_account:
        return {"success": False, "message": "Seller has not set bank account info"}

    amount = order_data.get("amountVND", 0)
    payout_ref_code = f"PAYOUT_{order_id[:8]}"

    # Generate QR for admin to transfer to seller
    payout_qr_url = (
        f"https://qr.sepay.vn/img"
        f"?acc={seller_account}"
        f"&bank={seller_bank_code}"
        f"&amount={amount}"
        f"&des={payout_ref_code}"
        f"&template=compact"
    )

    from google.cloud.firestore import SERVER_TIMESTAMP

    # Create payout record
    payout_doc = fs.collection("payouts").add({
        "orderId": order_id,
        "sellerId": seller_id,
        "amount": amount,
        "sellerBankCode": seller_bank_code,
        "sellerAccountNumber": seller_account,
        "sellerAccountHolder": seller_holder,
        "status": "completed",
        "releasedBy": admin_uid,
        "createdAt": SERVER_TIMESTAMP,
        "completedAt": SERVER_TIMESTAMP,
    })

    # Update order
    order_ref.update({
        "status": "completed",
        "payoutStatus": "released",
        "releasedAt": SERVER_TIMESTAMP,
        "releasedBy": admin_uid,
        "updatedAt": SERVER_TIMESTAMP,
    })
    logger.info(f"Order {order_id} completed — payment released by admin {admin_uid}")

    # Notify seller
    product_title = order_data.get("productTitle", "sản phẩm")
    now_ms = int(time.time() * 1000)
    fs.collection("notifications").add({
        "userId": seller_id,
        "title": "Đã nhận thanh toán",
        "message": f"Tiền từ đơn hàng {product_title} đã được chuyển vào tài khoản của bạn.",
        "read": False,
        "type": "payment",
        "link": "/profile",
        "createdAt": now_ms,
    })

    return {
        "success": True,
        "payout": {
            "orderId": order_id,
            "amount": amount,
            "sellerBank": seller_bank_code,
            "sellerAccount": seller_account,
            "sellerName": seller_holder,
            "qrUrl": payout_qr_url,
            "status": "completed",
        },
    }
