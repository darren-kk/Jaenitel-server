const express = require("express");

const authController = require("../controllers/auth.controller");
const validateSignup = require("../middlewares/validateSignup");
const validateLogin = require("../middlewares/validateLogin");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/signup", validateSignup, authController.signup);
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
