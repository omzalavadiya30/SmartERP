const { readFileSync, writeFileSync } = require("node:fs");
const { randomBytes } = require("node:crypto");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
try {
  const template = readFileSync(path.join(root, ".env.example"), "utf8");
  const settings = template.replace(
    /^JWT_SECRET=(?=\r?$)/m,
    "JWT_SECRET=" + randomBytes(48).toString("hex"),
  );
  writeFileSync(path.join(root, ".env"), settings, { flag: "wx", mode: 0o600 });
  console.log("Created local development settings.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
const { migrate, close } = require("./db");
migrate()
  .then(() => console.log("Database ready."))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(close);
