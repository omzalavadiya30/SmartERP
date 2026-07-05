/**
 * ------------------------------------------------------------
 * Authentication Service
 * ------------------------------------------------------------
 * Handles all authentication API requests.
 * ------------------------------------------------------------
 */

import api from "@/lib/axios";

import { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload, LoginResponse, AuthResponse } from "@/types/auth";

/**
 * Register
 */
const register = async (payload: RegisterPayload): Promise<LoginResponse> => {
    const response = await api.post("/auth/register", payload);
    return response.data.data ?? response.data;
};

/**
 * Login
 */
const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", payload);
    return response.data.data ?? response.data;
};

/**
 * Forgot Password
 */
const forgotPassword = async (payload: ForgotPasswordPayload) => {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data.data ?? response.data;
};

/**
 * Reset Password
 */
const resetPassword = async (payload: ResetPasswordPayload) => {
    const response = await api.post("/auth/reset-password", payload);
    return response.data.data ?? response.data;
};

/**
 * Current Logged-in User
 */
const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data.data ?? response.data;
};

/**
 * Logout
 */
const logout = async () => {
    const response = await api.post("/auth/logout");
    return response.data;
};

const authService = { register, login, forgotPassword, resetPassword, getCurrentUser, logout };

export default authService;