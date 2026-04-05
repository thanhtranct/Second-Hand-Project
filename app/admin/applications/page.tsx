"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { SellerApplication } from "../../data/products";
import { getSellerApplications, updateApplicationStatus } from "../../services/sellerService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

function AdminApplicationsContent() {
    const [applications, setApplications] = useState<SellerApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const apps = await getSellerApplications();
            setApplications(apps);
        } catch (err) {
            console.error("Failed to fetch applications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, userId: string, action: "approve" | "reject") => {
        try {
            const status = action === "approve" ? "approved" : "rejected";
            await updateApplicationStatus(id, status);
            
            if (action === "approve") {
                // Update user role to seller
                await updateDoc(doc(db, "users", userId), { role: "seller" });
            }

            fetchApplications();
        } catch (err) {
            console.error(`Failed to ${action} application`, err);
            alert(`Failed to ${action} application.`);
        }
    };

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                    Seller Applications
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    Review pending seller applications.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
            ) : applications.length === 0 ? (
                <div className="glass" style={{ padding: "2rem", textAlign: "center", borderRadius: "12px" }}>
                    No applications found.
                </div>
            ) : (
                <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                                    <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>User</th>
                                    <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Store Name</th>
                                    <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Description</th>
                                    <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Status</th>
                                    <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>{app.fullName}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{app.email}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{app.phoneNumber}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>{app.storeName}</td>
                                        <td style={{ padding: "1rem", maxWidth: "300px" }}>
                                            <div style={{ maxHeight: "60px", overflowY: "auto" }}>{app.description}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <span style={{
                                                padding: "4px 8px",
                                                borderRadius: "12px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                background: app.status === 'approved' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                                                color: app.status === 'approved' ? '#166534' : app.status === 'rejected' ? '#991b1b' : '#854d0e',
                                            }}>
                                                {app.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right" }}>
                                            {app.status === "pending" && (
                                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                                    <button
                                                        onClick={() => handleAction(app.id, app.userId, "approve")}
                                                        style={{ padding: "6px 12px", background: "none", border: "1px solid #166534", color: "#166534", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(app.id, app.userId, "reject")}
                                                        style={{ padding: "6px 12px", background: "none", border: "1px solid #991b1b", color: "#991b1b", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
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

export default function AdminApplicationsPage() {
    return (
        <ProtectedRoute adminOnly>
            <AdminApplicationsContent />
        </ProtectedRoute>
    );
}
