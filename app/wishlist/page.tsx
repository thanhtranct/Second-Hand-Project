"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../components/auth/AuthProvider";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Product } from "../data/products";
import { getWishlistProducts, removeFromWishlist } from "../services/wishlistService";
import { Heart, Search, Loader2, Trash2 } from "lucide-react";

function WishlistContent() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getWishlistProducts(user.uid).then((data) => {
            setProducts(data);
            setLoading(false);
        });
    }, [user]);

    const handleRemove = async (productId: string) => {
        if (!user) return;
        await removeFromWishlist(user.uid, productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                    My Wishlist
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    {products.length} saved items
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                    <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)", marginBottom: "1rem" }} />
                    <p style={{ color: "var(--color-text-muted)" }}>Loading wishlist...</p>
                </div>
            ) : products.length > 0 ? (
                <div
                    className="stagger-children"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "1.25rem",
                    }}
                >
                    {products.map((p) => (
                        <div key={p.id} className="animate-fade-in-up" style={{ opacity: 0, position: "relative" }}>
                            <Link href={`/products/${p.id}`} style={{ textDecoration: "none" }}>
                                <Card
                                    image={p.image}
                                    title={p.title}
                                    price={p.price}
                                    seller={p.seller}
                                    condition={p.condition}
                                    trustLevel={p.trustLevel}
                                    trustScore={p.trustScore}
                                />
                            </Link>
                            <button
                                onClick={() => handleRemove(p.id)}
                                style={{
                                    position: "absolute",
                                    top: "0.75rem",
                                    right: "0.75rem",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "rgba(255,107,107,0.9)",
                                    border: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "#fff",
                                    zIndex: 10,
                                    transition: "transform var(--transition-fast)",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                title="Remove from wishlist"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
                    <Heart size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Your wishlist is empty</p>
                    <p style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>Browse items and tap the heart icon to save them here</p>
                    <Link href="/products" style={{ textDecoration: "none" }}>
                        <Button icon={<Search size={16} />}>Browse Items</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function WishlistPage() {
    return (
        <ProtectedRoute>
            <WishlistContent />
        </ProtectedRoute>
    );
}
