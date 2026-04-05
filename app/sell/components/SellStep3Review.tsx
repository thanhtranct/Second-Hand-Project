"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface UploadedImageItem {
    id: string;
    preview: string;
}

interface SellFormFields {
    title: string;
    description: string;
    price: string;
    category: string;
    condition: string;
    location: string;
}

interface SellStep3ReviewProps {
    images: UploadedImageItem[];
    form: SellFormFields;
    overallTrust: number | null;
}

export default function SellStep3Review({ images, form, overallTrust }: SellStep3ReviewProps) {
    const summaryItems = [
        { label: "Title", value: form.title },
        { label: "Price", value: `$${form.price}` },
        { label: "Category", value: form.category },
        { label: "Condition", value: form.condition },
        { label: "Location", value: form.location || "Not specified" },
    ];

    return (
        <div className="animate-fade-in-up">
            <div
                className="glass"
                style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "1.5rem",
                }}
            >
                <h3
                    style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        marginBottom: "1.25rem",
                    }}
                >
                    Review Your Listing
                </h3>

                {/* Image thumbnails */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                    {images.map((img) => (
                        <img
                            key={img.id}
                            src={img.preview}
                            alt=""
                            style={{
                                width: "72px",
                                height: "54px",
                                objectFit: "cover",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                            }}
                        />
                    ))}
                </div>

                {summaryItems.map((item) => (
                    <div
                        key={item.label}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.6rem 0",
                            borderBottom: "1px solid var(--color-border)",
                            fontSize: "0.85rem",
                        }}
                    >
                        <span style={{ color: "var(--color-text-muted)" }}>{item.label}</span>
                        <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{item.value}</span>
                    </div>
                ))}

                {form.description && (
                    <div style={{ marginTop: "1rem" }}>
                        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                            Description
                        </p>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                            {form.description}
                        </p>
                    </div>
                )}

                {overallTrust !== null && (
                    <div
                        style={{
                            marginTop: "1.25rem",
                            padding: "0.75rem",
                            background: "var(--color-bg)",
                            borderRadius: "var(--radius-md)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.82rem",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                            }}
                        >
                            <ShieldCheck size={16} color="var(--color-primary)" />
                            Trust Score
                        </span>
                        <span
                            style={{
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                color:
                                    overallTrust >= 70
                                        ? "var(--color-verified)"
                                        : overallTrust >= 40
                                        ? "var(--color-suspicious)"
                                        : "var(--color-flagged)",
                            }}
                        >
                            {overallTrust}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
