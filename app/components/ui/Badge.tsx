"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

type TrustLevel = "verified" | "suspicious" | "flagged";

interface BadgeProps {
    level: TrustLevel;
    score?: number;
    showLabel?: boolean;
    size?: "sm" | "md";
}

const config: Record<TrustLevel, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
    verified: {
        color: "var(--color-verified)",
        bg: "rgba(0, 212, 170, 0.12)",
        label: "Verified",
        Icon: ShieldCheck,
    },
    suspicious: {
        color: "var(--color-suspicious)",
        bg: "rgba(255, 179, 71, 0.12)",
        label: "Suspicious",
        Icon: AlertTriangle,
    },
    flagged: {
        color: "var(--color-flagged)",
        bg: "rgba(255, 107, 107, 0.12)",
        label: "Flagged",
        Icon: ShieldX,
    },
};

export default function Badge({ level, score, showLabel = true, size = "md" }: BadgeProps) {
    const { color, bg, label, Icon } = config[level];
    const isSmall = size === "sm";

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: isSmall ? "0.25rem" : "0.4rem",
                padding: isSmall ? "0.2rem 0.5rem" : "0.3rem 0.75rem",
                background: bg,
                color: color,
                border: `1px solid ${color}30`,
                borderRadius: "var(--radius-full)",
                fontSize: isSmall ? "0.7rem" : "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
            }}
        >
            <Icon size={isSmall ? 12 : 14} />
            {showLabel && label}
            {score !== undefined && (
                <span style={{ opacity: 0.8 }}>{score}%</span>
            )}
        </span>
    );
}
