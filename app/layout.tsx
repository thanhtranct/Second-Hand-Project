import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthProvider from "./components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ReSell — Secondhand Marketplace with AI Image Verification",
  description:
    "Buy and sell secondhand goods with confidence. AI-powered image verification detects web-sourced, edited, and AI-generated images for trust and authenticity.",
  keywords: ["secondhand", "marketplace", "AI", "image verification", "buy", "sell", "used goods"],
};

import SessionTimeoutProvider from "./components/SessionTimeoutProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable}`} style={{ fontFamily: "var(--font-geist-sans), Inter, sans-serif" }} suppressHydrationWarning>
        <AuthProvider>
          <SessionTimeoutProvider>
            <Navbar />
            <main style={{ minHeight: "calc(100vh - 64px)" }}>{children}</main>
            <Footer />
          </SessionTimeoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
