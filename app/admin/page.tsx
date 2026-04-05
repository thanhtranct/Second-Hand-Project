"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { Product } from "../data/products";
import { getAllProducts } from "../services/productService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import Badge from "../components/ui/Badge";
import {
  Package,
  Users,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";

function AdminContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllProducts(),
      getDocs(collection(db, "users")),
    ]).then(([prods, usersSnap]) => {
      setProducts(prods);
      setUsersCount(usersSnap.size);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
        <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
      </div>
    );
  }

  const avgTrust =
    products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + p.trustScore, 0) / products.length)
      : 0;
  const flaggedCount = products.filter((p) => p.trustLevel === "flagged").length;

  const stats = [
    { icon: Package, label: "Total Products", value: String(products.length), color: "var(--color-primary)" },
    { icon: Users, label: "Total Users", value: String(usersCount), color: "var(--color-accent)" },
    { icon: ShieldAlert, label: "Flagged Items", value: String(flaggedCount), color: "var(--color-flagged)" },
    { icon: TrendingUp, label: "Avg Trust Score", value: `${avgTrust}%`, color: "var(--color-suspicious)" },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
          Admin Panel
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
          Platform overview and management
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass"
            style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", transition: "all var(--transition-base)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={18} color={s.color} />
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
        <Link href="/admin/products" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", cursor: "pointer", transition: "all var(--transition-base)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Package size={24} color="var(--color-primary)" />
                <div>
                  <h3 style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1rem" }}>Manage Products</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>View and moderate all listings</p>
                </div>
              </div>
              <ArrowRight size={20} color="var(--color-text-muted)" />
            </div>
          </div>
        </Link>
        <Link href="/admin/users" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", cursor: "pointer", transition: "all var(--transition-base)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Users size={24} color="var(--color-accent)" />
                <div>
                  <h3 style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1rem" }}>Manage Users</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>View registered users</p>
                </div>
              </div>
              <ArrowRight size={20} color="var(--color-text-muted)" />
            </div>
          </div>
        </Link>
        <Link href="/admin/applications" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", cursor: "pointer", transition: "all var(--transition-base)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <ShieldCheck size={24} color="var(--color-primary)" />
                <div>
                  <h3 style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1rem" }}>Seller Applications</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Review and approve sellers</p>
                </div>
              </div>
              <ArrowRight size={20} color="var(--color-text-muted)" />
            </div>
          </div>
        </Link>
        <Link href="/admin/revenue" style={{ textDecoration: "none" }}>
          <div
            className="glass"
            style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", cursor: "pointer", transition: "all var(--transition-base)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-border-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <TrendingUp size={24} color="#10b981" />
                <div>
                  <h3 style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1rem" }}>Revenue</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Track successful payments</p>
                </div>
              </div>
              <ArrowRight size={20} color="var(--color-text-muted)" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent flagged items */}
      {flaggedCount > 0 && (
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} color="var(--color-flagged)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Flagged Items ({flaggedCount})
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                  {["Item", "Seller", "Trust", "Posted"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", fontWeight: 700, color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.filter((p) => p.trustLevel === "flagged").slice(0, 10).map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <Link href={`/products/${p.id}`} style={{ color: "var(--color-text-primary)", textDecoration: "none", fontWeight: 600 }}>
                        {p.title}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "var(--color-text-muted)" }}>{p.seller}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <Badge level={p.trustLevel} score={p.trustScore} size="sm" />
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "var(--color-text-muted)" }}>{p.postedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminContent />
    </ProtectedRoute>
  );
}
