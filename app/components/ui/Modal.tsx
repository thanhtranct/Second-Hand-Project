"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "500px",
}: ModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={backdropRef}
            onClick={(e) => {
                if (e.target === backdropRef.current) onClose();
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
                animation: "fadeIn 0.2s ease-out",
                padding: "1rem",
            }}
        >
            <div
                style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                    maxWidth,
                    width: "100%",
                    maxHeight: "85vh",
                    overflow: "auto",
                    animation: "fadeInUp 0.3s ease-out",
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                {/* Header */}
                {title && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1.25rem 1.5rem",
                            borderBottom: "1px solid var(--color-border)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                color: "var(--color-text-primary)",
                            }}
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--color-text-muted)",
                                cursor: "pointer",
                                padding: "0.25rem",
                                borderRadius: "var(--radius-sm)",
                                display: "flex",
                                transition: "color var(--transition-fast)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "var(--color-text-primary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "var(--color-text-muted)";
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                {/* Body */}
                <div style={{ padding: "1.5rem" }}>{children}</div>
            </div>
        </div>
    );
}
