const express = require("express");
const passport = require("passport");

const router = express.Router();
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:8080";

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "consent",
  })
);

const handleGoogleCallback = [
  passport.authenticate("google", {
    failureRedirect: `${clientOrigin}/settings?auth=failed`,
  }),
  (req, res, next) => {
    req.session.save((error) => {
      if (error) {
        return next(error);
      }
      res.redirect(`${clientOrigin}/calendar`);
    });
  },
];

router.get("/google/callback", ...handleGoogleCallback);
// Preserve the original callback while local Google settings are migrated.
router.get("/oauth/callback", ...handleGoogleCallback);

router.get("/user", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) {
      return next(logoutError);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      res.json({ authenticated: false });
    });
  });
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }

  return res.status(401).json({ authenticated: false });
};

module.exports = {
  router,
  ensureAuthenticated,
};
