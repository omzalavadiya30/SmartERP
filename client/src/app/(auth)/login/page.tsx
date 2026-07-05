"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import LoadingButton from "@/components/auth/LoadingButton";
import PasswordInput from "@/components/auth/PasswordInput";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import authService from "@/services/auth.service";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthContext();
    const [loading, setLoading] = useState(false);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormData) => {
        setLoading(true);
        try {
            const result = await authService.login(values);
            login(result.token, result.user, false);
            toast.success("Welcome back! Your workspace is ready.");
            router.push("/dashboard");
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Unable to sign in right now. Please try again.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6">
                <div className="rounded-2xl border border-sky-200/70 bg-linear-to-r from-sky-50 to-indigo-50 p-4 shadow-sm dark:border-sky-900/60 dark:from-sky-950/60 dark:to-indigo-950/60">
                    <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
                        <Sparkles className="h-4 w-4" />
                        Premium business access
                    </div>
                </div>

                <AuthHeader title="Welcome back" subtitle="Sign in to resume your Smart ERP workflow." />

                <Card className="border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <CardContent className="pt-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
                                {form.formState.errors.email ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput id="password" placeholder="Enter your password" {...form.register("password")} />
                                {form.formState.errors.password ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                                ) : null}
                            </div>
                            <div className="flex items-center justify-end">
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <LoadingButton loading={loading} text="Sign in" loadingText="Signing in..." />
                        </form>
                    </CardContent>
                </Card>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4" />
                        <span>Secure, fast access for finance, inventory, CRM, and reporting teams.</span>
                    </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Don't have an account? <Link href="/register" className="font-semibold text-primary hover:underline">Register</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
