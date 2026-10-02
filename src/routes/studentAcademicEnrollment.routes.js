// src/routes/studentAcademicEnrollment.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  getEnrollmentsQuerySchema,
  bulkPromoteStudentsSchema
} = require("../middlewares/validators/studentAcademicEnrollment.validator");
const { create, getById, getAll, update, bulkPromote } = require("../controllers/studentAcademicEnrollment.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createEnrollmentSchema),        create);

// Must come BEFORE "/:id" — otherwise Express matches "promote" as an :id param
// and this request gets validated/handled by the update route instead.
router.patch("/promote", auth("superadmin", "admin", "dev"), validate(bulkPromoteStudentsSchema), bulkPromote);

router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateEnrollmentSchema),        update);
router.get("/:id",   auth("dev", "superadmin", "admin", "staff"),                                         getById);
router.get("/",      auth("dev", "superadmin", "admin", "staff"), validate(getEnrollmentsQuerySchema, "query"), getAll);

module.exports = router;