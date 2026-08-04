const express = require("express");
const passport = require("passport");
const router = express.Router();

// Redirect to Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "consent",
  })
);

// Handle Google OAuth callback
router.get(
  "/oauth/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    req.session.user = req.user; // Store user info in session
    req.session.save(() => {
      res.redirect("http://localhost:8080/"); // Redirect to the frontend
    });
  }
);

// Ensure the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  } else {
    res.status(401).json({ authenticated: false });
  }
};

router.get("/user", ensureAuthenticated, (req, res) => {
  res.json({
    authenticated: true,
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  });
});

module.exports = {
  router,
  ensureAuthenticated,
};
