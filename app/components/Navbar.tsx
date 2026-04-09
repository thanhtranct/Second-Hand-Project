"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, ShoppingBag, PlusCircle, User, Shield, Heart, LogOut, LayoutDashboard, Settings, Bell } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { signOutUser } from "../services/authService";
import { getNotificationsByUserId } from "../services/notificationService";

const publicLinks = [
    { href: "/", label: "Home", icon: ShoppingBag },
    { href: "/products", label: "Browse", icon: Search },
];



export default function Navbar() {
    const { user, isAdmin, isSeller, loading } = useAuth();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    React.useEffect(() => {
        if (!user) return;
        getNotificationsByUserId(user.uid).then(notifs => {
            setUnreadCount(notifs.filter(n => !n.read).length);
        }).catch(err => console.error(err));
    }, [user]);

    const handleLogout = async () => {
        await signOutUser();
        setDropdownOpen(false);
        router.push("/");
    };

    const allNavLinks = [
        ...publicLinks,
        ...(user && isSeller ? [{ href: "/sell", label: "Sell", icon: PlusCircle }] : []),
        ...(user ? [{ href: "/wishlist", label: "Wishlist", icon: Heart }] : []),
    ];

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(15, 15, 26, 0.75)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--color-border)",
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "0 1.5rem",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.5rem",
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        textDecoration: "none",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            background: "var(--gradient-primary)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Shield size={18} color="#fff" />
                    </div>
                    <span
                        style={{
                            fontSize: "1.15rem",
                            fontWeight: 800,
                            color: "var(--color-text-primary)",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Re<span style={{ color: "var(--color-primary)" }}>Sell</span>
                    </span>
                </Link>

                {/* Search Bar — Desktop */}
                <div
                    style={{
                        flex: 1,
                        maxWidth: "420px",
                        position: "relative",
                        display: "flex",
                    }}
                    className="hide-mobile"
                >
                    <Search
                        size={16}
                        style={{
                            position: "absolute",
                            left: "0.85rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: searchFocused ? "var(--color-primary)" : "var(--color-text-muted)",
                            transition: "color var(--transition-fast)",
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search secondhand items..."
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        style={{
                            width: "100%",
                            padding: "0.55rem 1rem 0.55rem 2.5rem",
                            background: "var(--color-bg-secondary)",
                            border: `1px solid ${searchFocused ? "var(--color-primary)" : "var(--color-border)"}`,
                            borderRadius: "var(--radius-full)",
                            color: "var(--color-text-primary)",
                            fontSize: "0.85rem",
                            outline: "none",
                            transition: "all var(--transition-base)",
                        }}
                    />
                </div>

                {/* Nav Links + Auth — Desktop */}
                <div
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                    className="hide-mobile"
                >
                    {allNavLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.45rem 0.85rem",
                                borderRadius: "var(--radius-md)",
                                color: "var(--color-text-secondary)",
                                textDecoration: "none",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                transition: "all var(--transition-fast)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(108,99,255,0.1)";
                                e.currentTarget.style.color = "var(--color-primary-light)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--color-text-secondary)";
                            }}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    ))}

                    {/* Auth section */}
                    {!loading && (
                        user ? (
                            /* Logged in — Notifications + Avatar + Dropdown */
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "0.5rem" }}>
                                <Link
                                    href="/notifications"
                                    style={{ position: "relative", color: "var(--color-text-secondary)" }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-primary)"}
                                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: "absolute", top: "-4px", right: "-4px",
                                            background: "var(--color-flagged)", color: "white",
                                            fontSize: "0.6rem", fontWeight: "bold",
                                            borderRadius: "50%", padding: "2px 5px"
                                        }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                                <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        background: user.photoURL ? "transparent" : "var(--gradient-primary)",
                                        border: "2px solid var(--color-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        transition: "border-color var(--transition-fast)",
                                        padding: 0,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                                    onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.borderColor = "var(--color-border)"; }}
                                >
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                                            {(user.displayName || user.email || "U")[0].toUpperCase()}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <>
                                        <div
                                            onClick={() => setDropdownOpen(false)}
                                            style={{ position: "fixed", inset: 0, zIndex: 99 }}
                                        />
                                        <div
                                            className="animate-fade-in-down"
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 0.5rem)",
                                                width: "220px",
                                                background: "var(--color-bg-card)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "var(--radius-lg)",
                                                overflow: "hidden",
                                                zIndex: 100,
                                                boxShadow: "var(--shadow-lg)",
                                            }}
                                        >
                                            {/* User info */}
                                            <div style={{ padding: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                                                <p style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.88rem", marginBottom: "0.15rem" }}>
                                                    {user.displayName || "User"}
                                                </p>
                                                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                                    {user.email}
                                                </p>
                                            </div>

                                            {/* Menu items */}
                                            {[
                                                { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                                                { href: "/profile", icon: Settings, label: "Profile" },
                                                { href: "/wishlist", icon: Heart, label: "Wishlist" },
                                                ...(isAdmin ? [{ href: "/admin", icon: Shield, label: "Admin Panel" }] : []),
                                            ].map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setDropdownOpen(false)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.6rem",
                                                        padding: "0.65rem 1rem",
                                                        color: "var(--color-text-secondary)",
                                                        textDecoration: "none",
                                                        fontSize: "0.85rem",
                                                        transition: "all var(--transition-fast)",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "rgba(108,99,255,0.08)";
                                                        e.currentTarget.style.color = "var(--color-primary-light)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "transparent";
                                                        e.currentTarget.style.color = "var(--color-text-secondary)";
                                                    }}
                                                >
                                                    <item.icon size={16} />
                                                    {item.label}
                                                </Link>
                                            ))}

                                            {/* Logout */}
                                            <button
                                                onClick={handleLogout}
                                                style={{
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.6rem",
                                                    padding: "0.65rem 1rem",
                                                    color: "var(--color-flagged)",
                                                    background: "transparent",
                                                    border: "none",
                                                    borderTop: "1px solid var(--color-border)",
                                                    cursor: "pointer",
                                                    fontSize: "0.85rem",
                                                    textAlign: "left",
                                                    transition: "all var(--transition-fast)",
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,107,107,0.08)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        ) : (
                            /* Not logged in — Login/Signup buttons */
                            <div style={{ display: "flex", gap: "0.5rem", marginLeft: "0.5rem" }}>
                                <Link
                                    href="/auth/login"
                                    style={{
                                        padding: "0.4rem 1rem",
                                        borderRadius: "var(--radius-md)",
                                        color: "var(--color-text-secondary)",
                                        textDecoration: "none",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        transition: "all var(--transition-fast)",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-primary-light)"}
                                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    style={{
                                        padding: "0.4rem 1rem",
                                        borderRadius: "var(--radius-md)",
                                        background: "var(--gradient-primary)",
                                        color: "#fff",
                                        textDecoration: "none",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        transition: "all var(--transition-fast)",
                                    }}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    style={{
                        display: "none",
                        background: "transparent",
                        border: "none",
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        padding: "0.25rem",
                    }}
                    className="show-mobile"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div
                    style={{
                        padding: "1rem 1.5rem",
                        borderTop: "1px solid var(--color-border)",
                        background: "var(--color-bg-secondary)",
                        animation: "fadeInDown 0.2s ease-out",
                    }}
                    className="show-mobile"
                >
                    <div style={{ position: "relative", marginBottom: "1rem" }}>
                        <Search
                            size={16}
                            style={{
                                position: "absolute",
                                left: "0.85rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--color-text-muted)",
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            style={{
                                width: "100%",
                                padding: "0.55rem 1rem 0.55rem 2.5rem",
                                background: "var(--color-bg)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-full)",
                                color: "var(--color-text-primary)",
                                fontSize: "0.85rem",
                                outline: "none",
                            }}
                        />
                    </div>
                    {allNavLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                padding: "0.7rem 0",
                                color: "var(--color-text-secondary)",
                                textDecoration: "none",
                                fontSize: "0.95rem",
                                borderBottom: "1px solid var(--color-border)",
                            }}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    ))}

                    {/* Mobile Auth */}
                    {!loading && (
                        user ? (
                            <>
                                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 0", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.95rem", borderBottom: "1px solid var(--color-border)" }}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </Link>
                                <Link href="/profile" onClick={() => setMobileOpen(false)}
                                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 0", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.95rem", borderBottom: "1px solid var(--color-border)" }}>
                                    <User size={18} /> Profile
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 0", color: "var(--color-flagged)", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.95rem", width: "100%" }}>
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </>
                        ) : (
                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                                    style={{ flex: 1, textAlign: "center", padding: "0.6rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                                    Log In
                                </Link>
                                <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                                    style={{ flex: 1, textAlign: "center", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                                    Sign Up
                                </Link>
                            </div>
                        )
                    )}
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
        </nav>
    );
}
