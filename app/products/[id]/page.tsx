"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "../../data/products";
import { getProduct, getProducts } from "../../services/productService";
import { createOrder } from "../../services/orderService";
import { useAuth } from "../../components/auth/AuthProvider";
import { addToWishlist, removeFromWishlist, isInWishlist } from "../../services/wishlistService";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { USD_TO_VND } from "../../config/constants";
import Card from "../../components/ui/Card";
import {
    ArrowLeft,
    MapPin,
    Clock,
    MessageSquare,
    Heart,
    Share2,
    ShieldCheck,
    Globe,
    Cpu,
    Paintbrush,
    Camera,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [related, setRelated] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [liked, setLiked] = useState(false);
    const [buying, setBuying] = useState(false);

    const handleBuyNow = async () => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
        setBuying(true);
        try {
            const orderId = await createOrder({
                productId: product!.id,
                productTitle: product!.title,
                productImage: product!.images[0] || "",
                price: product!.price,
                amountVND: Math.round(product!.price * USD_TO_VND),
                buyerId: user.uid,
                sellerId: product!.sellerId || "unknown",
                paymentMethod: "bank_transfer"
            });
            router.push(`/checkout/${orderId}`);
        } catch (error) {
            console.error("Failed to create order:", error);
            alert("Vui lòng khởi động lại đơn đăng ký/mua hàng.");
            setBuying(false);
        }
    };

    useEffect(() => {
        if (user && product) {
            isInWishlist(user.uid, product.id).then(setLiked);
        }
    }, [user, product]);

    useEffect(() => {
        if (!params.id) return;
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        getProduct(id).then((p) => {
            setProduct(p);
            setLoading(false);
            if (p) {
                getProducts().then((all) => {
                    setRelated(all.filter((item) => item.id !== p.id && item.category === p.category).slice(0, 3));
                });
            }
        });
    }, [params.id]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
                <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ textAlign: "center", padding: "6rem 1.5rem", color: "var(--color-text-muted)" }}>
                <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>Product not found</p>
                <Link href="/products" style={{ color: "var(--color-primary)", marginTop: "1rem", display: "inline-block" }}>
                    ← Back to listings
                </Link>
            </div>
        );
    }

    const verificationDetails = [
        {
            icon: Camera,
            label: "EXIF Metadata",
            status: product.trustScore > 70 ? "Camera data present" : "Metadata stripped",
            ok: product.trustScore > 70,
        },
        {
            icon: Globe,
            label: "Reverse Image Search",
            status: product.trustLevel === "verified" ? "No web matches" : "Similar images found online",
            ok: product.trustLevel === "verified",
        },
        {
            icon: Cpu,
            label: "AI Generation",
            status: product.trustScore > 50 ? "Not AI-generated" : "Possibly AI-generated",
            ok: product.trustScore > 50,
        },
        {
            icon: Paintbrush,
            label: "Edit Detection (ELA)",
            status: product.trustScore > 60 ? "No manipulation detected" : "Possible edits detected",
            ok: product.trustScore > 60,
        },
    ];

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>
            {/* Back button */}
            <Link
                href="/products"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--color-text-muted)",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    marginBottom: "1.5rem",
                    transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
            >
                <ArrowLeft size={16} /> Back to listings
            </Link>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2.5rem",
                }}
                className="product-detail-grid"
            >
                {/* Left — Images */}
                <div>
                    <div
                        style={{
                            position: "relative",
                            borderRadius: "var(--radius-xl)",
                            overflow: "hidden",
                            border: "1px solid var(--color-border)",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <img
                            src={product.images[selectedImage]}
                            alt={product.title}
                            style={{ width: "100%", height: "400px", objectFit: "cover", display: "block" }}
                        />
                        {product.images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setSelectedImage((p) => (p > 0 ? p - 1 : product.images.length - 1))}
                                    style={{
                                        position: "absolute",
                                        left: "0.75rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "rgba(0,0,0,0.5)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "36px",
                                        height: "36px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        color: "#fff",
                                    }}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setSelectedImage((p) => (p < product.images.length - 1 ? p + 1 : 0))}
                                    style={{
                                        position: "absolute",
                                        right: "0.75rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "rgba(0,0,0,0.5)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "36px",
                                        height: "36px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        color: "#fff",
                                    }}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {product.images.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    style={{
                                        width: "72px",
                                        height: "54px",
                                        borderRadius: "var(--radius-sm)",
                                        overflow: "hidden",
                                        border: `2px solid ${i === selectedImage ? "var(--color-primary)" : "var(--color-border)"}`,
                                        cursor: "pointer",
                                        opacity: i === selectedImage ? 1 : 0.6,
                                        transition: "all var(--transition-fast)",
                                    }}
                                >
                                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right — Info */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                        <Badge level={product.trustLevel} score={product.trustScore} />
                        <span
                            style={{
                                padding: "0.2rem 0.6rem",
                                background: "var(--color-bg-elevated)",
                                borderRadius: "var(--radius-full)",
                                fontSize: "0.75rem",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            {product.condition}
                        </span>
                    </div>

                    <h1
                        style={{
                            fontSize: "1.6rem",
                            fontWeight: 800,
                            color: "var(--color-text-primary)",
                            marginBottom: "0.5rem",
                        }}
                    >
                        {product.title}
                    </h1>

                    <div
                        style={{
                            fontSize: "2rem",
                            fontWeight: 800,
                            background: "var(--gradient-accent)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            marginBottom: "1.25rem",
                        }}
                    >
                        ${product.price.toLocaleString()}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "1.25rem",
                            marginBottom: "1.5rem",
                            fontSize: "0.82rem",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <MapPin size={14} /> {product.location}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Clock size={14} /> {product.postedAt}
                        </span>
                    </div>

                    <p
                        style={{
                            fontSize: "0.9rem",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.7,
                            marginBottom: "1.5rem",
                        }}
                    >
                        {product.description}
                    </p>

                    {/* Seller */}
                    <div
                        className="glass"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "1rem",
                            borderRadius: "var(--radius-lg)",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: "var(--gradient-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                            }}
                        >
                            {product.seller[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                            <Link
                                href={product.sellerId ? `/seller/${product.sellerId}` : "#"}
                                style={{ textDecoration: "none", color: "var(--color-text-primary)", fontWeight: 600, fontSize: "0.9rem" }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-primary-light)"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-primary)"}
                            >
                                {product.seller}
                            </Link>
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Seller • View shop →</p>
                        </div>
                        <Button variant="outline" size="sm" icon={<MessageSquare size={14} />} onClick={() => alert("Tính năng Chat đang được hoàn thiện, bạn vui lòng quay lại sau nhé!")}>
                            Message
                        </Button>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
                        <Button size="lg" style={{ flex: 1 }} onClick={handleBuyNow} disabled={buying}>
                            {buying ? "Processing..." : "Buy Now"}
                        </Button>
                        <Button
                            variant={liked ? "primary" : "secondary"}
                            onClick={async () => {
                                if (!user) { window.location.href = "/auth/login"; return; }
                                if (liked) {
                                    await removeFromWishlist(user.uid, product.id);
                                    setLiked(false);
                                } else {
                                    await addToWishlist(user.uid, product.id);
                                    setLiked(true);
                                }
                            }}
                            icon={<Heart size={18} fill={liked ? "#fff" : "none"} />}
                        >
                            {" "}
                        </Button>
                        <Button variant="secondary" icon={<Share2 size={18} />}>
                            {" "}
                        </Button>
                    </div>

                    {/* AI Verification Breakdown */}
                    <div
                        className="glass"
                        style={{
                            padding: "1.25rem",
                            borderRadius: "var(--radius-lg)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <ShieldCheck size={18} color="var(--color-primary)" />
                            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                                AI Verification Breakdown
                            </h3>
                        </div>

                        {/* Trust gauge */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.78rem",
                                    color: "var(--color-text-muted)",
                                    marginBottom: "0.4rem",
                                }}
                            >
                                <span>Trust Score</span>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color:
                                            product.trustScore >= 70
                                                ? "var(--color-verified)"
                                                : product.trustScore >= 40
                                                    ? "var(--color-suspicious)"
                                                    : "var(--color-flagged)",
                                    }}
                                >
                                    {product.trustScore}%
                                </span>
                            </div>
                            <div
                                style={{
                                    height: "6px",
                                    borderRadius: "var(--radius-full)",
                                    background: "var(--color-bg)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${product.trustScore}%`,
                                        borderRadius: "var(--radius-full)",
                                        background:
                                            product.trustScore >= 70
                                                ? "var(--color-verified)"
                                                : product.trustScore >= 40
                                                    ? "var(--color-suspicious)"
                                                    : "var(--color-flagged)",
                                        transition: "width 1s ease-out",
                                    }}
                                />
                            </div>
                        </div>

                        {verificationDetails.map((v, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    padding: "0.6rem 0",
                                    borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                                }}
                            >
                                <v.icon size={16} color={v.ok ? "var(--color-verified)" : "var(--color-suspicious)"} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                        {v.label}
                                    </p>
                                    <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{v.status}</p>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: v.ok ? "var(--color-verified)" : "var(--color-suspicious)",
                                    }}
                                >
                                    {v.ok ? "PASS" : "WARN"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Related products */}
            {related.length > 0 && (
                <section style={{ marginTop: "3rem" }}>
                    <h2
                        style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "1.25rem" }}
                    >
                        Related Items
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: "1.25rem",
                        }}
                    >
                        {related.map((p) => (
                            <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: "none" }}>
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
                        ))}
                    </div>
                </section>
            )}

            <style>{`
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
