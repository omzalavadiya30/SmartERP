const express = require("express");
const router = express.Router();
const healthRoutes = require("./health.routes");

/* ===================================
   Route Registration
   =================================== */

// Health Check Routes
// Base URL: /api/health
router.use("/health", healthRoutes);

module.exports = router;