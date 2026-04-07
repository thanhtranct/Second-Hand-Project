"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signInWithGoogle } from "../../services/authService";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Mail, Lock, User, Shield, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your display name");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.includes("email-already-in-use")) setError("An account with this email already exists");
      else if (msg.includes("weak-password")) setError("Password is too weak. Use at least 6 characters.");
      else if (msg.includes("invalid-email")) setError("Invalid email address");
      else if (msg.includes("operation-not-allowed") || msg.includes("OPERATION_NOT_ALLOWED")) setError("Email/Password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.");
      else { console.error("Signup error:", msg); setError("Signup failed. Please try again."); }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Page will redirect to Google
    } catch {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 128px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <div
        className="glass animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.5rem 2rem",
          borderRadius: "var(--radius-xl)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "var(--gradient-primary)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.4rem" }}>
            Create Account
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
            Join ReSell and start buying & selling with trust
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
              fontSize: "0.82rem",
              color: "var(--color-flagged)",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Google Sign Up */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: "100%",
            padding: "0.7rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)",
            fontSize: "0.88rem",
            fontWeight: 600,
            cursor: googleLoading ? "not-allowed" : "pointer",
            transition: "all var(--transition-base)",
            marginBottom: "1.5rem",
            opacity: googleLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.borderColor = "var(--color-border-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
        >
          {googleLoading ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Sign up with Google
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSignup}>
          <Input
            label="Display Name"
            placeholder="Your name"
            icon={<User size={16} />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 chars, uppercase, lowercase, number"
            icon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem" }}
            icon={loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : undefined}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{
              color: "var(--color-primary-light)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
