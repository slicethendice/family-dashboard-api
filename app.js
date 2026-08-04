require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const routes = require("./routes");
const connectDB = require("./config/database");

const app = express();
const requiredEnvironmentVariables = [
  "MONGO_URI",
  "GOOGLE_APPLICATION_CREDENTIALS",
];

function validateEnvironment() {
  const missing = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
  );

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

function getAllowedOrigins() {
  return (process.env.CLIENT_ORIGIN || "http://localhost:8080")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function configureApp() {
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
      },
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    res.status(databaseConnected ? 200 : 503).json({
      status: databaseConnected ? "ok" : "degraded",
      database: databaseConnected ? "connected" : "disconnected",
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  app.use("/api", routes);
}

async function startServer() {
  validateEnvironment();
  configureApp();
  await connectDB();

  const port = Number(process.env.PORT) || 3000;
  return app.listen(port, () => {
    console.log(`Family Dashboard API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start Family Dashboard API:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer, validateEnvironment };
