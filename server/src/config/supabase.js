/**
 * ---------------------------------------------------------
 * Supabase Configuration
 * ---------------------------------------------------------
 * Creates a single reusable Supabase client for the
 * entire application.
 * ---------------------------------------------------------
 */
const { createClient } = require("@supabase/supabase-js")
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require("./constant")

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing.");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
}

/**
 * Create Supabase Client
 */
const supabase= createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
module.exports= supabase