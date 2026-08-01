const isAdmin = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Home
router.get("/", authController.homePage);

// Login
router.get("/login", authController.loginPage);
router.post("/login", authController.login);

// Dashboard
router.get("/dashboard", isAdmin, authController.dashboard);

// Logout
router.get("/logout", authController.logout);

module.exports = router;