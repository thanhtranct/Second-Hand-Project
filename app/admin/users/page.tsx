"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Input } from "../../components/ui/Input";
import { Search, ArrowLeft, Loader2, Users, Mail, Calendar, ExternalLink } from "lucide-react";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: { toMillis?: () => number } | number;
}

function AdminUsersContent() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) => {
      const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserData[];
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter(
    (u) =>
      !search ||
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Back to Admin
      </Link>

      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
        Users ({users.length})
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
        View all registered users
      </p>

      <div style={{ maxWidth: "400px", marginBottom: "1.5rem" }}>
        <Input placeholder="Search users..." icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
      </div>

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
                  {["User", "Email", "Role", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", fontWeight: 700, color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid} style={{ borderBottom: "1px solid var(--color-border)", transition: "background var(--transition-fast)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(108,99,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: u.photoURL ? "transparent" : "var(--gradient-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>
                              {(u.displayName || u.email || "U")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {u.displayName || "Anonymous"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "var(--color-text-muted)" }}>{u.email}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          background: u.role === "admin" ? "rgba(108,99,255,0.15)" : "rgba(0,212,170,0.1)",
                          color: u.role === "admin" ? "var(--color-primary-light)" : "var(--color-verified)",
                        }}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <Link href={`/seller/${u.uid}`}>
                        <button style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "rgba(108,99,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-primary)" }} title="View listings">
                          <ExternalLink size={14} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
              <Users size={40} style={{ marginBottom: "0.75rem", opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
