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
    buyerId: string;
    sellerId: string;
    status: "pending" | "paid" | "confirmed" | "shipped" | "completed" | "cancelled";
    paymentMethod: "momo" | "zalopay" | "cod" | "payos";
    orderCode?: number;  // PayOS integer order code — set when payment link is created
    createdAt: number;
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
