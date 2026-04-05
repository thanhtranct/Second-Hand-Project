"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Loader2, Lock } from "lucide-react";
import Button from "../ui/Button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "1rem",
        }}
      >
        <Loader2
          size={40}
          style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }}
        />
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "1.5rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(108,99,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={36} color="var(--color-primary)" />
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Login Required
        </h2>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted)", maxWidth: "400px" }}>
          Please sign in to access this page. Create an account or log in to continue.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
          <Button variant="outline" onClick={() => router.push("/auth/signup")}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "1.5rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(255,107,107,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={36} color="var(--color-flagged)" />
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Access Denied
        </h2>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted)", maxWidth: "400px" }}>
          You don&apos;t have permission to access this page. Contact an administrator.
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
