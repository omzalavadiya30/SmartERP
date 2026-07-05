/**
 * ------------------------------------------------------------
 * Authentication Validation Schemas
 * ------------------------------------------------------------
 */

import { z } from "zod";

/**
 * Register
 */
export const registerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(50, "Name cannot exceed 50 characters."),
    email: z.string().min(1, "Email is required").pipe(z.email("Invalid email address")),
    password: z.string().min(8, "Password must be at least 8 characters.").regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must contain at least one letter and one number."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

/**
 * Login
 */
export const loginSchema = z.object({
    email: z.string().min(1, "Email is required").pipe(z.email("Invalid email address")),
    password: z.string().min(1, "Password is required."),
});

/**
 * Forgot Password
 */
export const forgotPasswordSchema = z.object({
    email: z.string().min(1, "Email is required").pipe(z.email("Invalid email address")),
});

/**
 * Reset Password
 */
export const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

/**
 * Export Types
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;