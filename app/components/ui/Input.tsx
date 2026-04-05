"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const baseInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 1rem",
    background: "var(--color-bg-secondary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-text-primary)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "all var(--transition-base)",
    fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.4rem",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    letterSpacing: "0.01em",
};

const errorStyle: React.CSSProperties = {
    marginTop: "0.3rem",
    fontSize: "0.75rem",
    color: "var(--color-flagged)",
};

export function Input({ label, error, icon, style, ...props }: InputProps) {
    return (
        <div style={{ marginBottom: "1rem" }}>
            {label && <label style={labelStyle}>{label}</label>}
            <div style={{ position: "relative" }}>
                {icon && (
                    <span
                        style={{
                            position: "absolute",
                            left: "0.75rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--color-text-muted)",
                            display: "flex",
                        }}
                    >
                        {icon}
                    </span>
                )}
                <input
                    style={{
                        ...baseInputStyle,
                        paddingLeft: icon ? "2.5rem" : "1rem",
                        borderColor: error ? "var(--color-flagged)" : "var(--color-border)",
                        ...style,
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = error
                            ? "var(--color-flagged)"
                            : "var(--color-primary)";
                        e.currentTarget.style.boxShadow = error
                            ? "0 0 0 3px rgba(255,107,107,0.1)"
                            : "0 0 0 3px rgba(108,99,255,0.1)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = error
                            ? "var(--color-flagged)"
                            : "var(--color-border)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                    {...props}
                />
            </div>
            {error && <p style={errorStyle}>{error}</p>}
        </div>
    );
}

export function TextArea({ label, error, style, ...props }: TextAreaProps) {
    return (
        <div style={{ marginBottom: "1rem" }}>
            {label && <label style={labelStyle}>{label}</label>}
            <textarea
                style={{
                    ...baseInputStyle,
                    minHeight: "120px",
                    resize: "vertical",
                    borderColor: error ? "var(--color-flagged)" : "var(--color-border)",
                    ...style,
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = error
                        ? "var(--color-flagged)"
                        : "var(--color-primary)";
                    e.currentTarget.style.boxShadow = error
                        ? "0 0 0 3px rgba(255,107,107,0.1)"
                        : "0 0 0 3px rgba(108,99,255,0.1)";
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = error
                        ? "var(--color-flagged)"
                        : "var(--color-border)";
                    e.currentTarget.style.boxShadow = "none";
                }}
                {...props}
            />
            {error && <p style={errorStyle}>{error}</p>}
        </div>
    );
}
