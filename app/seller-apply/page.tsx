"use client";

import { useState } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { applyForSeller } from "../services/sellerService";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Store, UserRound } from "lucide-react";

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

    const fieldStyle: React.CSSProperties = {
        width: "100%",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "0.72rem 0.9rem",
        color: "var(--color-text-primary)",
        outline: "none",
        fontSize: "0.92rem",
    };

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
            <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
                <div className="glass rounded-3xl p-8 md:p-10 text-center animate-fade-in-up">
                    <div
                        style={{
                            width: "70px",
                            height: "70px",
                            margin: "0 auto 1rem",
                            borderRadius: "50%",
                            background: "rgba(0, 212, 170, 0.14)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(0, 212, 170, 0.35)",
                        }}
                    >
                        <CheckCircle2 size={34} color="#5de7c2" />
                    </div>

                    <h1 style={{ color: "var(--color-text-primary)", fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Application Submitted
                    </h1>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.4rem" }}>
                        Your seller application is now under review. We usually respond within 1-2 business days.
                    </p>

                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 rounded-xl font-semibold transition"
                        style={{
                            background: "var(--gradient-primary)",
                            color: "#fff",
                            boxShadow: "var(--shadow-glow)",
                        }}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
            <div className="animate-fade-in-up" style={{ marginBottom: "1.1rem" }}>
                <h1 style={{ color: "var(--color-text-primary)", fontSize: "clamp(1.7rem, 3.1vw, 2.35rem)", fontWeight: 800, marginBottom: "0.45rem" }}>
                    Become a Seller
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.94rem" }}>
                    Open your store and start selling verified secondhand items to trusted buyers.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-4 animate-fade-in-up">
                <div className="glass rounded-xl p-3" style={{ color: "var(--color-text-secondary)" }}>
                    <UserRound size={16} style={{ marginBottom: "0.45rem", color: "var(--color-primary-light)" }} />
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Identity Check</p>
                    <p style={{ fontSize: "0.75rem" }}>Secure seller verification</p>
                </div>
                <div className="glass rounded-xl p-3" style={{ color: "var(--color-text-secondary)" }}>
                    <Store size={16} style={{ marginBottom: "0.45rem", color: "var(--color-primary-light)" }} />
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Store Profile</p>
                    <p style={{ fontSize: "0.75rem" }}>Build buyer credibility</p>
                </div>
                <div className="glass rounded-xl p-3" style={{ color: "var(--color-text-secondary)" }}>
                    <ShieldCheck size={16} style={{ marginBottom: "0.45rem", color: "var(--color-primary-light)" }} />
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Safe Trading</p>
                    <p style={{ fontSize: "0.75rem" }}>Protected marketplace tools</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 md:p-7 animate-fade-in-up" style={{ display: "grid", gap: "1rem" }}>
                {error && (
                    <div className="rounded-xl p-3" style={{ background: "rgba(255, 107, 107, 0.12)", border: "1px solid rgba(255, 107, 107, 0.35)", color: "#ffb3b3" }}>
                        {error}
                    </div>
                )}
                
                <div>
                    <label className="block mb-2" style={{ color: "var(--color-text-secondary)", fontSize: "0.84rem", fontWeight: 700 }}>Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="Your legal full name"
                        style={fieldStyle}
                    />
                </div>

                <div>
                    <label className="block mb-2" style={{ color: "var(--color-text-secondary)", fontSize: "0.84rem", fontWeight: 700 }}>Phone Number</label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                        placeholder="Example: 09xxxxxxxx"
                        style={fieldStyle}
                    />
                </div>

                <div>
                    <label className="block mb-2" style={{ color: "var(--color-text-secondary)", fontSize: "0.84rem", fontWeight: 700 }}>Store Name</label>
                    <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        required
                        placeholder="What should buyers see?"
                        style={fieldStyle}
                    />
                </div>

                <div>
                    <label className="block mb-2" style={{ color: "var(--color-text-secondary)", fontSize: "0.84rem", fontWeight: 700 }}>Why do you want to become a seller?</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        placeholder="Tell us what you want to sell and your experience."
                        style={{ ...fieldStyle, resize: "vertical" }}
                    />
                </div>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.9rem", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                    By submitting this application, you agree to our terms and conditions for sellers. Your identity will be verified before your account is approved.
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    style={{
                        background: "var(--gradient-primary)",
                        color: "#fff",
                        opacity: loading ? 0.7 : 1,
                        boxShadow: "var(--shadow-glow)",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Submitting..." : "Submit Application"}
                    {!loading && <ArrowRight size={16} />}
                </button>
            </form>
        </div>
    );
}
