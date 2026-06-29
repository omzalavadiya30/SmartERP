const dotenv= require('dotenv')
dotenv.config()

const PORT= process.env.PORT || 5000;
const SUPABASE_URL= process.env.SUPABASE_URL;
const NODE_ENV= process.env.NODE_ENV;
const SUPABASE_SERVICE_ROLE_KEY= process.env.SUPABASE_SERVICE_ROLE_KEY
const HTTP_STATUS= {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500 
}

module.exports= { PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NODE_ENV, HTTP_STATUS }