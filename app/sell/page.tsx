"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { uploadImage, createProduct } from "../services/productService";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { useAuth } from "../components/auth/AuthProvider";
import {
    FileText,
    ChevronRight,
    ChevronLeft,
    Check,
    ShieldCheck,
    Loader2,
} from "lucide-react";
import SellStep1Photos from "./components/SellStep1Photos";
import SellStep2Details from "./components/SellStep2Details";
import SellStep3Review from "./components/SellStep3Review";

const steps = [
    { label: "Photos", icon: ShieldCheck },
    { label: "Details", icon: FileText },
    { label: "Review", icon: Check },
];

function SellContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [publishing, setPublishing] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
        condition: "",
        location: "",
    });
    const [images, setImages] = useState<
        { id: string; file?: File; preview: string; status: string; analysis?: { trustScore: number; classification: string } }[]
    >([]);

    const updateField = (field: keyof typeof form, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const validateStep = (): string | null => {
        if (step === 0) {
            if (images.length === 0) return "Please upload at least one photo.";
        }
        if (step === 1) {
            if (!form.title.trim()) return "Title is required.";
            if (form.title.trim().length < 3) return "Title must be at least 3 characters.";
            if (form.title.trim().length > 100) return "Title must be 100 characters or fewer.";
            const price = parseFloat(form.price);
            if (!form.price || isNaN(price) || price <= 0) return "Price must be a positive number.";
            if (!form.category) return "Please select a category.";
            if (!form.condition) return "Please select a condition.";
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep();
        if (err) {
            setValidationError(err);
            return;
        }
        setValidationError("");
        setStep(step + 1);
    };

    const overallTrust =
        images.length > 0
            ? Math.round(
                images
                    .filter((i) => i.analysis)
                    .reduce((acc, i) => acc + (i.analysis?.trustScore ?? 0), 0) /
                Math.max(images.filter((i) => i.analysis).length, 1)
            )
            : null;

    return (
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            <h1
                style={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: "var(--color-text-primary)",
                    marginBottom: "0.3rem",
                }}
            >
                Sell an Item
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", marginBottom: "2rem" }}>
                Upload photos & let AI verify them, then fill in the details
            </p>

            {/* Step indicator */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    marginBottom: "2.5rem",
                }}
            >
                {steps.map((s, i) => (
                    <React.Fragment key={i}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.4rem 1rem",
                                borderRadius: "var(--radius-full)",
                                background: i <= step ? "rgba(108,99,255,0.15)" : "transparent",
                                border: `1px solid ${i <= step ? "var(--color-primary)" : "var(--color-border)"}`,
                                color: i <= step ? "var(--color-primary-light)" : "var(--color-text-muted)",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                transition: "all var(--transition-base)",
                            }}
                        >
                            {i < step ? (
                                <Check size={14} />
                            ) : (
                                <s.icon size={14} />
                            )}
                            {s.label}
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                style={{
                                    width: "30px",
                                    height: "2px",
                                    background: i < step ? "var(--color-primary)" : "var(--color-border)",
                                    borderRadius: "1px",
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 0: Photos */}
            {step === 0 && (
                <SellStep1Photos
                    onImagesChange={setImages}
                    maxFiles={5}
                    overallTrust={overallTrust}
                />
            )}

            {/* Step 1: Details */}
            {step === 1 && (
                <SellStep2Details form={form} onUpdate={updateField} />
            )}

            {/* Step 2: Review */}
            {step === 2 && (
                <SellStep3Review images={images} form={form} overallTrust={overallTrust} />
            )}

            {/* Navigation */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    marginTop: "2rem",
                    gap: "0.75rem",
                }}
            >
                {validationError && (
                    <div
                        style={{
                            padding: "0.65rem 1rem",
                            background: "rgba(255,107,107,0.1)",
                            border: "1px solid rgba(255,107,107,0.25)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.82rem",
                            color: "var(--color-flagged)",
                        }}
                    >
                        {validationError}
                    </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                    {step > 0 ? (
                        <Button variant="secondary" onClick={() => { setValidationError(""); setStep(step - 1); }} icon={<ChevronLeft size={16} />}>
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}
                    {step < 2 ? (
                        <Button
                            onClick={handleNext}
                            icon={<ChevronRight size={16} />}
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            disabled={publishing}
                            onClick={async () => {
                                setPublishing(true);
                                try {
                                    // Upload all images to Firebase Storage
                                    const imageFiles = images
                                        .filter((img) => img.file)
                                        .map((img) => img.file as File);
                                    const imageUrls = await Promise.all(imageFiles.map(uploadImage));

                                    // Determine trust level from overall trust score
                                    const trustLevel: "verified" | "suspicious" | "flagged" =
                                        (overallTrust ?? 0) >= 70 ? "verified" : (overallTrust ?? 0) >= 40 ? "suspicious" : "flagged";

                                    // Create product in Firestore
                                    await createProduct({
                                        title: form.title,
                                        description: form.description,
                                        price: parseFloat(form.price) || 0,
                                        images: imageUrls,
                                        category: form.category,
                                        condition: form.condition,
                                        location: form.location,
                                        trustScore: overallTrust ?? 50,
                                        trustLevel,
                                        seller: user?.displayName || "Anonymous",
                                        sellerId: user?.uid || "",
                                        sellerEmail: user?.email || "",
                                    });

                                    router.push("/products");
                                } catch (err) {
                                    console.error("Publish failed:", err);
                                    setPublishing(false);
                                    alert("Failed to publish. Please try again.");
                                }
                            }}
                            icon={publishing ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                        >
                            {publishing ? "Publishing..." : "Publish Listing"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SellPage() {
    return (
        <ProtectedRoute>
            <SellContent />
        </ProtectedRoute>
    );
}
