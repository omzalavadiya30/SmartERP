const express = require("express");
const router = express.Router();
const healthRoutes = require("./health.routes");
const authRoutes= require("../modules/auth")

/* ===================================
   Route Registration
   =================================== */

// Health Check Routes
// Base URL: /api/health
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

module.exports = router;