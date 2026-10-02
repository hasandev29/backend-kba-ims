// src/routes/academicYear.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  getAcademicYearsQuerySchema,
} = require("../middlewares/validators/academicYear.validator");
const { create, getById, getAll, update } = require("../controllers/academicYear.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createAcademicYearSchema),        create);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateAcademicYearSchema),        update);
router.get("/:id",   auth("dev", "superadmin", "admin", "staff"),                                           getById);
router.get("/",      auth("dev", "superadmin", "admin", "staff"), validate(getAcademicYearsQuerySchema, "query"), getAll);

module.exports = router;