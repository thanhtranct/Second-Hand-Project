# ReSell — Secondhand Marketplace with AI Image Verification

Sàn thương mại điện tử đồ cũ tích hợp **AI xác minh ảnh sản phẩm** và **thanh toán escrow qua SePay**. Hệ thống phân tích ảnh 4 bước giúp phát hiện ảnh giả, ảnh từ internet, ảnh AI-generated — tăng độ tin cậy cho người mua.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | FastAPI 0.115, Python 3.12, Uvicorn |
| Database | Firebase Firestore, Firebase Storage |
| Auth | Firebase Authentication (Email + Google OAuth) |
| AI/ML | HuggingFace Transformers, PyTorch, OpenCV |
| Payment | SePay (VietQR bank transfer, escrow model) |

## Tính năng chính

- **AI Image Verification** — Mỗi ảnh sản phẩm được phân tích qua 4 bước:

  | Bước | Trọng số | Mô tả |
  |---|---|---|
  | EXIF Metadata | 20% | Kiểm tra dữ liệu camera, phần mềm chỉnh sửa |
  | Reverse Image Search | 30% | Tìm ảnh trùng trên internet (SerpAPI) |
  | AI Detection | 30% | Phát hiện ảnh do AI tạo (`Deep-Fake-Detector-v2-Model`, 92% accuracy) |
  | ELA (Error Level Analysis) | 20% | Phát hiện chỉnh sửa ảnh kỹ thuật số |

- **Trust Score** — Điểm tin cậy 0–100%: Verified (≥70), Suspicious (≥40), Flagged (<40)
- **Escrow Payment** — Tiền buyer vào TK platform, chỉ release cho seller sau khi buyer xác nhận nhận hàng + admin duyệt
- **Seller Verification** — Đăng ký seller → admin duyệt → được đăng bán
- **Admin Dashboard** — Quản lý sản phẩm, users, đơn hàng, doanh thu, duyệt seller

## Cài đặt

### Yêu cầu

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Firebase project** với Firestore + Storage + Authentication
- **ngrok** (optional — cho local SePay webhook)

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd secondhand-app

# Frontend
npm install

# Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r backend/requirements.txt
```

### 2. Cấu hình environment

**Frontend** — tạo `.env.local` ở root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Backend** — tạo `backend/.env`:

```env
# Firebase Admin
FIREBASE_ADMIN_CREDENTIALS=path/to/serviceAccount.json

# AI & Search
HF_TOKEN=hf_your_huggingface_token
SERPAPI_KEY=your_serpapi_key

# SePay Payment
SEPAY_BANK_CODE=MBBank
SEPAY_ACCOUNT_NUMBER=your_account_number
SEPAY_ACCOUNT_HOLDER=YOUR_NAME
SEPAY_WEBHOOK_API_KEY=your_sepay_webhook_key

# Optional
ALLOWED_ORIGINS=http://localhost:3000
SEPAY_ENFORCE_IP_WHITELIST=false
```

### 3. Chạy development

```powershell
# Cách nhanh (PowerShell) — start cả frontend + backend + ngrok
.\start-dev.ps1

# Hoặc chạy thủ công
npm run dev:frontend   # Terminal 1 — http://localhost:3000
npm run dev:backend    # Terminal 2 — http://localhost:8000
```

## Cấu trúc project

```
├── app/                     # Next.js App Router
│   ├── admin/               # Admin dashboard (products, users, orders, revenue)
│   ├── api/                 # API proxy routes → backend
│   ├── auth/                # Login, signup
│   ├── checkout/[id]/       # Checkout page (SePay QR inline)
│   ├── components/          # Shared UI components
│   ├── config/              # Firebase config, constants
│   ├── products/            # Product browse + detail
│   ├── profile/             # User profile, orders
│   ├── sell/                # Multi-step product listing
│   ├── services/            # Client-side Firestore services
│   └── payment/             # Payment success/cancel pages
├── backend/                 # FastAPI backend
│   ├── main.py              # API endpoints
│   └── services/            # AI analyzers, payment provider, decision engine
├── firestore.rules          # Firestore security rules
├── docs/                    # SePay contract, specs
└── start-dev.ps1            # Dev environment launcher
```

## Luồng thanh toán (Escrow)

```
Buyer → Checkout → QR chuyển khoản (TK platform)
  ↓
SePay webhook → Backend xác nhận → Order: pending → paid, Product: sold
  ↓
Seller gửi hàng → Order: paid → shipped
  ↓
Buyer xác nhận nhận hàng → Order: shipped → delivered
  ↓
Admin release payment → CK đến TK seller → Order: completed
```

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/analyze-image` | Phân tích ảnh (4-step pipeline) |
| POST | `/api/payment/create-checkout` | Tạo thông tin thanh toán + QR |
| POST | `/api/payment/sepay-webhook` | Nhận webhook từ SePay |
| GET | `/api/payment/status/{orderId}` | Polling trạng thái thanh toán |
| POST | `/api/orders/{orderId}/confirm-delivery` | Buyer xác nhận nhận hàng |
| POST | `/api/admin/orders/{orderId}/release-payment` | Admin release tiền cho seller |
