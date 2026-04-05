"use client";

import React from "react";
import ImageUploader from "../../components/ui/ImageUploader";

interface UploadedImageItem {
    id: string;
    file?: File;
    preview: string;
    status: string;
    analysis?: { trustScore: number; classification: string };
}

interface SellStep1PhotosProps {
    onImagesChange: (imgs: UploadedImageItem[]) => void;
    maxFiles?: number;
    overallTrust: number | null;
}

export default function SellStep1Photos({
    onImagesChange,
    maxFiles = 5,
    overallTrust,
}: SellStep1PhotosProps) {
    return (
        <div className="animate-fade-in-up">
            <ImageUploader
                onImagesChange={(imgs) => onImagesChange(imgs as UploadedImageItem[])}
                maxFiles={maxFiles}
            />

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
        </div>
    );
}
