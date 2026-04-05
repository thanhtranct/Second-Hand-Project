"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrderById, updateOrderStatus } from "../../services/orderService";
import { useAuth } from "../../components/auth/AuthProvider";
import { Order } from "../../data/products";
import React from "react";

export default function CheckoutPage({ params }: { params: { id: string } }) {
    const unwrappedParams = React.use(params as any) as { id: string };
    const id = unwrappedParams.id;

    const router = useRouter();
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
            // Update order status to pending before redirecting
            await updateOrderStatus(order.id, "pending");

            // Generate orderCode from string id for PayOS (needs to be int)
            const orderCode = Math.floor(Math.random() * 1000000000); // Temporary random ID for prototype

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/payment/create-link`, {
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
        } catch (err: any) {
            console.error(err);
            if (err.message.includes("Failed to fetch")) {
                alert("Lỗi kết nối: Backend Python (localhost:8000) chưa được bật! Vui lòng khởi động Backend.");
            } else {
                alert(`Lỗi thanh toán: ${err.message}`);
            }
            setProcessingPayment(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!order) return null;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 mt-8">
            <h1 className="text-3xl font-bold mb-6">Payment Checkout</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex gap-4 mb-4">
                    <img src={order.productImage || "/placeholder.jpg"} alt={order.productTitle} className="w-24 h-24 object-cover rounded" />
                    <div>
                        <h2 className="text-xl font-semibold mb-2">{order.productTitle}</h2>
                        <p className="text-gray-600 mb-2">Price: ${order.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Payment Method: {order.paymentMethod.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Status: <span className="font-medium text-orange-500">{order.status}</span></p>
                    </div>
                </div>

                <div className="border-t border-gray-200 mt-6 pt-6">
                    <h3 className="font-semibold mb-4">Select Payment Method</h3>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handlePayment}
                            disabled={processingPayment || order.status === "paid" || order.status === "shipped" || order.status === "completed"}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {processingPayment ? "Processing..." : order.status === "paid" ? "Already Paid" : "Pay with PayOS (Bank Transfer)"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
