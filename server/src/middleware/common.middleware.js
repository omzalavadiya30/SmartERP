const { errorResponse } = require("../utils/response")

/**
 * Async Handler
 *
 * Wraps asynchronous controller functions and automatically
 * forwards any errors to the global error handling middleware.
 *
 * This eliminates the need for repetitive try...catch blocks
 * in every controller.
 */
const asyncHandler= (controller) => {
    return (req, res, next) => {
        Promise.resolve(controller(req, res, next)).catch(next)
    }
}

/**
 * 404 Not Found Middleware
 *
 * This middleware handles requests made to routes
 * that do not exist in the application.
 *
 * It should be registered after all valid routes
 * and before the global error handler.
 */
const notFound= (req, res) => {
    return errorResponse(res, "Route Not Found", 404)
}

/**
 * Global Error Handling Middleware
 *
 * This middleware catches all errors that occur in the application
 * and sends a standardized JSON response to the client.
 *
 * It should be registered as the last middleware in app.js.
 */
const errorHandler = (err, req, res, next) => {
    console.error(err);
    return errorResponse(res, err.message || "Internal Server Error", err.status || 500)
};

module.exports= {asyncHandler, errorHandler, notFound }