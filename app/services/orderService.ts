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
    serverTimestamp,
    updateDoc,
    DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Order } from "../data/products";

const ORDERS_COLLECTION = "orders";

function mapDocToOrder(d: DocumentSnapshot): Order {
    const data = d.data();
    if (!data) {
        throw new Error(`Order document ${d.id} has no data`);
    }
    return {
        id: d.id,
        productId: data.productId || "",
        productTitle: data.productTitle || "",
        productImage: data.productImage || "",
        price: data.price || 0,
        buyerId: data.buyerId || "",
        sellerId: data.sellerId || "",
        status: data.status || "pending",
        paymentMethod: data.paymentMethod || "cod",
        orderCode: data.orderCode ?? undefined,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
    };
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "status">): Promise<string> {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getOrderById(id: string): Promise<Order | null> {
    const docSnap = await getDoc(doc(db, ORDERS_COLLECTION, id));
    if (!docSnap.exists()) return null;
    return mapDocToOrder(docSnap);
}

export async function getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    const q = query(
        collection(db, ORDERS_COLLECTION),
        where("buyerId", "==", buyerId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToOrder);
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
    const q = query(
        collection(db, ORDERS_COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToOrder);
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<void> {
    await updateDoc(doc(db, ORDERS_COLLECTION, id), {
        status,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Update order status and store the PayOS orderCode for webhook lookups.
 */
export async function updateOrderWithPayment(
    id: string,
    status: Order["status"],
    orderCode: number,
): Promise<void> {
    await updateDoc(doc(db, ORDERS_COLLECTION, id), {
        status,
        orderCode,
        updatedAt: serverTimestamp(),
    });
}
