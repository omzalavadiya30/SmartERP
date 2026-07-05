/**
 * ---------------------------------------------------------
 * JWT Utility
 * ---------------------------------------------------------
 * Handles JWT token generation and verification.
 * ---------------------------------------------------------
 */
const jwt= require("jsonwebtoken")
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/constant")

/**
 * Generate Access Token
 *
 * @param {Object} payload
 * @returns {String}
 */
const generateToken= (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify JWT Token
 *
 * @param {String} token
 * @returns {Object}
 */
const verifyToken= (token) => {
    return jwt.verify(token, JWT_SECRET)
}

module.exports= { generateToken, verifyToken }