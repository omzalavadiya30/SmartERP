"use client";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

interface Props {
    children: ReactNode;
}

export default function Provider({ children }: Props) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}