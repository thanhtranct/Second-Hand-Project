"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { Product } from "../../data/products";
import { getAllProducts, deleteProduct } from "../../services/productService";
import Badge from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Search, Trash2, ExternalLink, Loader2, Package, ArrowLeft } from "lucide-react";

function AdminProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getAllProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.seller.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.trustLevel === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

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
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Back to Admin
      </Link>

      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
        All Products ({products.length})
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
        Manage and moderate all product listings
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <Input placeholder="Search products, sellers..." icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
        </div>
        {["All", "Verified", "Suspicious", "Flagged"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={chipStyle(filter === f)}>{f}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                  {["Item", "Price", "Seller", "Category", "Trust", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", fontWeight: 700, color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background var(--transition-fast)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(108,99,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {p.image ? (
                          <img src={p.image} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }} />
                        ) : (
                          <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={16} color="var(--color-text-muted)" />
                          </div>
                        )}
                        <Link href={`/products/${p.id}`} style={{ color: "var(--color-text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}>
                          {p.title}
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      ${p.price}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "var(--color-text-muted)" }}>
                      {p.sellerId ? (
                        <Link href={`/seller/${p.sellerId}`} style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>{p.seller}</Link>
                      ) : p.seller}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "var(--color-text-muted)" }}>{p.category}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <Badge level={p.trustLevel} score={p.trustScore} size="sm" />
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <Link href={`/products/${p.id}`}>
                          <button style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "rgba(108,99,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-primary)" }} title="View">
                            <ExternalLink size={14} />
                          </button>
                        </Link>
                        <button onClick={() => handleDelete(p.id)} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "rgba(255,107,107,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-flagged)" }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
              <p style={{ fontWeight: 600 }}>No products match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminProductsContent />
    </ProtectedRoute>
  );
}
