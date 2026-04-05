"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const btnStyle = (active: boolean): React.CSSProperties => ({
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
        background: active ? "rgba(108,99,255,0.15)" : "transparent",
        color: active ? "var(--color-primary-light)" : "var(--color-text-muted)",
        fontSize: "0.85rem",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 150ms ease",
    });

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "2rem" }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    ...btnStyle(false),
                    opacity: currentPage === 1 ? 0.3 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
            >
                <ChevronLeft size={16} />
            </button>

            {getPages().map((page, i) =>
                page === "..." ? (
                    <span key={`dots-${i}`} style={{ padding: "0 0.4rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>...</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page as number)}
                        style={btnStyle(page === currentPage)}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    ...btnStyle(false),
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
