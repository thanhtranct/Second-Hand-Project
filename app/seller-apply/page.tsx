"use client";

import { useState } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { applyForSeller } from "../services/sellerService";
import { useRouter } from "next/navigation";

export default function SellerApplyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        storeName: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!user) {
            setError("You must be logged in to apply.");
            return;
        }

        setLoading(true);
        try {
            await applyForSeller({
                userId: user.uid,
                email: user.email || "",
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                storeName: formData.storeName,
                description: formData.description,
            });
            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            setError("Failed to submit application. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-8 mt-12 bg-white rounded-xl shadow-lg text-center">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Application Submitted!</h1>
                <p className="text-gray-600 mb-8">
                    Your seller application is under review. Our team will contact you within 1-2 business days.
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 mt-8">
            <h1 className="text-3xl font-bold mb-6">Become a Seller</h1>
            <p className="text-gray-600 mb-8">
                Join our marketplace to start selling your secondhand items safely and securely.
                Please provide your details below.
            </p>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-lg space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                    <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to become a seller?</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-200 text-sm text-gray-500 mb-6">
                    By submitting this application, you agree to our terms and conditions for sellers. Your identity will be verified before your account is approved.
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                    {loading ? "Submitting..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
}
