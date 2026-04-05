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
import { SellerApplication } from "../data/products";

const APPLICATIONS_COLLECTION = "sellerApplications";

function mapDocToApplication(d: DocumentSnapshot): SellerApplication {
    const data = d.data()!;
    return {
        id: d.id,
        userId: data.userId || "",
        email: data.email || "",
        fullName: data.fullName || "",
        phoneNumber: data.phoneNumber || "",
        storeName: data.storeName || "",
        description: data.description || "",
        status: data.status || "pending",
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        reviewedAt: data.reviewedAt?.toMillis?.(),
    };
}

export async function applyForSeller(data: Omit<SellerApplication, "id" | "status" | "createdAt" | "reviewedAt">): Promise<string> {
    const docRef = await addDoc(collection(db, APPLICATIONS_COLLECTION), {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getSellerApplications(): Promise<SellerApplication[]> {
    const q = query(collection(db, APPLICATIONS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToApplication);
}

export async function getSellerApplicationByUserId(userId: string): Promise<SellerApplication | null> {
    const q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return mapDocToApplication(snapshot.docs[0]);
}

export async function updateApplicationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<void> {
    await updateDoc(doc(db, APPLICATIONS_COLLECTION, id), {
        status,
        reviewedAt: serverTimestamp(),
    });
}
