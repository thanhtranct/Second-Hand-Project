"use client";

import React from "react";
import { Input, TextArea } from "../../components/ui/Input";
import { Package, DollarSign, MapPin } from "lucide-react";

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

export interface SellFormFields {
    title: string;
    description: string;
    price: string;
    category: string;
    condition: string;
    location: string;
}

interface SellStep2DetailsProps {
    form: SellFormFields;
    onUpdate: (field: keyof SellFormFields, value: string) => void;
}

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

export default function SellStep2Details({ form, onUpdate }: SellStep2DetailsProps) {
    return (
        <div className="animate-fade-in-up">
            <Input
                label="Title"
                placeholder="e.g. iPhone 14 Pro — Like New"
                icon={<Package size={16} />}
                value={form.title}
                onChange={(e) => onUpdate("title", e.target.value)}
            />
            <TextArea
                label="Description"
                placeholder="Describe your item — condition, included accessories, reason for selling..."
                value={form.description}
                onChange={(e) => onUpdate("description", e.target.value)}
            />
            <Input
                label="Price ($)"
                type="number"
                placeholder="0.00"
                icon={<DollarSign size={16} />}
                value={form.price}
                onChange={(e) => onUpdate("price", e.target.value)}
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
                    onChange={(e) => onUpdate("category", e.target.value)}
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
                            onClick={() => onUpdate("condition", c)}
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
                onChange={(e) => onUpdate("location", e.target.value)}
            />
        </div>
    );
}
