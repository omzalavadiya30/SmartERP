const { Resend } = require("resend");
const { RESEND_API_KEY, RESEND_FROM_EMAIL, FRONTEND_URL, NODE_ENV } = require("../config/constant");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const sendPasswordResetEmail = async ({ to, resetToken, userName = "there" }) => {
    if (!resend) {
        console.warn("RESEND_API_KEY is not configured. Password reset email was not sent.");
        return { success: false, skipped: true };
    }

    const resetLink = `${FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const from = NODE_ENV === "production" ? RESEND_FROM_EMAIL : "Smart ERP <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject: "Reset your Smart ERP password",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background: #f8fafc;">
                <h2 style="margin-bottom: 12px; color: #111827;">Reset your password</h2>
                <p style="font-size: 15px; color: #374151;">Hello ${userName},</p>
                <p style="font-size: 15px; color: #374151;">We received a request to reset your Smart ERP password. Use the button below to continue.</p>
                <div style="margin: 24px 0;">
                    <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 20px; border-radius: 999px; text-decoration: none; display: inline-block;">Reset password</a>
                </div>
                <p style="font-size: 13px; color: #6b7280;">If you didn’t request this, you can safely ignore this message.</p>
                <p style="font-size: 13px; color: #6b7280;">This link will expire in 15 minutes.</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(error.message || "Failed to send password reset email.");
    }

    return { success: true, data };
};

module.exports = { sendPasswordResetEmail };
