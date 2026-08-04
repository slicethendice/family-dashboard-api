const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Ensure you have a User model

router.get("/user", (req, res) => {
  console.log("Authenticated:", req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.json({ id: req.user.id, name: req.user.name, email: req.user.email });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

module.exports = router;
