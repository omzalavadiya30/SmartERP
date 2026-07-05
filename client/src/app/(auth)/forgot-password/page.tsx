"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import LoadingButton from "@/components/auth/LoadingButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/auth.schema";
import authService from "@/services/auth.service";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (values: ForgotPasswordFormData) => {
        setLoading(true);
        try {
            const result = await authService.forgotPassword(values);
            toast.success(result.message || "If an account exists, reset instructions have been prepared.");
            setSubmitted(true);
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "We could not process your request right now.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6">
                <AuthHeader title="Recover access" subtitle="Enter your email and we’ll guide you through a secure password reset." />

                <Card className="border-border/60 shadow-xl">
                    <CardContent className="pt-6">
                        {submitted ? (
                            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <div className="flex items-center gap-2">
                                    <MailCheck className="h-4 w-4" />
                                    <span>If the email is registered, you’ll be able to continue with the reset flow.</span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
                                    {form.formState.errors.email ? (
                                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                                    ) : null}
                                </div>

                                <LoadingButton loading={loading} text="Send reset instructions" loadingText="Preparing reset..." />
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    Remembered your password? <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
