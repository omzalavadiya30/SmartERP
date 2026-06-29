const express = require("express");
const { successResponse } = require("../utils/response");

const router = express.Router();

/**
 * @route   GET /api
 * @desc    Health check endpoint
 * @access  Public
 *
 * This endpoint is used to verify that the backend
 * server is running and responding correctly.
 */
router.get("/", (req, res) => {
    return successResponse(res, "SmartERP Backend Running Successfully")
});

module.exports = router;