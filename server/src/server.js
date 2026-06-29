const app= require('./app');
const { PORT } = require('./config/constant');
const validateEnvironment= require("./config/validateEnvironment")
validateEnvironment();

app.listen(PORT, () => {
    console.log(`
        =========================================
        🚀 SmartERP Backend Started Successfully
        🌐 http://localhost:${PORT}
        =========================================`)
});