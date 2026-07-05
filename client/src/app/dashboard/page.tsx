"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Building2, LogOut, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, isAuthenticated, logout } = useAuthContext();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [loading, isAuthenticated, router]);

    const handleLogout = async () => {
        await logout();
        toast.success("You have been signed out.");
        router.replace("/login");
    };

    if (loading || !isAuthenticated) {
        return null;
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_32%),linear-gradient(135deg,#07111f_0%,#111827_45%,#0f172a_100%)] text-white">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 shadow-[0_20px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Smart ERP</p>
                        <h1 className="text-2xl font-semibold">Welcome back, {user?.name || "there"}</h1>
                        <p className="mt-1 text-sm text-slate-300">Your business operations are flowing smoothly.</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-white/10 bg-slate-900/70 text-white shadow-[0_20px_70px_rgba(2,6,23,0.35)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-sky-400" />
                                Dashboard overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl border border-sky-400/20 bg-linear-to-br from-sky-500/15 to-indigo-500/10 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-sky-200">Current workspace</p>
                                        <p className="text-xl font-semibold">Operations hub</p>
                                    </div>
                                    <Sparkles className="h-8 w-8 text-sky-400" />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                                    <p className="text-sm text-slate-300">Sales this week</p>
                                    <p className="mt-2 text-2xl font-semibold">$24.8K</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                                    <p className="text-sm text-slate-300">Inventory health</p>
                                    <p className="mt-2 text-2xl font-semibold">94%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-slate-900/70 text-white shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                Quick actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                <Activity className="h-4 w-4" />
                                Live activity synced in real time
                            </div>
                            <Link href="/dashboard" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition hover:bg-white/20">
                                <span>Open reports</span>
                                <span className="text-sm text-slate-300">→</span>
                            </Link>
                            <Link href="/dashboard" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition hover:bg-white/20">
                                <span>Manage invoices</span>
                                <span className="text-sm text-slate-300">→</span>
                            </Link>
                            <Link href="/dashboard" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition hover:bg-white/20">
                                <span>Review inventory</span>
                                <span className="text-sm text-slate-300">→</span>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
