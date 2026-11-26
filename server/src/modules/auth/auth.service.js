const crypto = require("crypto");
const authRepository = require("./auth.repository");
const { hashPassword, comparePassword } = require("../../utils/password");
const { generateToken } = require("../../utils/jwt");
const { AppError } = require("../../utils/errors");
const { sendPasswordResetEmail } = require("../../services/email.service");

/*
|--------------------------------------------------------------------------
| Register User
|--------------------------------------------------------------------------
*/

const registerUser = async (userData) => {
    const existingUser = await authRepository.findUserByEmail(userData.email);
    if (existingUser) {
        throw new AppError("Email is already registered.", 409);
    }

    const hashedPassword = await hashPassword(userData.password);
    const user = await authRepository.createUser({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
    });

    const token = generateToken({ id: user.id, version:user.token_version, jti:crypto.randomUUID() });
    delete user.password;
    delete user.password_reset_token;
    delete user.password_reset_expires_at;
    return { user, token };
};

/*
|--------------------------------------------------------------------------
| Login User
|--------------------------------------------------------------------------
*/

const loginUser = async ({ email, password }) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
        throw new AppError("Invalid email or password.", 401);
    }

    const isPasswordMatched = await comparePassword(password, user.password);

    if (!isPasswordMatched) {
        throw new AppError("Invalid email or password.", 401);
    }

    const token = generateToken({ id: user.id, version:user.token_version, jti:crypto.randomUUID() });
    delete user.password;
    delete user.password_reset_token;
    delete user.password_reset_expires_at;
    return { user, token };
};

/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/

const forgotPassword = async ({ email }) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
        return {
            message: "If an account exists for this email, password reset instructions have been requested.",
        };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await authRepository.updateUser(user.id, {
        password_reset_token: crypto.createHash("sha256").update(resetToken).digest("hex"),
        password_reset_expires_at: expiresAt,
    });

    try {
        await sendPasswordResetEmail({
            to: user.email,
            resetToken,
            userName: user.name || user.email,
        });
    } catch (emailError) {
        console.error("Password reset email failed:", emailError);
    }

    return {
        message: "If an account exists for this email, password reset instructions have been requested.",
    };
};

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

const resetPassword = async ({ token, password }) => {
    const user = await authRepository.findUserByResetToken(crypto.createHash("sha256").update(token).digest("hex"));
    if (!user || !user.password_reset_token || !user.password_reset_expires_at) {
        throw new AppError("Invalid or expired reset token.", 400);
    }

    const expiresAt = new Date(user.password_reset_expires_at);
    if (expiresAt < new Date()) {
        throw new AppError("Reset token has expired.", 400);
    }

    const hashedPassword = await hashPassword(password);
    const changed=await authRepository.resetCredential(user.password_reset_token,hashedPassword);
    if(!changed) throw new AppError("Invalid or expired reset token.",400);

    return {
        message: "Password reset successful. You can sign in with your new password.",
    };
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };