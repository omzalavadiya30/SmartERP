/**
 * ------------------------------------------------------------
 * Authentication Types
 * ------------------------------------------------------------
 */

/**
 * User
 */
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

/**
 * Login Request
 */
export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register Request
 */
export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

/**
 * Forgot Password
 */
export interface ForgotPasswordPayload {
    email: string;
}

/**
 * Reset Password
 */
export interface ResetPasswordPayload {
    token: string;
    password: string;
}

/**
 * Authentication Response
 */
export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}

/**
 * API Response
 */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/**
 * Login Response
 */
export interface LoginResponse {
    token: string;
    user: User;
}