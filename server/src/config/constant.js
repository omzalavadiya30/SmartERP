const dotenv= require('dotenv')
dotenv.config()

const PORT= process.env.PORT || 5000;
const NODE_ENV= process.env.NODE_ENV;
const JWT_SECRET= process.env.JWT_SECRET;
const JWT_EXPIRES_IN= process.env.JWT_EXPIRES_IN || "7d"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const HTTP_STATUS= {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500 
}

module.exports= { PORT, NODE_ENV, HTTP_STATUS, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL, RESEND_API_KEY, RESEND_FROM_EMAIL }