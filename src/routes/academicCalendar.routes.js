// src/routes/academicCalendar.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createAcademicCalendarSchema,
  updateAcademicCalendarSchema,
  getAcademicCalendarQuerySchema,
} = require("../middlewares/validators/academicCalendar.validator");
const { create, getById, getAll, update } = require("../controllers/academicCalendar.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createAcademicCalendarSchema),        create);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateAcademicCalendarSchema),        update);
router.get("/:id",   auth("dev", "superadmin", "admin", "staff"),                                               getById);
router.get("/",      auth("dev", "superadmin", "admin", "staff"), validate(getAcademicCalendarQuerySchema, "query"), getAll);

module.exports = router;