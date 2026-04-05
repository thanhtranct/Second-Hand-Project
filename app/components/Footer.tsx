"use client";

import React from "react";
import Link from "next/link";
import { Shield, Github, Twitter, Mail } from "lucide-react";

const footerLinks = {
    Marketplace: [
        { label: "Browse All", href: "/products" },
        { label: "Sell an Item", href: "/sell" },
        { label: "Categories", href: "/products" },
        { label: "Trending", href: "/products" },
    ],
    Company: [
        { label: "About Us", href: "#" },
        { label: "How It Works", href: "#" },
        { label: "Trust & Safety", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Support: [
        { label: "Help Center", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Report an Issue", href: "#" },
    ],
};

export default function Footer() {
    return (
        <footer
            style={{
                borderTop: "1px solid var(--color-border)",
                background: "var(--color-bg-secondary)",
                marginTop: "4rem",
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "3rem 1.5rem 1.5rem",
                }}
            >
                {/* Top section */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "2rem",
                        marginBottom: "2.5rem",
                    }}
                >
                    {/* Brand */}
                    <div>
                        <Link
                            href="/"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                textDecoration: "none",
                                marginBottom: "1rem",
                            }}
                        >
                            <div
                                style={{
                                    width: "28px",
                                    height: "28px",
                                    background: "var(--gradient-primary)",
                                    borderRadius: "var(--radius-sm)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Shield size={15} color="#fff" />
                            </div>
                            <span style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "1rem" }}>
                                Re<span style={{ color: "var(--color-primary)" }}>Sell</span>
                            </span>
                        </Link>
                        <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.6, maxWidth: "240px" }}>
                            Buy & sell secondhand goods with AI-powered image verification for trust and authenticity.
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                            {[Github, Twitter, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "var(--radius-sm)",
                                        background: "var(--color-bg)",
                                        border: "1px solid var(--color-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--color-text-muted)",
                                        transition: "all var(--transition-fast)",
                                        textDecoration: "none",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--color-primary)";
                                        e.currentTarget.style.color = "var(--color-primary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--color-border)";
                                        e.currentTarget.style.color = "var(--color-text-muted)";
                                    }}
                                >
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4
                                style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    color: "var(--color-text-primary)",
                                    marginBottom: "1rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {title}
                            </h4>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {links.map((link) => (
                                    <li key={link.label} style={{ marginBottom: "0.5rem" }}>
                                        <Link
                                            href={link.href}
                                            style={{
                                                color: "var(--color-text-muted)",
                                                textDecoration: "none",
                                                fontSize: "0.82rem",
                                                transition: "color var(--transition-fast)",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color = "var(--color-primary-light)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color = "var(--color-text-muted)")
                                            }
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        borderTop: "1px solid var(--color-border)",
                        paddingTop: "1.25rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                    }}
                >
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        © 2026 ReSell. All rights reserved.
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Shield size={12} color="var(--color-verified)" />
                        Protected by AI Image Verification
                    </p>
                </div>
            </div>
        </footer>
    );
}
