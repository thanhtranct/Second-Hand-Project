"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Product } from "../data/products";
import { getProducts } from "../services/productService";
import { Search, SlidersHorizontal, X, Loader2, DollarSign } from "lucide-react";

const allCategories = ["All", "Electronics", "Fashion", "Furniture", "Books", "Gaming", "Vehicles", "Kids & Baby", "Sports"];
const conditions = ["All", "Like New", "Excellent", "Good", "Acceptable"];
const trustFilters = ["All", "Verified", "Suspicious", "Flagged"];
const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: Low → High" },
    { value: "price-high", label: "Price: High → Low" },
    { value: "trust", label: "Trust Score" },
];

const ITEMS_PER_PAGE = 12;

function ProductsContent() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState(searchParams.get("category") || "All");
    const [condition, setCondition] = useState("All");
    const [trust, setTrust] = useState("All");
    const [sort, setSort] = useState("newest");
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    useEffect(() => {
        getProducts().then((data) => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, category, condition, trust, sort, minPrice, maxPrice]);

    const filtered = useMemo(() => {
        let items = [...products];

        if (search) {
            const q = search.toLowerCase();
            items = items.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.seller.toLowerCase().includes(q)
            );
        }
        if (category !== "All") items = items.filter((p) => p.category === category);
        if (condition !== "All") items = items.filter((p) => p.condition === condition);
        if (trust !== "All") items = items.filter((p) => p.trustLevel === trust.toLowerCase());

        // Price range filter
        if (minPrice) items = items.filter((p) => p.price >= parseFloat(minPrice));
        if (maxPrice) items = items.filter((p) => p.price <= parseFloat(maxPrice));

        switch (sort) {
            case "price-low":
                items.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                items.sort((a, b) => b.price - a.price);
                break;
            case "trust":
                items.sort((a, b) => b.trustScore - a.trustScore);
                break;
        }
        return items;
    }, [products, search, category, condition, trust, sort, minPrice, maxPrice]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedProducts = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const selectStyle: React.CSSProperties = {
        padding: "0.5rem 0.75rem",
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text-primary)",
        fontSize: "0.82rem",
        outline: "none",
        cursor: "pointer",
        minWidth: "120px",
    };

    const chipStyle = (active: boolean): React.CSSProperties => ({
        padding: "0.35rem 0.85rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.78rem",
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid",
        borderColor: active ? "var(--color-primary)" : "var(--color-border)",
        background: active ? "rgba(108,99,255,0.15)" : "transparent",
        color: active ? "var(--color-primary-light)" : "var(--color-text-muted)",
        transition: "all var(--transition-fast)",
        whiteSpace: "nowrap",
    });

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <h1
                    style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: "var(--color-text-primary)",
                        marginBottom: "0.3rem",
                    }}
                >
                    Browse Listings
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    {filtered.length} items available
                    {currentPage > 1 && ` · Page ${currentPage} of ${totalPages}`}
                </p>
            </div>

            {/* Search & filter toggle */}
            <div
                style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginBottom: "1.25rem",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ flex: 1, minWidth: "200px" }}>
                    <Input
                        placeholder="Search items, sellers..."
                        icon={<Search size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <Button
                    variant={showFilters ? "primary" : "secondary"}
                    icon={showFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    Filters
                </Button>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={selectStyle}
                >
                    {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div
                    className="glass animate-fade-in-down"
                    style={{
                        padding: "1.25rem",
                        borderRadius: "var(--radius-lg)",
                        marginBottom: "1.5rem",
                    }}
                >
                    {/* Categories */}
                    <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Category
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {allCategories.map((c) => (
                                <button key={c} onClick={() => setCategory(c)} style={chipStyle(category === c)}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Condition */}
                    <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Condition
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {conditions.map((c) => (
                                <button key={c} onClick={() => setCondition(c)} style={chipStyle(condition === c)}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trust Level */}
                    <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Trust Level
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {trustFilters.map((t) => (
                                <button key={t} onClick={() => setTrust(t)} style={chipStyle(trust === t)}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Price Range
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", maxWidth: "350px" }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        background: "var(--color-bg-secondary)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-md)",
                                        color: "var(--color-text-primary)",
                                        fontSize: "0.82rem",
                                        outline: "none",
                                    }}
                                />
                            </div>
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>to</span>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        background: "var(--color-bg-secondary)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-md)",
                                        color: "var(--color-text-primary)",
                                        fontSize: "0.82rem",
                                        outline: "none",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                    <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)", marginBottom: "1rem" }} />
                    <p style={{ color: "var(--color-text-muted)" }}>Loading listings...</p>
                </div>
            ) : paginatedProducts.length > 0 ? (
                <>
                    <div
                        className="stagger-children"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: "1.25rem",
                        }}
                    >
                        {paginatedProducts.map((p) => (
                            <div key={p.id} className="animate-fade-in-up" style={{ opacity: 0 }}>
                                <Link href={`/products/${p.id}`} style={{ textDecoration: "none" }}>
                                    <Card
                                        image={p.image}
                                        title={p.title}
                                        price={p.price}
                                        seller={p.seller}
                                        condition={p.condition}
                                        trustLevel={p.trustLevel}
                                        trustScore={p.trustScore}
                                    />
                                </Link>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        padding: "4rem 1rem",
                        color: "var(--color-text-muted)",
                    }}
                >
                    <Search size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>No items found</p>
                    <p style={{ fontSize: "0.85rem" }}>Try adjusting your filters or search</p>
                </div>
            )}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <div style={{ animation: "spin 1s linear infinite", display: "inline-block", width: 40, height: 40, border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%" }} />
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
