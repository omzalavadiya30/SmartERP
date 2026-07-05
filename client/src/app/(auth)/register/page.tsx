"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import LoadingButton from "@/components/auth/LoadingButton";
import PasswordInput from "@/components/auth/PasswordInput";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import { registerSchema, type RegisterFormData } from "@/schemas/auth.schema";
import authService from "@/services/auth.service";

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuthContext();
    const [loading, setLoading] = useState(false);

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: RegisterFormData) => {
        setLoading(true);
        try {
            const result = await authService.register({
                name: values.name,
                email: values.email,
                password: values.password,
            });
            login(result.token, result.user, false);
            toast.success("Account created successfully. Welcome to Smart ERP.");
            router.push("/login");
        } catch (error: unknown) {
            const message =(error as { response?: { data?: { message?: string } } })?.response?.data?.message || "We could not create your account right now.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6">
                <div className="rounded-2xl border border-violet-200/70 bg-linear-to-r from-violet-50 to-fuchsia-50 p-4 shadow-sm dark:border-violet-900/60 dark:from-violet-950/60 dark:to-fuchsia-950/60">
                    <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                        <Sparkles className="h-4 w-4" />
                        Launch your next-level workflow
                    </div>
                </div>

                <AuthHeader title="Create your account" subtitle="Launch your ERP workspace with a polished, secure setup." />

                <Card className="border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <CardContent className="pt-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input id="name" placeholder="Alex Morgan" {...form.register("name")} />
                                {form.formState.errors.name ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" placeholder="alex@company.com" {...form.register("email")} />
                                {form.formState.errors.email ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput id="password" placeholder="Create a strong password" {...form.register("password")} />
                                {form.formState.errors.password ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <PasswordInput id="confirmPassword" placeholder="Re-enter password" {...form.register("confirmPassword")} />
                                {form.formState.errors.confirmPassword ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                                ) : null}
                            </div>

                            <LoadingButton loading={loading} text="Create account" loadingText="Creating account..." />
                        </form>
                    </CardContent>
                </Card>

                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground shadow-sm">
                    <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                        <span>Everything from billing to inventory is ready to be managed from one place.</span>
                    </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
