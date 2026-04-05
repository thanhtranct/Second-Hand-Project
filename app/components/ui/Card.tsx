"use client";

import React from "react";
import Badge from "./Badge";

type TrustLevel = "verified" | "suspicious" | "flagged";

interface CardProps {
    image: string;
    title: string;
    price: number;
    seller: string;
    condition: string;
    trustLevel?: TrustLevel;
    trustScore?: number;
    onClick?: () => void;
}

export default function Card({
    image,
    title,
    price,
    seller,
    condition,
    trustLevel,
    trustScore,
    onClick,
}: CardProps) {
    return (
        <div
            onClick={onClick}
            style={{
                background: "var(--gradient-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                cursor: onClick ? "pointer" : "default",
                transition: "all var(--transition-base)",
                position: "relative",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.borderColor = "var(--color-border-hover)";
                e.currentTarget.style.boxShadow = "var(--shadow-glow)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Image */}
            <div
                style={{
                    width: "100%",
                    height: "200px",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <img
                    src={image}
                    alt={title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform var(--transition-slow)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                />
                {/* Condition tag */}
                <span
                    style={{
                        position: "absolute",
                        top: "0.75rem",
                        left: "0.75rem",
                        background: "rgba(15, 15, 26, 0.75)",
                        backdropFilter: "blur(8px)",
                        color: "var(--color-text-primary)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                    }}
                >
                    {condition}
                </span>
                {/* Trust badge */}
                {trustLevel && (
                    <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                        <Badge level={trustLevel} score={trustScore} showLabel={false} size="sm" />
                    </span>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: "1rem" }}>
                <h3
                    style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        marginBottom: "0.35rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {title}
                </h3>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span
                        style={{
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            background: "var(--gradient-accent)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        ${price.toLocaleString()}
                    </span>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        by {seller}
                    </span>
                </div>
            </div>
        </div>
    );
}
