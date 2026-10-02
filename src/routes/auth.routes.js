// src/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const {
  login, register, logout, me
} = require("../controllers/auth.controller");

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/me", me);

module.exports = router;