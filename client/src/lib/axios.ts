/**
 * ------------------------------------------------------------
 * Axios Configuration
 * ------------------------------------------------------------
 * This file creates a reusable Axios instance for the entire
 * application.
 *
 * Features:
 * - Base URL
 * - JSON Requests
 * - Timeout
 * - JWT Token Attachment
 * - Response Error Handling
 * ------------------------------------------------------------
 */

import axios from "axios";
import Cookies from "js-cookie";

/**
 * Create Axios Instance
 */
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * ------------------------------------------------------------
 * Request Interceptor
 * ------------------------------------------------------------
 * Automatically attaches JWT token (if available)
 * to every authenticated request.
 * ------------------------------------------------------------
 */
api.interceptors.request.use((config) => {
    const token = Cookies.get("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => Promise.reject(error));

/**
 * ------------------------------------------------------------
 * Response Interceptor
 * ------------------------------------------------------------
 * Handles global API errors.
 * Later we'll redirect to login automatically if
 * the token expires.
 * ------------------------------------------------------------
 */
api.interceptors.response.use((response) => response, (error) => {
    return Promise.reject(error);
});

export default api;