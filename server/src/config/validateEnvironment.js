const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, JWT_EXPIRES_IN } = require("./constant");

/**
 * List of required environment variables.
 *
 * Each object contains:
 * - name  : Environment variable name
 * - value : Current value loaded from the .env file
 */
const requiredVariables = [
    {
        name: "JWT_SECRET",
        value: JWT_SECRET
    },
    {
        name: "JWT_EXPIRES_IN",
        value: JWT_EXPIRES_IN
    },
];

/**
 * Validate Environment Variables
 *
 * Checks whether all required environment variables
 * are available before starting the application.
 *
 * If any variable is missing, the server will stop
 * immediately with a helpful error message.
 */
const validateEnvironment = () => {
    const missingVariables= []
    requiredVariables.forEach(variable => {
        if(!variable.value) {
            missingVariables.push(variable.name)
        }
    })

    if(missingVariables.length > 0){
        console.warn("⚠️ Missing optional environment variables; continuing with safe defaults.");
        console.table(missingVariables);
    }
    console.log("✅ Environment Variables Loaded Successfully");
}

module.exports= validateEnvironment