"use client";

import React from "react";
import { ShieldX, AlertTriangle, Trash2 } from "lucide-react";
import ImageUploader from "../../components/ui/ImageUploader";

interface UploadedImageItem {
    id: string;
    file?: File;
    preview: string;
    status: string;
    analysis?: { trustScore: number; classification: string };
}

const TRUST_BLOCK_THRESHOLD = 40; // Below this, seller cannot proceed

interface SellStep1PhotosProps {
    onImagesChange: (imgs: UploadedImageItem[]) => void;
    maxFiles?: number;
    overallTrust: number | null;
    images: UploadedImageItem[];
}

export default function SellStep1Photos({
    onImagesChange,
    maxFiles = 5,
    overallTrust,
    images,
}: SellStep1PhotosProps) {
    // Images that have been analyzed and have trust score too low
    const blockedImages = images.filter(
        (img) =>
            img.status === "done" &&
            img.analysis &&
            img.analysis.trustScore < TRUST_BLOCK_THRESHOLD
    );
    const isBlocked = blockedImages.length > 0;

    return (
        <div className="animate-fade-in-up">
            <ImageUploader
                onImagesChange={(imgs) => onImagesChange(imgs as UploadedImageItem[])}
                maxFiles={maxFiles}
            />

            {/* Overall trust score display */}
            {overallTrust !== null && (
                <div
                    className="glass"
                    style={{
                        marginTop: "1.5rem",
                        padding: "1.25rem",
                        borderRadius: "var(--radius-lg)",
                        textAlign: "center",
                    }}
                >
                    <p
                        style={{
                            fontSize: "0.82rem",
                            color: "var(--color-text-muted)",
                            marginBottom: "0.4rem",
                        }}
                    >
                        Overall Image Trust Score
                    </p>
                    <div
                        style={{
                            fontSize: "2.5rem",
                            fontWeight: 800,
                            color:
                                overallTrust >= 70
                                    ? "var(--color-verified)"
                                    : overallTrust >= 40
                                        ? "var(--color-suspicious)"
                                        : "var(--color-flagged)",
                        }}
                    >
                        {overallTrust}%
                    </div>
                    <div
                        style={{
                            height: "6px",
                            borderRadius: "var(--radius-full)",
                            background: "var(--color-bg)",
                            overflow: "hidden",
                            maxWidth: "300px",
                            margin: "0.5rem auto 0",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${overallTrust}%`,
                                borderRadius: "var(--radius-full)",
                                background:
                                    overallTrust >= 70
                                        ? "var(--color-verified)"
                                        : overallTrust >= 40
                                            ? "var(--color-suspicious)"
                                            : "var(--color-flagged)",
                                transition: "width 1s ease-out",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Block banner when trust score is too low */}
            {isBlocked && (
                <div
                    style={{
                        marginTop: "1.25rem",
                        padding: "1.1rem 1.25rem",
                        borderRadius: "var(--radius-lg)",
                        background: "rgba(255, 77, 77, 0.08)",
                        border: "1.5px solid rgba(255, 77, 77, 0.35)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                    }}
                >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
                        <ShieldX
                            size={20}
                            color="var(--color-flagged)"
                            style={{ flexShrink: 0, marginTop: "0.1rem" }}
                        />
                        <div>
                            <p
                                style={{
                                    fontWeight: 700,
                                    color: "var(--color-flagged)",
                                    fontSize: "0.9rem",
                                    margin: 0,
                                }}
                            >
                                Upload blocked &mdash; Trust Score too low
                            </p>
                            <p
                                style={{
                                    color: "var(--color-text-secondary)",
                                    fontSize: "0.8rem",
                                    margin: "0.25rem 0 0",
                                }}
                            >
                                {blockedImages.length} images have trust score below{" "}
                                <strong style={{ color: "var(--color-flagged)" }}>
                                    {TRUST_BLOCK_THRESHOLD}%
                                </strong>
                                . Please{" "}
                                <strong style={{ color: "var(--color-flagged)" }}>
                                    remove blocked images
                                </strong>{" "}
                                below to continue.
                            </p>
                        </div>
                    </div>

                    {/* List of blocked images */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                        {blockedImages.map((img) => {
                            const label = img.analysis?.classification
                                ? img.analysis.classification
                                    .charAt(0)
                                    .toUpperCase() +
                                img.analysis.classification.slice(1).replace(/-/g, " ")
                                : "Anh khong hop le";
                            return (
                                <div
                                    key={img.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.65rem",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "var(--radius-md)",
                                        background: "rgba(255,77,77,0.06)",
                                        border: "1px solid rgba(255,77,77,0.18)",
                                    }}
                                >
                                    <img
                                        src={img.preview}
                                        alt=""
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            objectFit: "cover",
                                            borderRadius: "var(--radius-sm)",
                                            border: "1.5px solid var(--color-flagged)",
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                color: "var(--color-flagged)",
                                                margin: 0,
                                            }}
                                        >
                                            {label}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "var(--color-text-muted)",
                                                margin: "0.1rem 0 0",
                                            }}
                                        >
                                            Trust Score:{" "}
                                            <strong style={{ color: "var(--color-flagged)" }}>
                                                {img.analysis?.trustScore}%
                                            </strong>{" "}
                                            &mdash; below allowed threshold ({TRUST_BLOCK_THRESHOLD}%)
                                        </p>
                                    </div>
                                    <AlertTriangle
                                        size={16}
                                        color="var(--color-flagged)"
                                        style={{ flexShrink: 0 }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Instruction hint */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,77,77,0.05)",
                            fontSize: "0.75rem",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        <Trash2 size={13} color="var(--color-text-muted)" />
                        Press the{" "}
                        <strong style={{ color: "var(--color-text-primary)", margin: "0 0.2rem" }}>
                            X
                        </strong>{" "}
                        button on the image to remove it from the list, then upload a new image of the product.
                    </div>
                </div>
            )}
        </div>
    );
}
