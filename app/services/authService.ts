"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user" | "seller" | "admin";
  createdAt: number;
}

/**
 * Sign up with email and password.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name
  await updateProfile(cred.user, { displayName });

  // Create user profile in Firestore
  await createUserProfile(cred.user);

  return cred;
}

/**
 * Sign in with email and password.
 */
export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google — tries popup first, falls back to redirect.
 */
export async function signInWithGoogle(): Promise<UserCredential | void> {
  try {
    // Try popup first (works with COOP: same-origin-allow-popups header)
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user);
    return result;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    console.warn("Google popup sign-in failed:", code, error);

    // If popup was blocked or COOP issue, fall back to redirect
    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      console.log("Falling back to redirect sign-in...");
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    throw error;
  }
}

/**
 * Handle redirect result after Google sign-in redirect.
 * Should be called once on app initialization.
 */
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      await createUserProfile(result.user);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
}

/**
 * Sign out.
 */
export async function signOutUser(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Create or update user profile in Firestore.
 */
async function createUserProfile(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      role: "user",
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Get user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
}

/**
 * Check if user has admin role via Firebase Custom Claims.
 */
export async function isAdmin(user: User): Promise<boolean> {
  const token = await user.getIdTokenResult();
  return token.claims.admin === true;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
