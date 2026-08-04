require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const routes = require("./routes");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
require("./config/passport");

const app = express();

const startServer = async () => {
  try {
    await connectDB();

    const mongoStore = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      autoRemove: "disabled",
    });

    app.use(cors({ origin: true, credentials: true }));
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(
      session({
        secret: process.env.SESSION_SECRET || "default-secret",
        resave: false,
        saveUninitialized: false,
        store: mongoStore,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 14 * 24 * 60 * 60 * 1000,
        },
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    app.use("/api", routes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();
