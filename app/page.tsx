"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import { Product } from "./data/products";
import { getProducts } from "./services/productService";
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Upload,
  Zap,
  Smartphone,
  Shirt,
  Sofa,
  BookOpen,
  Gamepad2,
  Car,
  Baby,
  Dumbbell,
  Package,
} from "lucide-react";

/* ===== MOCK DATA ===== */
const categories = [
  { name: "Electronics", icon: Smartphone, color: "#6C63FF" },
  { name: "Fashion", icon: Shirt, color: "#FF6B6B" },
  { name: "Furniture", icon: Sofa, color: "#00D4AA" },
  { name: "Books", icon: BookOpen, color: "#FFB347" },
  { name: "Gaming", icon: Gamepad2, color: "#8B85FF" },
  { name: "Vehicles", icon: Car, color: "#34E0BF" },
  { name: "Kids & Baby", icon: Baby, color: "#FF8A80" },
  { name: "Sports", icon: Dumbbell, color: "#82B1FF" },
];



const howItWorks = [
  {
    icon: Upload,
    title: "Upload Photos",
    desc: "Take real photos of your item and upload them to your listing.",
  },
  {
    icon: ShieldCheck,
    title: "AI Verifies",
    desc: "Our AI scans metadata, detects web sources, editing, and AI generation.",
  },
  {
    icon: Zap,
    title: "Trust Score",
    desc: "Each image gets a trust score so buyers can shop with confidence.",
  },
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = target;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span>{count.toLocaleString()}{suffix}</span>
  );
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then((all) => setFeaturedProducts(all.slice(0, 4)));
  }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          background: "var(--gradient-hero)",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)",
            top: "-100px",
            right: "-100px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)",
            bottom: "-50px",
            left: "-50px",
            pointerEvents: "none",
          }}
        />

        <div
          style={{ maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 1 }}
          className="animate-fade-in-up"
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 1rem",
              background: "rgba(108,99,255,0.1)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: "var(--radius-full)",
              marginBottom: "1.5rem",
              fontSize: "0.8rem",
              color: "var(--color-primary-light)",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            AI-Powered Image Verification
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              lineHeight: 1.15,
              marginBottom: "1.25rem",
              letterSpacing: "-0.03em",
            }}
          >
            Buy & Sell with{" "}
            <span
              style={{
                background: "var(--gradient-accent)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Confidence
            </span>
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--color-text-secondary)",
              maxWidth: "520px",
              margin: "0 auto 2rem",
              lineHeight: 1.6,
            }}
          >
            The secondhand marketplace where every image is verified by AI.
            Detect web-sourced, edited, and AI-generated photos instantly.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/products" style={{ textDecoration: "none" }}>
              <Button size="lg" icon={<Search size={18} />}>
                Browse Items
              </Button>
            </Link>
            <Link href="/sell" style={{ textDecoration: "none" }}>
              <Button variant="outline" size="lg" icon={<Upload size={18} />}>
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "900px",
          margin: "-2rem auto 0",
          padding: "0 1.5rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          className="glass animate-fade-in-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            borderRadius: "var(--radius-xl)",
            padding: "1.75rem 2rem",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          {[
            { value: 12500, suffix: "+", label: "Items Listed" },
            { value: 98, suffix: "%", label: "Trust Accuracy" },
            { value: 8200, suffix: "+", label: "Happy Users" },
            { value: 45000, suffix: "+", label: "Images Scanned" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  background: "var(--gradient-accent)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 1.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Browse Categories
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Find the perfect secondhand deal
          </p>
        </div>
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "1rem",
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?category=${cat.name}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="animate-fade-in-up"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1.5rem 1rem",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  cursor: "pointer",
                  transition: "all var(--transition-base)",
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cat.color + "50";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 0 20px ${cat.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-md)",
                    background: `${cat.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <cat.icon size={24} color={cat.color} />
                </div>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FEATURED LISTINGS ===== */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                marginBottom: "0.3rem",
              }}
            >
              Featured Listings
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
              Verified items from trusted sellers
            </p>
          </div>
          <Link href="/products" style={{ textDecoration: "none" }}>
            <Button variant="ghost" icon={<ArrowRight size={16} />}>
              View All
            </Button>
          </Link>
        </div>
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {featuredProducts.length > 0 ? (
            featuredProducts.map((p) => (
              <div key={p.id} className="animate-fade-in-up" style={{ opacity: 0 }}>
                <Link href={`/products/${p.id}`} style={{ textDecoration: "none" }}>
                  <Card
                    image={p.image}
                    title={p.title}
                    price={p.price}
                    seller={p.seller}
                    condition={p.condition}
                    trustLevel={p.trustLevel}
                    trustScore={p.trustScore}
                  />
                </Link>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              <Package size={40} style={{ marginBottom: "0.75rem", opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No listings yet</p>
              <p style={{ fontSize: "0.85rem" }}>Be the first to sell an item!</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            How AI Verification Works
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Three simple steps to buy & sell with trust
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {howItWorks.map((step, i) => (
            <div
              key={i}
              className="glass"
              style={{
                padding: "2rem 1.5rem",
                borderRadius: "var(--radius-xl)",
                textAlign: "center",
                transition: "all var(--transition-base)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-hover)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "1rem",
                  fontSize: "3rem",
                  fontWeight: 900,
                  color: "rgba(108,99,255,0.06)",
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "var(--radius-lg)",
                  background: "rgba(108,99,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <step.icon size={26} color="var(--color-primary)" />
              </div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div
          style={{
            background: "var(--gradient-primary)",
            borderRadius: "var(--radius-xl)",
            padding: "3rem 2rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)",
              pointerEvents: "none",
            }}
          />
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.75rem",
              position: "relative",
            }}
          >
            Ready to sell with trust?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "1.5rem", position: "relative" }}>
            List your first item with AI-verified images today
          </p>
          <Link href="/sell" style={{ textDecoration: "none", position: "relative" }}>
            <Button
              variant="secondary"
              size="lg"
              style={{
                background: "#fff",
                color: "var(--color-primary-dark)",
                border: "none",
                fontWeight: 700,
              }}
              icon={<ArrowRight size={18} />}
            >
              Start Selling
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
