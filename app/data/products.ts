// Product interface — used across the app
export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    image: string;       // primary image URL (Firebase Storage)
    images: string[];     // all image URLs (Firebase Storage)
    seller: string;       // display name
    sellerId: string;     // Firebase Auth UID
    sellerEmail: string;
    sellerAvatar: string;
    category: string;
    condition: string;
    trustLevel: "verified" | "suspicious" | "flagged";
    trustScore: number;
    location: string;
    postedAt: string;
    createdAt?: number;   // timestamp for sorting
    status?: "active" | "sold" | "removed"; // listing status
    soldOrderId?: string;
}

export interface WishlistItem {
    productId: string;
    addedAt: number;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    role: "user" | "seller" | "admin";
    createdAt: number;

    // Seller bank info — required for payout
    bankCode?: string;           // e.g. "MBBank", "Vietcombank"
    bankAccountNumber?: string;  // account number
    bankAccountHolder?: string;  // account holder name
}

export interface ChatRoom {
    id: string;
    buyerId: string;
    sellerId: string;
    productId: string;
    productTitle: string;
    lastMessage: string;
    lastMessageAt: number;
    unreadCount: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    createdAt: number;
}

export interface Order {
    id: string;
    productId: string;
    productTitle: string;
    productImage: string;
    price: number;
    amountVND?: number;     // VND amount for SePay verification
    buyerId: string;
    sellerId: string;
    status: "pending" | "paid" | "shipped" | "delivered" | "completed" | "cancelled";
    paymentMethod: "bank_transfer" | "cod";

    // SePay payment fields
    paymentCode?: string;           // e.g. "DH849301"
    sepayTransactionId?: number;    // SePay transaction ID — set by webhook
    bankReferenceCode?: string;     // bank reference code — set by webhook

    // Escrow payout tracking
    payoutStatus?: "none" | "pending_release" | "released";
    deliveredAt?: number;       // timestamp buyer confirmed receipt
    releasedAt?: number;        // timestamp admin released payment
    releasedBy?: string;        // admin UID who released

    createdAt: number;
    updatedAt?: number;
    paidAt?: number;
}

export interface SellerApplication {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    storeName: string;
    description: string;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
    reviewedAt?: number;
}

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    type: "order" | "application" | "system" | "payment";
    link?: string;
    createdAt: number;
}
