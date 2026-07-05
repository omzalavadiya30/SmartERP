/**
 * ---------------------------------------------------------
 * Password Utility
 * ---------------------------------------------------------
 * Hashes and compares passwords using bcrypt.
 * ---------------------------------------------------------
 */
const bcrypt= require("bcryptjs")
const SALT_ROUNDS = 10;

/**
 * Hash Password
 *
 * @param {String} password
 * @returns {Promise<String>}
 */
const hashPassword= async(password) => {
    return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare Password
 *
 * @param {String} password
 * @param {String} hashedPassword
 * @returns {Promise<Boolean>}
 */
const comparePassword= async(password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword)
}

module.exports= { hashPassword, comparePassword }