"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthChange, getUserProfile, handleRedirectResult, UserProfile, isAdmin as checkAdmin } from "../../services/authService";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSeller: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isSeller: false,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSellerUser, setIsSellerUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Google sign-in
    handleRedirectResult();

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load user profile
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);

        // Check admin status
        const admin = await checkAdmin(firebaseUser);
        setIsAdminUser(admin || p?.role === "admin");

        // Check seller status
        setIsSellerUser(p?.role === "seller" || p?.role === "admin" || admin);
      } else {
        setProfile(null);
        setIsAdminUser(false);
        setIsSellerUser(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin: isAdminUser, isSeller: isSellerUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
