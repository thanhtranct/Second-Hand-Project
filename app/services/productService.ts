"use client";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    orderBy,
    where,
    limit,
    startAfter,
    serverTimestamp,
    Timestamp,
    updateDoc,
    deleteDoc,
    DocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { Product } from "../data/products";

const PRODUCTS_COLLECTION = "products";

/**
 * Upload a single image to Firebase Storage.
 */
export async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, filename);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
    } catch (err) {
        throw new Error(`Failed to upload image "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
    }
}

/**
 * Upload multiple images and return their URLs.
 */
export async function uploadImages(files: File[]): Promise<string[]> {
    return Promise.all(files.map(uploadImage));
}

/**
 * Create a new product listing in Firestore.
 */
export async function createProduct(data: {
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    condition: string;
    location: string;
    trustScore: number;
    trustLevel: "verified" | "suspicious" | "flagged";
    seller: string;
    sellerId?: string;
    sellerEmail?: string;
}): Promise<string> {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...data,
        image: data.images[0] || "",
        sellerAvatar: "",
        sellerId: data.sellerId || "",
        sellerEmail: data.sellerEmail || "",
        status: "active",
        postedAt: "Just now",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Format a Firestore timestamp into a relative time string.
 */
function formatRelativeTime(timestamp: Timestamp | undefined): string {
    if (!timestamp) return "Just now";
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Map Firestore document to Product.
 */
function mapDocToProduct(d: DocumentSnapshot): Product {
    const data = d.data();
    if (!data) {
        throw new Error(`Product document ${d.id} has no data`);
    }
    return {
        id: d.id,
        title: data.title || "",
        description: data.description || "",
        price: data.price || 0,
        image: data.image || data.images?.[0] || "",
        images: data.images || [],
        seller: data.seller || "Anonymous",
        sellerId: data.sellerId || "",
        sellerEmail: data.sellerEmail || "",
        sellerAvatar: data.sellerAvatar || "",
        category: data.category || "",
        condition: data.condition || "Good",
        trustLevel: data.trustLevel || "suspicious",
        trustScore: data.trustScore ?? 50,
        location: data.location || "",
        postedAt: formatRelativeTime(data.createdAt),
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        status: data.status || "active",
    };
}

/**
 * Get all products, optionally filtered by category.
 */
export async function getProducts(category?: string): Promise<Product[]> {
    let q = query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"));
    if (category) {
        q = query(
            collection(db, PRODUCTS_COLLECTION),
            where("category", "==", category),
            orderBy("createdAt", "desc")
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToProduct).filter((p) => p.status === "active");
}

/**
 * Get products by seller ID.
 */
export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
    const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToProduct);
}

/**
 * Get paginated products.
 */
export async function getProductsPaginated(
    pageSize: number = 12,
    lastDoc?: DocumentSnapshot,
    category?: string,
): Promise<{ products: Product[]; lastVisible: DocumentSnapshot | null }> {
    let q;
    if (category) {
        q = lastDoc
            ? query(collection(db, PRODUCTS_COLLECTION), where("category", "==", category), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
            : query(collection(db, PRODUCTS_COLLECTION), where("category", "==", category), orderBy("createdAt", "desc"), limit(pageSize));
    } else {
        q = lastDoc
            ? query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
            : query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(mapDocToProduct).filter((p) => p.status === "active");
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { products, lastVisible };
}

/**
 * Get a single product by ID.
 */
export async function getProduct(id: string): Promise<Product | null> {
    const docSnap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
    if (!docSnap.exists()) return null;
    return mapDocToProduct(docSnap);
}

/**
 * Update a product.
 */
export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), data);
}

/**
 * Delete a product.
 */
export async function deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}

/**
 * Get all products (admin).
 */
export async function getAllProducts(): Promise<Product[]> {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToProduct);
}
