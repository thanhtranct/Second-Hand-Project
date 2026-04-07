"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Order } from "../../data/products";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

function AdminRevenueContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "orders"),
                where("status", "in", ["paid", "shipped", "completed"])
            );
            const snapshot = await getDocs(q);
            const data: Order[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                data.push({
                    id: doc.id,
                    productId: docData.productId || "",
                    productTitle: docData.productTitle || "",
                    productImage: docData.productImage || "",
                    price: docData.price || 0,
                    buyerId: docData.buyerId || "",
                    sellerId: docData.sellerId || "",
                    status: docData.status || "pending",
                    paymentMethod: docData.paymentMethod || "cod",
                    createdAt: docData.createdAt?.toMillis?.() || Date.now(),
                });
            });
            data.sort((a, b) => b.createdAt - a.createdAt);
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders for revenue", err);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    const platformFee = totalRevenue * 0.1; // 10% platform fee
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = orders
        .filter(o => o.createdAt >= today.getTime())
        .reduce((sum, order) => sum + order.price, 0);

    return (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                    Platform Revenue
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    Track payments and revenue across the platform.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
            ) : (
                <>
                    {/* Revenue Stats */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem",
                        marginBottom: "2.5rem",
                    }}>
                        <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                                <DollarSign size={18} color="#10b981" />
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Total Processed</span>
                            </div>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>${totalRevenue.toLocaleString()}</div>
                        </div>

                        <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                                <TrendingUp size={18} color="var(--color-primary)" />
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Platform Revenue (10%)</span>
                            </div>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary)" }}>${platformFee.toLocaleString()}</div>
                        </div>

                        <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                                <Calendar size={18} color="var(--color-accent)" />
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Today's Volume</span>
                            </div>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>${todayRevenue.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Recent Transactions</h2>
                    <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                                        <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Order ID</th>
                                        <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Item</th>
                                        <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Amount</th>
                                        <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Method</th>
                                        <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Date</th>
                                        <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                            <td style={{ padding: "1rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>
                                                {order.id.slice(0, 8)}...
                                            </td>
                                            <td style={{ padding: "1rem", fontWeight: 500 }}>{order.productTitle}</td>
                                            <td style={{ padding: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>${order.price.toLocaleString()}</td>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <CreditCard size={14} color="var(--color-text-muted)" />
                                                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>{order.paymentMethod}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "1rem" }}>
                                                <span style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    background: order.status === 'completed' ? '#dcfce7' : order.status === 'paid' ? '#dbeafe' : '#fef9c3',
                                                    color: order.status === 'completed' ? '#166534' : order.status === 'paid' ? '#1e40af' : '#854d0e',
                                                }}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                                                No completed transactions yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function AdminRevenuePage() {
    return (
        <ProtectedRoute adminOnly>
            <AdminRevenueContent />
        </ProtectedRoute>
    );
}
