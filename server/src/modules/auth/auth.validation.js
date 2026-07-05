const { z } = require("zod");

/*
|--------------------------------------------------------------------------
| Register Validation Schema
|--------------------------------------------------------------------------
*/

const registerSchema = z.object({
    name: z.string().trim().min(3, "Name must contain at least 3 characters.").max(100, "Name cannot exceed 100 characters."),
    email: z.email("Please enter a valid email address.").transform((value) => value.toLowerCase()),
    password: z.string().min(6, "Password must contain at least 6 characters.").max(100, "Password cannot exceed 100 characters."),
});

/*
|--------------------------------------------------------------------------
| Login Validation Schema
|--------------------------------------------------------------------------
*/

const loginSchema = z.object({
    email: z.email("Please enter a valid email address.").transform((value) => value.toLowerCase()),
    password: z.string().min(6, "Password is required."),
});

/*
|--------------------------------------------------------------------------
| Forgot Password Validation Schema
|--------------------------------------------------------------------------
*/

const forgotPasswordSchema = z.object({
    email: z.email("Please enter a valid email address.").transform((value) => value.toLowerCase()),
});

/*
|--------------------------------------------------------------------------
| Reset Password Validation Schema
|--------------------------------------------------------------------------
*/

const resetPasswordSchema = z.object({
    token: z.string().trim().min(1, "Reset token is required."),
    password: z.string().min(6, "Password must contain at least 6 characters.").max(100, "Password cannot exceed 100 characters."),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };