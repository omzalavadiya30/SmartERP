const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/common.middleware.js");
const { FRONTEND_URL } = require("./config/constant");

// Create an Express application
const app = express();

/* ===========================
   Global Middlewares
   =========================== */

// Enable Cross-Origin Resource Sharing (CORS)
// Allows the frontend to communicate with the backend.
app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Adds various HTTP security headers to protect the application
// from common web vulnerabilities.
app.use(helmet());

// Parse incoming JSON requests
// Example:
// {
//   "name": "Om",
//   "email": "om@example.com"
// }
app.use(express.json());

// Parse URL-encoded form data
// Used when submitting data through HTML forms.
app.use(express.urlencoded({ extended: true }));

// Parse cookies attached to incoming requests
// Useful for authentication, sessions, and JWT stored in cookies.
app.use(cookieParser());

// Log every HTTP request in the terminal
// Example:
// GET /api/users 200 15ms
app.use(morgan("dev"));

/* ===========================
   Health Check Route
   =========================== */

// Default route to verify that the backend server is running.
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to SmartERP Backend API"
    });
});

/* ===========================
   API Routes
   =========================== */

// All application routes will be prefixed with "/api"
// Example:
// /api/auth/login
// /api/auth/register
// /api/users
// /api/products
app.use("/api", routes);

// Handle requests for undefined routes
app.use(notFound);

// Global Error Handler (Always keep this last)
app.use(errorHandler);

module.exports = app;