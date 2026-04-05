"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/AuthProvider";
import { signOutUser } from "../services/authService";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const logoutUser = useCallback(async () => {
        if (user) {
            await signOutUser();
            router.push("/login?timeout=true");
        }
    }, [user, router]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (user) {
            timeoutRef.current = setTimeout(logoutUser, TIMEOUT_MS);
        }
    }, [user, logoutUser]);

    useEffect(() => {
        if (!user) return;

        resetTimer();

        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
        ];

        events.forEach((event) => {
            document.addEventListener(event, resetTimer);
        });

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach((event) => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [user, resetTimer]);

    return <>{children}</>;
}
