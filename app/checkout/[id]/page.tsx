"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrderById } from "../../services/orderService";
import { useAuth } from "../../components/auth/AuthProvider";
import { Order } from "../../data/products";

export default function CheckoutPage({ params }: { params: { id: string } }) {
    const routeParams = useParams();
    const idParam = routeParams?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam || params?.id;

    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchOrder = async () => {
            try {
                const fetchedOrder = await getOrderById(id);
                if (!fetchedOrder) {
                    setError("Order not found");
                } else if (fetchedOrder.buyerId !== user.uid) {
                    setError("You are not authorized to view this order");
                } else {
                    setOrder(fetchedOrder);
                }
            } catch (err: unknown) {
                console.error(err);
                setError("Failed to fetch order details");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, user]);

    const handlePayment = async () => {
        if (!order) return;
        setProcessingPayment(true);
        try {
            // Use timestamp tail to reduce collisions while keeping numeric format for PayOS.
            const orderCode = Number(String(Date.now()).slice(-9));

            const response = await fetch("/api/payment/create-link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: order.id,
                    orderCode: orderCode,
                    amount: Math.max(Math.round(order.price * 25000), 2000), // Convert USD to VND, PayOS min is 2000
                    description: "Mua hang",
                    returnUrl: `${window.location.origin}/payment/success?orderId=${order.id}`,
                    cancelUrl: `${window.location.origin}/payment/cancel?orderId=${order.id}`,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error("No checkout url returned from server");
            }
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Unknown payment error";

            if (errorMessage.includes("Failed to fetch")) {
                alert("Loi ket noi: khong the ket noi dich vu thanh toan. Vui long khoi dong backend.");
            } else {
                alert(`Loi thanh toan: ${errorMessage}`);
            }
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
                <div className="glass rounded-2xl p-8 text-center animate-fade-in">
                    <p style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>Loading order details...</p>
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

    const isPaid = order.status === "paid" || order.status === "shipped" || order.status === "completed";
    const safePrice = Math.max(0, order.price);

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
            <div className="animate-fade-in-up" style={{ marginBottom: "1.1rem" }}>
                <h1
                    style={{
                        fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)",
                        fontWeight: 800,
                        color: "var(--color-text-primary)",
                        marginBottom: "0.35rem",
                    }}
                >
                    Checkout
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    Confirm your order and continue to secure payment.
                </p>
            </div>

            <div className="glass animate-fade-in-up" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                <div style={{ padding: "1rem", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.32rem 0.7rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: isPaid ? "#74f0cc" : "#ffd39a",
                            background: isPaid ? "rgba(0, 212, 170, 0.16)" : "rgba(255, 179, 71, 0.16)",
                        }}
                    >
                        {order.status}
                    </span>
                </div>

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
                                Price: <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>${safePrice.toLocaleString()}</span>
                            </p>
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem" }}>
                                Payment Method: {order.paymentMethod.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                        <h3 style={{ color: "var(--color-text-secondary)", fontWeight: 700, marginBottom: "0.85rem", fontSize: "0.95rem" }}>
                            Select Payment Method
                        </h3>
                        <button
                            onClick={handlePayment}
                            disabled={processingPayment || isPaid}
                            className="w-full py-3 rounded-xl font-semibold transition"
                            style={{
                                background: "var(--gradient-primary)",
                                color: "#fff",
                                boxShadow: "var(--shadow-glow)",
                                opacity: processingPayment || isPaid ? 0.65 : 1,
                                cursor: processingPayment || isPaid ? "not-allowed" : "pointer",
                            }}
                        >
                            {processingPayment ? "Processing..." : isPaid ? "Already Paid" : "Pay with PayOS (Bank Transfer)"}
                        </button>

                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "0.65rem", textAlign: "center" }}>
                            You will be redirected to PayOS to complete the transaction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
