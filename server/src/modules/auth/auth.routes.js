const express = require("express");
const router = express.Router();
const validate = require("../../middleware/validate.middleware");
const { authenticate} = require("../../middleware/auth.middlewarer");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("./auth.validation");
const { register, login, forgotPassword, resetPassword, logout, getCurrentUser } = require("./auth.controller");

router.get("/me", authenticate, getCurrentUser);

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

router.post("/register", validate(registerSchema), register);

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

router.post("/login", validate(loginSchema), login);

/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

router.post("/logout", logout);

module.exports = router;