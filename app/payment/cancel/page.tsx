"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "../../components/auth/AuthProvider";
import { getOrderById, updateOrderStatus } from "../../services/orderService";

function PaymentCancelContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const { user } = useAuth();
    const [cancelling, setCancelling] = useState(true);

    useEffect(() => {
        const cancelOrder = async () => {
            if (!orderId || !user) {
                setCancelling(false);
                return;
            }
            try {
                const order = await getOrderById(orderId);
                if (order && order.status === "pending" && order.buyerId === user.uid) {
                    await updateOrderStatus(orderId, "cancelled");
                }
            } catch (err) {
                console.error("Failed to cancel order", err);
            } finally {
                setCancelling(false);
            }
        };
        cancelOrder();
    }, [orderId, user]);

    return (
        <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
            <p className="text-gray-600 mb-6">
                {cancelling
                    ? "Cancelling your order..."
                    : "Your order has been cancelled. No payment was processed."}
            </p>
            <div className="space-y-3">
                {orderId && (
                    <Link href={`/checkout/${orderId}`} className="block w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                        Try Again
                    </Link>
                )}
                <Link href="/" className="block w-full bg-gray-100 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                    Return to Home
                </Link>
            </div>
        </div>
    );
}

export default function PaymentCancelPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-white shadow-lg rounded-xl max-w-md mx-auto mt-16">Loading...</div>}>
            <PaymentCancelContent />
        </Suspense>
    );
}
