"use client";

import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Product } from "../data/products";
import { getProduct } from "./productService";

/**
 * Add a product to user's wishlist.
 */
export async function addToWishlist(userId: string, productId: string): Promise<void> {
    const ref = doc(db, "users", userId, "wishlist", productId);
    await setDoc(ref, {
        productId,
        addedAt: serverTimestamp(),
    });
}

/**
 * Remove a product from user's wishlist.
 */
export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
    const ref = doc(db, "users", userId, "wishlist", productId);
    await deleteDoc(ref);
}

/**
 * Get all product IDs in user's wishlist.
 */
export async function getWishlistIds(userId: string): Promise<string[]> {
    const snapshot = await getDocs(collection(db, "users", userId, "wishlist"));
    return snapshot.docs.map((d) => d.id);
}

/**
 * Get full product details for wishlist items.
 */
export async function getWishlistProducts(userId: string): Promise<Product[]> {
    const ids = await getWishlistIds(userId);
    if (ids.length === 0) return [];

    const products = await Promise.all(ids.map((id) => getProduct(id)));
    return products.filter((p): p is Product => p !== null);
}

/**
 * Check if a product is in user's wishlist.
 */
export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
    const ids = await getWishlistIds(userId);
    return ids.includes(productId);
}
