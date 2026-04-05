"use client";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    query,
    orderBy,
    where,
    serverTimestamp,
    updateDoc,
    writeBatch,
    DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { AppNotification } from "../data/products";

const NOTIFICATIONS_COLLECTION = "notifications";

function mapDocToNotification(d: DocumentSnapshot): AppNotification {
    const data = d.data()!;
    return {
        id: d.id,
        userId: data.userId || "",
        title: data.title || "",
        message: data.message || "",
        read: data.read || false,
        type: data.type || "system",
        link: data.link || undefined,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
    };
}

export async function createNotification(data: Omit<AppNotification, "id" | "read" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getNotificationsByUserId(userId: string): Promise<AppNotification[]> {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToNotification);
}

export async function markAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), {
        read: true,
    });
}

export async function markAllAsRead(userId: string): Promise<void> {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
        batch.update(d.ref, { read: true });
    });
    await batch.commit();
}
