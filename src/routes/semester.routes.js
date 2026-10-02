// src/routes/semester.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createSemesterSchema,
  updateSemesterSchema,
  getSemestersQuerySchema,
} = require("../middlewares/validators/semester.validator");
const { create, getById, getAll, update } = require("../controllers/semester.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createSemesterSchema),        create);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateSemesterSchema),        update);
router.get("/:id",   auth("dev", "superadmin", "admin", "staff"),                                       getById);
router.get("/",      auth("dev", "superadmin", "admin", "staff"), validate(getSemestersQuerySchema, "query"), getAll);

module.exports = router;