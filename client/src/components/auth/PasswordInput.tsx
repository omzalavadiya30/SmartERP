"use client";

/**
 * ==========================================================
 * Password Input Component
 * ==========================================================
 * Features:
 * - Show / Hide Password
 * - React Hook Form Compatible
 * - Forward Ref Support
 * - Accessible
 * - Reusable Across Forms
 * ==========================================================
 */

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="relative">
            <Input ref={ref} type={showPassword ? "text" : "password"} className={cn("pr-12", className)} disabled={disabled} autoComplete="current-password" {...props} />

            <Button type="button" variant="ghost" size="icon" onClick={togglePasswordVisibility} disabled={disabled} tabIndex={-1} className="absolute right-1 top-1 h-8 w-8 rounded-md" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
            </Button>
        </div>
    );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;