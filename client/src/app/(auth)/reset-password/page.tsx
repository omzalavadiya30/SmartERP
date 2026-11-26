"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import AuthHeader from "@/components/auth/AuthHeader";
import LoadingButton from "@/components/auth/LoadingButton";
import PasswordInput from "@/components/auth/PasswordInput";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/schemas/auth.schema";
import authService from "@/services/auth.service";

export default function ResetPasswordPage() {
    return <Suspense fallback={<p>Loading reset form…</p>}><ResetForm /></Suspense>;
}

function ResetForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [loading, setLoading] = useState(false);

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: ResetPasswordFormData) => {
        if (!token) {
            toast.error("The reset token is missing. Please return to the reset request and try again.");
            return;
        }

        setLoading(true);
        try {
            const result = await authService.resetPassword({
                token,
                password: values.password,
            });
            toast.success(result.message || "Your password has been updated successfully.");
            router.push("/login");
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "The reset link is invalid or has expired.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-6">
                <AuthHeader title="Set a new password" subtitle="Choose a new password to regain access to your account." />

                <Card className="border-border/60 shadow-xl">
                    <CardContent className="pt-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="password">New password</Label>
                                <PasswordInput id="password" placeholder="Enter a new password" {...form.register("password")} />
                                {form.formState.errors.password ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <PasswordInput id="confirmPassword" placeholder="Confirm your new password" {...form.register("confirmPassword")} />
                                {form.formState.errors.confirmPassword ? (
                                    <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                                ) : null}
                            </div>

                            <LoadingButton loading={loading} text="Reset password" loadingText="Updating password..." />
                        </form>
                    </CardContent>
                </Card>

                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span>Your password will be updated immediately after confirmation.</span>
                    </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Back to <Link href="/login" className="font-semibold text-primary hover:underline">sign in</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
