"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../components/auth/AuthProvider";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { Product } from "../data/products";
import { getProductsBySeller, deleteProduct } from "../services/productService";
import { getOrdersBySeller } from "../services/orderService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  Package,
  DollarSign,
  Eye,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";

function DashboardContent() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        const products = await getProductsBySeller(user.uid);
        setMyListings(products);
        
        const orders = await getOrdersBySeller(user.uid);
        const completed = orders.filter(o => o.status === "paid" || o.status === "shipped" || o.status === "completed");
        setTotalSales(completed.reduce((sum, o) => sum + o.price, 0));
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    await deleteProduct(id);
    setMyListings((prev) => prev.filter((p) => p.id !== id));
  };

  const avgTrust =
    myListings.length > 0
      ? Math.round(myListings.reduce((acc, p) => acc + p.trustScore, 0) / myListings.length)
      : 0;

  const dashStats = [
    { icon: Package, label: "Active Listings", value: String(myListings.length), color: "var(--color-primary)" },
    { icon: DollarSign, label: "Total Sales", value: `$${totalSales.toLocaleString()}`, color: "var(--color-verified)" },
    { icon: Eye, label: "Total Views", value: "0", color: "var(--color-accent)" },
    { icon: TrendingUp, label: "Avg Trust Score", value: myListings.length > 0 ? `${avgTrust}%` : "—", color: "var(--color-suspicious)" },
  ];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Welcome back, {user?.displayName || "Seller"}! Here&apos;s your selling overview.
          </p>
        </div>
        <Link href="/sell" style={{ textDecoration: "none" }}>
          <Button icon={<PlusCircle size={16} />}>New Listing</Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {dashStats.map((s) => (
          <div
            key={s.label}
            className="glass"
            style={{
              padding: "1.25rem",
              borderRadius: "var(--radius-lg)",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border-hover)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  background: `${s.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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

      {/* Listings table */}
      <div
        className="glass"
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ShieldCheck size={18} color="var(--color-primary)" />
            My Listings
          </h2>
          <Link href={`/seller/${user?.uid}`} style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm" icon={<ExternalLink size={14} />}>
              View Shop
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
            </div>
          ) : myListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>No listings yet</p>
              <p style={{ fontSize: "0.82rem" }}>Create your first listing to get started!</p>
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                  }}
                >
                  {["Item", "Price", "Category", "Trust", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myListings.map((p: Product) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background var(--transition-fast)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(108,99,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            style={{
                              width: "44px",
                              height: "44px",
                              objectFit: "cover",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--color-bg-secondary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Package size={18} color="var(--color-text-muted)" />
                          </div>
                        )}
                        <Link
                          href={`/products/${p.id}`}
                          style={{
                            color: "var(--color-text-primary)",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          {p.title}
                        </Link>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      ${p.price}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "var(--color-text-muted)" }}>
                      {p.category}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <Badge level={p.trustLevel} score={p.trustScore} size="sm" />
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(255,107,107,0.1)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--color-flagged)",
                            transition: "all var(--transition-fast)",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,107,107,0.2)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,107,107,0.1)"}
                          title="Delete listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
