/**
 * ---------------------------------------------------------
 * Authentication Middleware
 * ---------------------------------------------------------
 * Verifies JWT token and attaches the authenticated
 * user to the request object.
 * ---------------------------------------------------------
 */

const { verifyToken } = require("../utils/jwt");
const { AppError } = require("../utils/errors");
const { findUserById } = require("../modules/auth/auth.repository");

/**
 * Verify JWT Authentication
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError("Authorization header is missing.", 401);
        }

        if (!authHeader.startsWith("Bearer ")) {
            throw new AppError("Invalid authorization format.", 401);
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new AppError("Authentication token is required.", 401);
        }

        const decoded = verifyToken(token);
        const user = await findUserById(decoded.id,decoded.jti,decoded.version ?? 0);

        if (!user) {
            throw new AppError("User not found.", 401);
        }

        // Never expose password
        delete user.password;
        req.user = user;
        req.session = decoded;

        next();
    } catch (error) {
        next(["TokenExpiredError","JsonWebTokenError"].includes(error.name)?new AppError("Please sign in again.",401):error);
    }
};

module.exports = { authenticate };