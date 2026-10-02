// src/routes/additionalClass.routes.js
"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createAdditionalClassSchema,
  createAdditionalClassWithAttendanceSchema,
  updateAdditionalClassSchema,
  getAdditionalClassesQuerySchema,
  additionalClassIdParamsSchema,
} = require("../middlewares/validators/additionalClass.validator");
const {
  create,
  createWithAttendance,
  getAll,
  getById,
  update,
  remove,
} = require("../controllers/additionalClass.controller");

const ROLES = ["dev", "superadmin", "admin", "staff"];
const DELETE_ROLES = ["dev", "superadmin", "admin"]; // adjust if staff may delete too

// POST /api/additional-classes
router.post("/", auth(...ROLES), validate(createAdditionalClassSchema), create);

// POST /api/additional-classes/with-attendance
router.post(
  "/with-attendance",
  auth(...ROLES),
  validate(createAdditionalClassWithAttendanceSchema),
  createWithAttendance
);

// GET /api/additional-classes?page=&limit=&academic_term_id=&classroom_id=
//     &subject_id=&staff_id=&class_type=&status=&date_from=&date_to=&q=
router.get("/", auth(...ROLES), validate(getAdditionalClassesQuerySchema, "query"), getAll);

// GET /api/additional-classes/:id  (keep below any static GET paths)
router.get("/:id", auth(...ROLES), validate(additionalClassIdParamsSchema, "params"), getById);

// PATCH /api/additional-classes/:id
router.patch(
  "/:id",
  auth(...ROLES),
  validate(additionalClassIdParamsSchema, "params"),
  validate(updateAdditionalClassSchema),
  update
);

// DELETE /api/additional-classes/:id
router.delete("/:id", auth(...DELETE_ROLES), validate(additionalClassIdParamsSchema, "params"), remove);

module.exports = router;

// Mount in app.js:
//   app.use("/api/additional-classes", require("./routes/additionalClass.routes"));