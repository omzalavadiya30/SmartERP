const { asyncHandler } = require("../../middleware/common.middleware");
const authService = require("./auth.service");
const { successResponse } = require("../../utils/response");
const { AppError } = require("../../utils/errors");

const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
};

const clearAuthCookie = (res) => {
    res.clearCookie("token");
};

/*
|--------------------------------------------------------------------------
| Register User
|--------------------------------------------------------------------------
*/

const register = asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body);
    setAuthCookie(res, result.token);
    return successResponse(res, "User registered successfully.", result, 201);
});

/*
|--------------------------------------------------------------------------
| Login User
|--------------------------------------------------------------------------
*/

const login = asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body);
    setAuthCookie(res, result.token);
    return successResponse(res, "Login successful.", result);
});

/**
 * ---------------------------------------------------------
 * Get Current User
 * ---------------------------------------------------------
 */

const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError("User not authenticated.", 401);
        }
        return successResponse(res, "User fetched successfully.", req.user);
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/

const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    return successResponse(res, result.message, result);
});

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

const resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    return successResponse(res, result.message, result);
});

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const logout = asyncHandler(async (req, res) => {
    clearAuthCookie(res);
    return successResponse(res, "Logout successful.");
});

module.exports = { register, login, getCurrentUser, forgotPassword, resetPassword, logout };