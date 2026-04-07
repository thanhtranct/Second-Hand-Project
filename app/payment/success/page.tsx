"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../components/auth/AuthProvider";
import { completePayment } from "../../services/orderService";
import Link from "next/link";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const { user } = useAuth();
    const [updating, setUpdating] = useState(true);
    const [message, setMessage] = useState("Verifying payment...");

    useEffect(() => {
        const run = async () => {
            if (!orderId) {
                setMessage("Missing order reference.");
                setUpdating(false);
                return;
            }

            if (!user) {
                setMessage("Please sign in to sync your order status.");
                setUpdating(false);
                return;
            }

            try {
                await completePayment(orderId, user.uid);
                setMessage("Payment confirmed. The product has been saved to your order and hidden from new listings.");
            } catch (err) {
                console.error("Failed to complete payment", err);
                setMessage("Payment received, but status sync failed. Please refresh profile/orders.");
            } finally {
                setUpdating(false);
            }
        };

        run();
    }, [orderId, user, searchParams]);

    return (
        <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
                {updating ? "Verifying payment..." : message}
            </p>
            <div className="space-y-3">
                <Link href="/" className="block w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Return to Home
                </Link>
                <Link href="/profile" className="block w-full bg-gray-100 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                    View Orders
                </Link>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-white shadow-lg rounded-xl max-w-md mx-auto mt-16">Loading...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
