"use client";

/**
 * ==========================================================
 * Auth Context
 * ==========================================================
 * Responsible for:
 * - Authentication State
 * - User State
 * - Login
 * - Logout
 * - Refresh Current User
 * - Authentication Initialization
 * ==========================================================
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import authService from "@/services/auth.service";
import { User } from "@/types/auth";

/**
 * ==========================================================
 * Context Type
 * ==========================================================
 */

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (
        token: string,
        user: User,
        rememberMe?: boolean
    ) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

/**
 * ==========================================================
 * Create Context
 * ==========================================================
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * ==========================================================
 * Provider Props
 * ==========================================================
 */

interface Props {
    children: ReactNode;
}

/**
 * ==========================================================
 * Provider
 * ==========================================================
 */

export function AuthProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);

    /**
     * ======================================================
     * Login
     * ======================================================
     */

    const login = (token: string, loggedInUser: User, rememberMe = false) => {
        Cookies.set("token", token, {
            expires: rememberMe ? 30 : 1,
            sameSite: "Lax",
        });

        setUser(loggedInUser);
    };

    /**
     * ======================================================
     * Logout
     * ======================================================
     */

    const logout = async () => {
        try {
            await authService.logout();
        } catch {
            /**
             * Ignore logout API errors.
             */
        }
        Cookies.remove("token");
        setUser(null);
    };

    /**
     * ======================================================
     * Refresh Current User
     * ======================================================
     */

    const refreshUser = async () => {
        try {
            const response = await authService.getCurrentUser();
            const currentUser = response?.user ?? response?.data ?? response;
            setUser(currentUser);
        } catch {
            Cookies.remove("token");
            setUser(null);
        }
    };

    /**
     * ======================================================
     * Initialize Authentication
     * ======================================================
     */

    useEffect(() => {
        const initialize = async () => {
            const token = Cookies.get("token");

            if (!token) {
                setLoading(false);
                return;
            }
            await refreshUser();
            setLoading(false);
        };
        initialize();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * ==========================================================
 * Hook
 * ==========================================================
 */

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used inside AuthProvider.");
    }
    return context;
}