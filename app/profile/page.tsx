"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/AuthProvider";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { User, Mail, Camera, Save, Loader2, Shield, ShoppingBag, Heart, CheckCircle } from "lucide-react";

import { getSellerApplicationByUserId } from "../services/sellerService";
import { SellerApplication } from "../data/products";

function ProfileContent() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [sellerApp, setSellerApp] = useState<SellerApplication | null>(null);

    React.useEffect(() => {
        if (user) {
            getSellerApplicationByUserId(user.uid).then(app => setSellerApp(app)).catch(console.error);
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateProfile(user, { displayName });
            await updateDoc(doc(db, "users", user.uid), { displayName });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Failed to update profile:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                My Profile
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", marginBottom: "2rem" }}>
                Manage your account settings
            </p>

            {/* Avatar Section */}
            <div
                className="glass"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "1.5rem",
                }}
            >
                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: user?.photoURL ? "transparent" : "var(--gradient-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "3px solid var(--color-border)",
                    }}
                >
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: "2rem" }}>
                            {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                        </span>
                    )}
                </div>
                <div>
                    <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                        {user?.displayName || "User"}
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{user?.email}</p>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <span
                            style={{
                                padding: "0.15rem 0.5rem",
                                borderRadius: "var(--radius-full)",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                background: "rgba(108,99,255,0.15)",
                                color: "var(--color-primary-light)",
                            }}
                        >
                            {profile?.role || "user"}
                        </span>
                        
                        {profile?.role === "seller" ? (
                            <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: "#dcfce7", color: "#166534" }}>
                                Verified Seller
                            </span>
                        ) : sellerApp ? (
                            <span style={{ padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: sellerApp.status === "pending" ? "#fef9c3" : "#fee2e2", color: sellerApp.status === "pending" ? "#854d0e" : "#991b1b" }}>
                                Application: {sellerApp.status.toUpperCase()}
                            </span>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => router.push("/seller-apply")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem" }}>
                                Apply as Seller
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <div
                className="glass"
                style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "1.5rem",
                }}
            >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "1.25rem" }}>
                    Account Information
                </h3>
                <Input
                    label="Display Name"
                    placeholder="Your name"
                    icon={<User size={16} />}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
                <Input
                    label="Email"
                    type="email"
                    icon={<Mail size={16} />}
                    value={user?.email || ""}
                    disabled
                    onChange={() => {}}
                />

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <Button
                        onClick={handleSave}
                        disabled={saving || displayName === user?.displayName}
                        icon={
                            saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> :
                            saved ? <CheckCircle size={16} /> :
                            <Save size={16} />
                        }
                    >
                        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Quick Links */}
            <div
                className="glass"
                style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                }}
            >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "1rem" }}>
                    Quick Links
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {[
                        { href: "/dashboard", icon: ShoppingBag, label: "My Listings", color: "var(--color-primary)" },
                        { href: "/wishlist", icon: Heart, label: "Wishlist", color: "var(--color-flagged)" },
                        { href: `/seller/${user?.uid}`, icon: Camera, label: "My Shop", color: "var(--color-accent)" },
                        { href: "/sell", icon: Shield, label: "Sell Item", color: "var(--color-suspicious)" },
                    ].map((item) => (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                padding: "0.85rem 1rem",
                                background: "var(--color-bg-secondary)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                transition: "all var(--transition-fast)",
                                textAlign: "left",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = item.color + "50";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-border)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <item.icon size={18} color={item.color} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}
