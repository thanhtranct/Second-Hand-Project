"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Loader2, ShieldCheck, AlertTriangle, ShieldX, Camera, Info, ChevronDown, ChevronUp, Globe, Cpu, Paintbrush, CameraIcon } from "lucide-react";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done" | "error";
type Classification = "original" | "web-sourced" | "edited" | "ai-generated";

interface AnalyzerSummary {
    name: string;
    icon: string;
    score: number;
    verdict: "pass" | "warn" | "fail" | "neutral" | "skipped" | "no_data";
    summary: string;
}

interface ImageAnalysis {
    classification: Classification;
    classificationLabel: string;
    classificationLabelVi: string;
    classificationDescription: string;
    classificationReason: string;
    trustScore: number;
    trustLevel: string;
    analyzers: AnalyzerSummary[];
    metadata: {
        hasExif: boolean;
        camera?: string;
        software?: string;
        gps?: boolean;
    };
    reverseSearch: {
        found: boolean;
        matchCount: number;
        sources: string[];
    };
    aiDetection: {
        isAI: boolean;
        confidence: number;
    };
    ela: {
        edited: boolean;
        confidence: number;
    };
}

interface UploadedImage {
    id: string;
    file: File;
    preview: string;
    status: AnalysisStatus;
    analysis?: ImageAnalysis;
    error?: string;
}

interface ImageUploaderProps {
    onImagesChange?: (images: UploadedImage[]) => void;
    maxFiles?: number;
    apiUrl?: string;
}

const VERDICT_COLORS: Record<string, string> = {
    pass: "var(--color-verified)",
    warn: "var(--color-suspicious)",
    fail: "var(--color-flagged)",
    neutral: "var(--color-text-muted)",
    skipped: "var(--color-suspicious)",
    no_data: "var(--color-suspicious)",
};

const VERDICT_LABELS: Record<string, string> = {
    pass: "✓ Pass",
    warn: "⚠ Warning",
    fail: "✕ Fail",
    neutral: "— Neutral",
    skipped: "⚠ Unverified",
    no_data: "⚠ No Data",
};

const ANALYZER_ICONS: Record<string, React.ReactNode> = {
    camera: <CameraIcon size={14} />,
    globe: <Globe size={14} />,
    cpu: <Cpu size={14} />,
    paintbrush: <Paintbrush size={14} />,
};

export default function ImageUploader({
    onImagesChange,
    maxFiles = 5,
    apiUrl = "/api/analyze-image",
}: ImageUploaderProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Notify parent of image changes via useEffect (avoids setState-during-render)
    useEffect(() => {
        onImagesChange?.(images);
    }, [images, onImagesChange]);

    const analyzeImage = useCallback(
        async (image: UploadedImage) => {
            const formData = new FormData();
            formData.append("image", image.file);

            try {
                // Allow 120s for first-time model loading
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000);

                const res = await fetch(apiUrl, {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorText = await res.text().catch(() => "Unknown error");
                    console.error("Analysis API error:", res.status, errorText);

                    let detail = "Analysis failed";
                    try {
                        const parsed = JSON.parse(errorText) as { detail?: string };
                        if (parsed?.detail) detail = parsed.detail;
                    } catch {
                        if (errorText) detail = errorText;
                    }

                    throw new Error(`Analysis failed (${res.status}): ${detail}`);
                }
                const analysis: ImageAnalysis = await res.json();

                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id ? { ...img, status: "done" as const, analysis } : img
                    )
                );
            } catch (err) {
                const message = err instanceof Error && err.name === "AbortError"
                    ? "Analysis timed out — backend may be loading AI model. Try again."
                    : err instanceof Error
                        ? err.message
                        : "Analysis service unavailable";
                console.error("Image analysis error:", err);
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id
                            ? { ...img, status: "error" as const, error: message }
                            : img
                    )
                );
            }
        },
        [apiUrl]
    );

    const addFiles = useCallback(
        (files: FileList | File[]) => {
            const newImages: UploadedImage[] = Array.from(files)
                .slice(0, maxFiles - images.length)
                .filter((f) => f.type.startsWith("image/"))
                .map((file) => ({
                    id: Math.random().toString(36).slice(2),
                    file,
                    preview: URL.createObjectURL(file),
                    status: "analyzing" as const,
                }));

            setImages((prev) => [...prev, ...newImages]);

            newImages.forEach(analyzeImage);
        },
        [images.length, maxFiles, analyzeImage]
    );

    const removeImage = useCallback(
        (id: string) => {
            setImages((prev) => {
                const img = prev.find((i) => i.id === id);
                if (img) URL.revokeObjectURL(img.preview);
                return prev.filter((i) => i.id !== id);
            });
        },
        []
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        },
        [addFiles]
    );

    const getStatusIcon = (img: UploadedImage) => {
        if (img.status === "analyzing") return <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />;
        if (img.status === "error") return <AlertTriangle size={16} color="var(--color-flagged)" />;
        if (img.analysis) {
            if (img.analysis.trustScore >= 70) return <ShieldCheck size={16} color="var(--color-verified)" />;
            if (img.analysis.trustScore >= 40) return <AlertTriangle size={16} color="var(--color-suspicious)" />;
            return <ShieldX size={16} color="var(--color-flagged)" />;
        }
        return null;
    };

    const getClassColor = (c: Classification) => {
        const map: Record<Classification, string> = {
            original: "var(--color-verified)",
            "web-sourced": "var(--color-suspicious)",
            edited: "var(--color-suspicious)",
            "ai-generated": "var(--color-flagged)",
        };
        return map[c];
    };

    return (
        <div>
            {/* Drop Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragging ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "2.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: isDragging ? "rgba(108,99,255,0.05)" : "var(--color-bg-secondary)",
                    transition: "all var(--transition-base)",
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                    style={{ display: "none" }}
                />
                <Camera size={40} color="var(--color-primary)" style={{ marginBottom: "0.75rem" }} />
                <p style={{ color: "var(--color-text-primary)", fontWeight: 600, marginBottom: "0.3rem" }}>
                    Drag & drop images here
                </p>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                    or click to browse • Max {maxFiles} images • JPG, PNG, WebP
                </p>
                <p style={{ color: "var(--color-primary)", fontSize: "0.75rem", marginTop: "0.5rem", fontWeight: 600 }}>
                    🛡️ AI will verify each image for authenticity
                </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "1rem",
                        marginTop: "1.5rem",
                    }}
                >
                    {images.map((img) => {
                        const isExpanded = expandedId === img.id;
                        return (
                            <div
                                key={img.id}
                                style={{
                                    borderRadius: "var(--radius-md)",
                                    overflow: "hidden",
                                    border: `1px solid ${img.analysis ? getClassColor(img.analysis.classification) + "40" : "var(--color-border)"}`,
                                    background: "var(--color-bg-card)",
                                    transition: "all var(--transition-base)",
                                }}
                            >
                                {/* Image Preview */}
                                <div style={{ position: "relative" }}>
                                    <img
                                        src={img.preview}
                                        alt=""
                                        style={{ width: "100%", height: "160px", objectFit: "cover" }}
                                    />
                                    {/* Remove button */}
                                    <button
                                        onClick={() => removeImage(img.id)}
                                        style={{
                                            position: "absolute",
                                            top: "0.4rem",
                                            right: "0.4rem",
                                            background: "rgba(0,0,0,0.6)",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: "26px",
                                            height: "26px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            color: "#fff",
                                        }}
                                    >
                                        <X size={14} />
                                    </button>

                                    {/* Classification badge overlay */}
                                    {img.analysis && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: "0.4rem",
                                                left: "0.4rem",
                                                padding: "0.25rem 0.6rem",
                                                borderRadius: "var(--radius-sm)",
                                                background: "rgba(0,0,0,0.75)",
                                                backdropFilter: "blur(4px)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.3rem",
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                                color: getClassColor(img.analysis.classification),
                                            }}
                                        >
                                            {getStatusIcon(img)}
                                            {img.analysis.classificationLabel || img.analysis.classification}
                                        </div>
                                    )}
                                </div>

                                {/* Status & Summary */}
                                <div style={{ padding: "0.6rem 0.75rem" }}>
                                    {/* Analyzing state */}
                                    {img.status === "analyzing" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem" }}>
                                            <Loader2 size={15} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
                                            <span style={{ color: "var(--color-text-secondary)" }}>Analyzing image...</span>
                                        </div>
                                    )}

                                    {/* Error state */}
                                    {img.status === "error" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem" }}>
                                            <AlertTriangle size={15} color="var(--color-flagged)" />
                                            <span style={{ color: "var(--color-flagged)" }}>{img.error}</span>
                                        </div>
                                    )}

                                    {/* Done state — classification + trust score */}
                                    {img.status === "done" && img.analysis && (
                                        <div>
                                            {/* Trust score bar */}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: getClassColor(img.analysis.classification) }}>
                                                    Trust Score: {img.analysis.trustScore}%
                                                </span>
                                                <span style={{
                                                    fontSize: "0.65rem",
                                                    fontWeight: 600,
                                                    padding: "0.15rem 0.4rem",
                                                    borderRadius: "var(--radius-sm)",
                                                    background: getClassColor(img.analysis.classification) + "15",
                                                    color: getClassColor(img.analysis.classification),
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.03em",
                                                }}>
                                                    {img.analysis.trustLevel}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: "4px",
                                                borderRadius: "2px",
                                                background: "var(--color-bg-secondary)",
                                                marginBottom: "0.5rem",
                                            }}>
                                                <div style={{
                                                    height: "100%",
                                                    width: `${img.analysis.trustScore}%`,
                                                    borderRadius: "2px",
                                                    background: getClassColor(img.analysis.classification),
                                                    transition: "width 0.5s ease",
                                                }} />
                                            </div>

                                            {/* Classification reason */}
                                            <p style={{
                                                fontSize: "0.72rem",
                                                color: "var(--color-text-secondary)",
                                                lineHeight: 1.4,
                                                marginBottom: "0.4rem",
                                            }}>
                                                {img.analysis.classificationReason || img.analysis.classificationDescription}
                                            </p>

                                            {/* Expand/collapse button */}
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : img.id)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.3rem",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    color: "var(--color-primary)",
                                                    padding: "0.2rem 0",
                                                    width: "100%",
                                                }}
                                            >
                                                <Info size={12} />
                                                {isExpanded ? "Hide Details" : "View Details"}
                                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>

                                            {/* Detailed breakdown */}
                                            {isExpanded && img.analysis.analyzers && (
                                                <div style={{
                                                    marginTop: "0.4rem",
                                                    borderTop: "1px solid var(--color-border)",
                                                    paddingTop: "0.5rem",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "0.5rem",
                                                }}>
                                                    {img.analysis.analyzers.map((analyzer, i) => (
                                                        <div key={i} style={{
                                                            padding: "0.4rem 0.5rem",
                                                            borderRadius: "var(--radius-sm)",
                                                            background: "var(--color-bg-secondary)",
                                                        }}>
                                                            <div style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                marginBottom: "0.2rem",
                                                            }}>
                                                                <div style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "0.3rem",
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    color: "var(--color-text-primary)",
                                                                }}>
                                                                    <span style={{ color: VERDICT_COLORS[analyzer.verdict] }}>
                                                                        {ANALYZER_ICONS[analyzer.icon] || <Info size={14} />}
                                                                    </span>
                                                                    {analyzer.name}
                                                                </div>
                                                                <span style={{
                                                                    fontSize: "0.62rem",
                                                                    fontWeight: 700,
                                                                    color: VERDICT_COLORS[analyzer.verdict],
                                                                }}>
                                                                    {VERDICT_LABELS[analyzer.verdict]}
                                                                </span>
                                                            </div>
                                                            <p style={{
                                                                fontSize: "0.68rem",
                                                                color: "var(--color-text-muted)",
                                                                lineHeight: 1.35,
                                                                margin: 0,
                                                            }}>
                                                                {analyzer.summary}
                                                            </p>
                                                            {/* Mini score bar */}
                                                            <div style={{
                                                                height: "3px",
                                                                borderRadius: "1.5px",
                                                                background: "var(--color-bg-card)",
                                                                marginTop: "0.3rem",
                                                            }}>
                                                                <div style={{
                                                                    height: "100%",
                                                                    width: `${analyzer.score}%`,
                                                                    borderRadius: "1.5px",
                                                                    background: VERDICT_COLORS[analyzer.verdict],
                                                                    transition: "width 0.5s ease",
                                                                }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
