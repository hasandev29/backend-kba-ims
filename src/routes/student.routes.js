// src/routes/student.routes.js

"use strict";

const express = require("express");
const router  = express.Router();

const auth     = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");

const { createStudentSchema, patchStudentSchema, bulkCreateStudentsSchema, bulkUpdateStudentsSchema } = require("../middlewares/validators/student.validator");

const { create, getById, getAll, getStudentsList, patchStudent, bulkCreate, bulkUpdate } = require("../controllers/student.controller");

// NOTE: /list and /bulk must be registered before /:id, otherwise Express
// will match "list"/"bulk" as an :id param on the dynamic route below.
router.post("/", auth("superadmin", "admin", "dev"), validate(createStudentSchema), create);

router.post("/bulk", auth("superadmin", "admin", "dev"), validate(bulkCreateStudentsSchema), bulkCreate);

router.get("/list", auth("superadmin", "admin", "staff", "dev"), getStudentsList);

// ---------------------------------------------------------------------------
// Single PATCH endpoint — the frontend sends only the section(s)/key(s)
// that actually changed, e.g. { family_details: {...} } or
// { personal_details: {...}, address: [...] }. Registered before "/:id"'s
// sibling GET is fine either way since methods differ, but kept here for
// consistency with the rest of the file's ordering.
// ---------------------------------------------------------------------------
router.patch("/bulk", auth("superadmin", "admin", "dev"), validate(bulkUpdateStudentsSchema), bulkUpdate);

router.patch("/:id", auth("superadmin", "admin", "dev"), validate(patchStudentSchema), patchStudent);

router.get("/:id", auth("superadmin", "admin", "staff", "dev"), getById);
router.get("/",    auth("superadmin", "admin", "staff", "dev"), getAll);

module.exports = router;