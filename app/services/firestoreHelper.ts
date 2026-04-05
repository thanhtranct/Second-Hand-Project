"use client";

import {
    collection,
    getDocs,
    query,
    DocumentSnapshot,
    QueryConstraint,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Generic helper to query a Firestore collection with filters and map results.
 *
 * @param collectionName - The Firestore collection name.
 * @param constraints    - Array of Firestore query constraints (where, orderBy, limit, etc.).
 * @param mapFn          - Function to map each DocumentSnapshot to type T.
 * @returns Promise resolving to an array of T.
 */
export async function queryCollection<T>(
    collectionName: string,
    constraints: QueryConstraint[],
    mapFn: (doc: DocumentSnapshot) => T,
): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapFn);
}
