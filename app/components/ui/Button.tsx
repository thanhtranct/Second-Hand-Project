"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
        background: "var(--gradient-primary)",
        color: "#fff",
        border: "none",
        boxShadow: "var(--shadow-glow)",
    },
    secondary: {
        background: "var(--color-bg-elevated)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border)",
    },
    outline: {
        background: "transparent",
        color: "var(--color-primary-light)",
        border: "1px solid var(--color-primary)",
    },
    ghost: {
        background: "transparent",
        color: "var(--color-text-secondary)",
        border: "1px solid transparent",
    },
    danger: {
        background: "linear-gradient(135deg, #FF6B6B, #EE5A5A)",
        color: "#fff",
        border: "none",
    },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" },
    md: { padding: "0.65rem 1.5rem", fontSize: "0.9rem", borderRadius: "var(--radius-md)" },
    lg: { padding: "0.85rem 2rem", fontSize: "1rem", borderRadius: "var(--radius-lg)" },
};

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    children,
    style,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                fontWeight: 600,
                cursor: disabled || loading ? "not-allowed" : "pointer",
                opacity: disabled || loading ? 0.6 : 1,
                transition: "all var(--transition-base)",
                letterSpacing: "0.01em",
                ...variantStyles[variant],
                ...sizeStyles[size],
                ...style,
            }}
            disabled={disabled || loading}
            onMouseEnter={(e) => {
                if (!disabled && !loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.filter = "brightness(1.1)";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.filter = "brightness(1)";
            }}
            {...props}
        >
            {loading ? (
                <span
                    style={{
                        width: "1em",
                        height: "1em",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                    }}
                />
            ) : icon ? (
                icon
            ) : null}
            {children}
        </button>
    );
}
