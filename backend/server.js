const app = require("./app");
const config = require("./config/config");

app.listen(config.PORT, () => {

    console.log("========================================");
    console.log("🚀 CloudNetOps Backend Started");
    console.log(`🌐 URL : http://localhost:${config.PORT}`);
    console.log(`📦 Environment : ${config.NODE_ENV}`);
    console.log("========================================");

});