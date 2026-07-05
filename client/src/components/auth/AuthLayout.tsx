"use client";

import { ReactNode } from "react";

import Logo from "./Logo";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({children,}: AuthLayoutProps) {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_30%),linear-gradient(135deg,#eef6ff_0%,#f8fbff_45%,#f3f4f6_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]">
            <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white/70 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-sky-700 p-10 text-white lg:flex">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.3),transparent_35%)]" />
                        <div className="relative z-10">
                            <Logo />
                            <div className="mt-10 space-y-4">
                                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-sky-100">
                                    Intelligent operations, beautifully unified
                                </div>
                                <h2 className="text-4xl font-semibold leading-tight">Run your business with clarity and confidence.</h2>
                                <p className="max-w-lg text-base text-slate-200/90">
                                    Smart ERP brings billing, inventory, accounting, and reporting into one elegant workspace designed for modern teams.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-slate-100">
                            <p className="font-medium">Trusted by fast-moving teams that value speed and accuracy.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center bg-transparent p-6 sm:p-8 lg:p-10">
                        <div className="w-full max-w-md">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}