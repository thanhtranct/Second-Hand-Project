"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "../../components/ui/Card";
import { Product } from "../../data/products";
import { getProductsBySeller } from "../../services/productService";
import { getUserProfile, UserProfile } from "../../services/authService";
import { Loader2, MapPin, ShieldCheck, Package, Star } from "lucide-react";

export default function SellerShopPage() {
    const params = useParams();
    const sellerId = Array.isArray(params.id) ? params.id[0] : params.id;
    const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerId) return;

        Promise.all([
            getUserProfile(sellerId),
            getProductsBySeller(sellerId),
        ]).then(([profile, prods]) => {
            setSellerProfile(profile);
            setProducts(prods);
            setLoading(false);
        });
    }, [sellerId]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
                <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
            </div>
        );
    }

    const avgTrust = products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + p.trustScore, 0) / products.length)
        : 0;

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            {/* Seller Header */}
            <div
                className="glass"
                style={{
                    padding: "2rem",
                    borderRadius: "var(--radius-xl)",
                    marginBottom: "2rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: sellerProfile?.photoURL ? "transparent" : "var(--gradient-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "3px solid var(--color-border)",
                    }}
                >
                    {sellerProfile?.photoURL ? (
                        <img src={sellerProfile.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: "2rem" }}>
                            {(sellerProfile?.displayName || "S")[0].toUpperCase()}
                        </span>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                        {sellerProfile?.displayName || "Seller"}
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                        Member since {sellerProfile?.createdAt ? new Date(sellerProfile.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                            <Package size={16} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{products.length}</span>
                            <span style={{ color: "var(--color-text-muted)" }}>listings</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                            <ShieldCheck size={16} color="var(--color-verified)" />
                            <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{avgTrust}%</span>
                            <span style={{ color: "var(--color-text-muted)" }}>avg trust</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                            <Star size={16} color="var(--color-suspicious)" />
                            <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                                {products.filter(p => p.trustLevel === "verified").length}
                            </span>
                            <span style={{ color: "var(--color-text-muted)" }}>verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Products */}
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "1.25rem" }}>
                All Listings ({products.length})
            </h2>

            {products.length > 0 ? (
                <div
                    className="stagger-children"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "1.25rem",
                    }}
                >
                    {products.map((p) => (
                        <div key={p.id} className="animate-fade-in-up" style={{ opacity: 0 }}>
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
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
                    <Package size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>No listings yet</p>
                    <p style={{ fontSize: "0.85rem" }}>This seller hasn&apos;t posted any items</p>
                </div>
            )}
        </div>
    );
}
