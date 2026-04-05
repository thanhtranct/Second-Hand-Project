"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, TextArea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import ImageUploader from "../components/ui/ImageUploader";
import { uploadImage, createProduct } from "../services/productService";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { useAuth } from "../components/auth/AuthProvider";
import {
    Package,
    DollarSign,
    Tag,
    FileText,
    MapPin,
    ChevronRight,
    ChevronLeft,
    Check,
    ShieldCheck,
    Loader2,
} from "lucide-react";

const categories = [
    "Electronics",
    "Fashion",
    "Furniture",
    "Books",
    "Gaming",
    "Vehicles",
    "Kids & Baby",
    "Sports",
    "Other",
];
const conditions = ["Like New", "Excellent", "Good", "Acceptable"];

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

    const updateField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const canProceed = () => {
        if (step === 0) return images.length > 0;
        if (step === 1) return form.title && form.price && form.category && form.condition;
        return true;
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

    const selectStyle: React.CSSProperties = {
        width: "100%",
        padding: "0.7rem 1rem",
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text-primary)",
        fontSize: "0.9rem",
        outline: "none",
        cursor: "pointer",
        marginBottom: "1rem",
    };

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
                <div className="animate-fade-in-up">
                    <ImageUploader
                        onImagesChange={(imgs) => setImages(imgs as typeof images)}
                        maxFiles={5}
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
            )}

            {/* Step 1: Details */}
            {step === 1 && (
                <div className="animate-fade-in-up">
                    <Input
                        label="Title"
                        placeholder="e.g. iPhone 14 Pro — Like New"
                        icon={<Package size={16} />}
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                    />
                    <TextArea
                        label="Description"
                        placeholder="Describe your item — condition, included accessories, reason for selling..."
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                    />
                    <Input
                        label="Price ($)"
                        type="number"
                        placeholder="0.00"
                        icon={<DollarSign size={16} />}
                        value={form.price}
                        onChange={(e) => updateField("price", e.target.value)}
                    />

                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.4rem",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            Category
                        </label>
                        <select
                            value={form.category}
                            onChange={(e) => updateField("category", e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.4rem",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            Condition
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {conditions.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => updateField("condition", c)}
                                    style={{
                                        padding: "0.45rem 1rem",
                                        borderRadius: "var(--radius-full)",
                                        border: `1px solid ${form.condition === c ? "var(--color-primary)" : "var(--color-border)"}`,
                                        background: form.condition === c ? "rgba(108,99,255,0.15)" : "transparent",
                                        color: form.condition === c ? "var(--color-primary-light)" : "var(--color-text-muted)",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all var(--transition-fast)",
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Location"
                        placeholder="e.g. Ho Chi Minh City"
                        icon={<MapPin size={16} />}
                        value={form.location}
                        onChange={(e) => updateField("location", e.target.value)}
                    />
                </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
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

                        {[
                            { label: "Title", value: form.title },
                            { label: "Price", value: `$${form.price}` },
                            { label: "Category", value: form.category },
                            { label: "Condition", value: form.condition },
                            { label: "Location", value: form.location || "Not specified" },
                        ].map((item) => (
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
                                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
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
            )}

            {/* Navigation */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2rem",
                    gap: "1rem",
                }}
            >
                {step > 0 ? (
                    <Button variant="secondary" onClick={() => setStep(step - 1)} icon={<ChevronLeft size={16} />}>
                        Back
                    </Button>
                ) : (
                    <div />
                )}
                {step < 2 ? (
                    <Button
                        disabled={!canProceed()}
                        onClick={() => setStep(step + 1)}
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
    );
}

export default function SellPage() {
    return (
        <ProtectedRoute>
            <SellContent />
        </ProtectedRoute>
    );
}
