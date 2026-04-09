"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getOrderById } from "../../services/orderService";
import { useAuth } from "../../components/auth/AuthProvider";
import { Order } from "../../data/products";
import { USD_TO_VND, PAYMENT_POLL_INTERVAL_MS } from "../../config/constants";
import Link from "next/link";

interface CheckoutInfo {
    paymentCode: string;
    qrUrl: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
    amount: number;
    transferContent: string;
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
    const routeParams = useParams();
    const idParam = routeParams?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam || params?.id;

    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    const [creatingCheckout, setCreatingCheckout] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string>("pending");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchOrder = async () => {
            try {
                const fetchedOrder = await getOrderById(id);
                if (!fetchedOrder) {
                    setError("No order found.");
                } else if (fetchedOrder.buyerId !== user.uid) {
                    setError("You do not have permission to view this order.");
                } else {
                    setOrder(fetchedOrder);
                    setPaymentStatus(fetchedOrder.status);
                }
            } catch (err: unknown) {
                console.error(err);
                setError("Unable to load order information. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, user]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const getAuthToken = useCallback(async () => {
        if (!user) return "";
        try {
            return await user.getIdToken();
        } catch {
            return "";
        }
    }, [user]);

    const startPolling = useCallback((orderId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);

        pollRef.current = setInterval(async () => {
            try {
                const token = await getAuthToken();
                const res = await fetch(`/api/payment/status/${orderId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status && data.status !== "pending") {
                        setPaymentStatus(data.status);
                        if (pollRef.current) clearInterval(pollRef.current);
                    }
                }
            } catch {
                // silently retry on next interval
            }
        }, PAYMENT_POLL_INTERVAL_MS);
    }, [getAuthToken]);

    const handleCreateCheckout = async () => {
        if (!order || !user) return;
        setCreatingCheckout(true);
        try {
            const token = await getAuthToken();
            const amountVND = Math.max(Math.round(order.price * USD_TO_VND), 2000);

            const response = await fetch("/api/payment/create-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    orderId: order.id,
                    amount: amountVND,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let detail = errorText;
                try {
                    const parsed = JSON.parse(errorText) as { detail?: string };
                    if (parsed?.detail) detail = parsed.detail;
                } catch { /* keep raw */ }
                throw new Error(`Server ${response.status}: ${detail}`);
            }

            const data: CheckoutInfo = await response.json();
            setCheckoutInfo(data);
            startPolling(order.id);
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : "Payment error";
            if (msg.includes("Failed to fetch")) {
                alert("Unable to connect to the payment service. Please start the backend.");
            } else {
                alert(`Error: ${msg}`);
            }
        } finally {
            setCreatingCheckout(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
                <div className="glass rounded-2xl p-8 text-center animate-fade-in">
                    <p style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>Đang tải thông tin đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
                <div className="rounded-2xl p-8 text-center animate-fade-in" style={{ background: "rgba(255, 107, 107, 0.12)", border: "1px solid rgba(255, 107, 107, 0.35)" }}>
                    <p style={{ color: "#ff9c9c", fontWeight: 600 }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const isPaid = paymentStatus === "paid" || paymentStatus === "shipped" || paymentStatus === "delivered" || paymentStatus === "completed";
    const isCancelled = paymentStatus === "cancelled";
    const safePrice = Math.max(0, order.price);
    const amountVND = Math.round(safePrice * USD_TO_VND);

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
            <div className="animate-fade-in-up" style={{ marginBottom: "1.1rem" }}>
                <h1 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.35rem" }}>
                    Payment
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    Confirm your order and transfer the payment to complete the transaction.
                </p>
            </div>

            <div className="glass animate-fade-in-up" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                {/* Status badge */}
                <div style={{ padding: "1rem", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", padding: "0.32rem 0.7rem",
                        borderRadius: "var(--radius-full)", fontSize: "0.78rem", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        color: isPaid ? "#74f0cc" : isCancelled ? "#ff9c9c" : "#ffd39a",
                        background: isPaid ? "rgba(0, 212, 170, 0.16)" : isCancelled ? "rgba(255, 107, 107, 0.16)" : "rgba(255, 179, 71, 0.16)",
                    }}>
                        {paymentStatus}
                    </span>
                </div>

                {/* Order summary */}
                <div style={{ padding: "1.25rem" }}>
                    <div className="flex flex-col sm:flex-row gap-4" style={{ marginBottom: "1rem" }}>
                        <img
                            src={order.productImage || "/placeholder.jpg"}
                            alt={order.productTitle}
                            className="w-full sm:w-36 h-40 sm:h-28 object-cover rounded-xl"
                            style={{ border: "1px solid var(--color-border)" }}
                        />
                        <div style={{ flex: 1 }}>
                            <h2 style={{ color: "var(--color-text-primary)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.45rem", lineHeight: 1.35 }}>
                                {order.productTitle}
                            </h2>
                            <p style={{ color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
                                Giá: <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>${safePrice.toLocaleString()}</span>
                                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem", fontSize: "0.85rem" }}>({amountVND.toLocaleString()} VND)</span>
                            </p>
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem" }}>
                                Phương thức: Chuyển khoản ngân hàng
                            </p>
                        </div>
                    </div>

                    {/* Payment success */}
                    {isPaid && (
                        <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(0, 212, 170, 0.08)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(0, 212, 170, 0.25)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                            <h3 style={{ color: "#74f0cc", fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.4rem" }}>
                                Thanh toán thành công!
                            </h3>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                                Đơn hàng đã được xác nhận. Chờ seller gửi hàng.
                            </p>
                            <Link href="/profile" style={{ display: "inline-block", marginTop: "1rem", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                                Xem đơn hàng →
                            </Link>
                        </div>
                    )}

                    {/* Cancelled */}
                    {isCancelled && (
                        <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(255, 107, 107, 0.08)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255, 107, 107, 0.25)" }}>
                            <h3 style={{ color: "#ff9c9c", fontWeight: 700 }}>Đơn hàng đã bị huỷ</h3>
                            <Link href="/products" style={{ display: "inline-block", marginTop: "0.75rem", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                                Quay lại mua sắm →
                            </Link>
                        </div>
                    )}

                    {/* QR Payment section */}
                    {!isPaid && !isCancelled && (
                        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                            {!checkoutInfo ? (
                                <>
                                    <h3 style={{ color: "var(--color-text-secondary)", fontWeight: 700, marginBottom: "0.85rem", fontSize: "0.95rem" }}>
                                        Thanh toán chuyển khoản ngân hàng
                                    </h3>
                                    <button
                                        onClick={handleCreateCheckout}
                                        disabled={creatingCheckout}
                                        className="w-full py-3 rounded-lg font-medium transition"
                                        style={{
                                            background: creatingCheckout ? "var(--color-border)" : "var(--gradient-primary)",
                                            color: "#fff", fontWeight: 700, fontSize: "1rem",
                                            cursor: creatingCheckout ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {creatingCheckout ? "Đang tạo mã thanh toán..." : "Tạo mã QR thanh toán"}
                                    </button>
                                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "0.65rem", textAlign: "center" }}>
                                        Quét mã QR bằng app ngân hàng để thanh toán
                                    </p>
                                </>
                            ) : (
                                <div>
                                    <h3 style={{ color: "var(--color-text-secondary)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem", textAlign: "center" }}>
                                        Quét mã QR để thanh toán
                                    </h3>

                                    {/* QR Code */}
                                    <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                                        <img
                                            src={checkoutInfo.qrUrl}
                                            alt="QR thanh toán"
                                            style={{ width: "220px", height: "220px", margin: "0 auto", borderRadius: "var(--radius-lg)", border: "2px solid var(--color-border)" }}
                                        />
                                    </div>

                                    {/* Bank transfer info */}
                                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius-lg)", padding: "1rem", border: "1px solid var(--color-border)" }}>
                                        <div style={{ display: "grid", gap: "0.6rem" }}>
                                            {[
                                                { label: "Ngân hàng", value: checkoutInfo.bankName },
                                                { label: "Số tài khoản", value: checkoutInfo.accountNumber },
                                                { label: "Chủ tài khoản", value: checkoutInfo.accountHolder },
                                                { label: "Số tiền", value: `${checkoutInfo.amount.toLocaleString()} VND` },
                                                { label: "Nội dung CK", value: checkoutInfo.transferContent },
                                            ].map((row) => (
                                                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{row.label}</span>
                                                    <span style={{ color: "var(--color-text-primary)", fontWeight: 700, fontSize: "0.9rem", textAlign: "right" }}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Polling indicator */}
                                    <div style={{ marginTop: "1rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                        <div style={{
                                            width: "8px", height: "8px", borderRadius: "50%",
                                            background: "#ffd39a", animation: "pulse 1.5s ease-in-out infinite",
                                        }} />
                                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                                            Đang chờ xác nhận thanh toán...
                                        </span>
                                    </div>

                                    <Link
                                        href={`/payment/cancel?orderId=${order.id}`}
                                        style={{ display: "block", marginTop: "1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.82rem", textDecoration: "underline" }}
                                    >
                                        Huỷ thanh toán
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
