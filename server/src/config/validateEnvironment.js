const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require("./constant");

/**
 * List of required environment variables.
 *
 * Each object contains:
 * - name  : Environment variable name
 * - value : Current value loaded from the .env file
 */
const requiredVariables = [
    {
        name: "SUPABASE_URL",
        value: SUPABASE_URL
    },
    {
        name: "SUPABASE_SERVICE_ROLE_KEY",
        value: SUPABASE_SERVICE_ROLE_KEY
    }
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
        console.error("\nMissing Environment Variables\n");
        console.table(missingVariables);
        process.exit(1);
    }
    console.log("✅ Environment Variables Loaded Successfully");
}

module.exports= validateEnvironment