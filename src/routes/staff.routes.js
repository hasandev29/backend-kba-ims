// =============================================================================
// staff.routes.js
// =============================================================================

"use strict";

const express = require("express");
const router  = express.Router();

const auth     = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");

const { createStaffSchema, patchStaffSchema, bulkUpdateStaffSchema } = require("../middlewares/validators/staff.validator");

const { create, getById, getAll, getStaffList, patchStaff, bulkUpdate } = require("../controllers/staff.controller");
// NOTE: /list must be registered before /:id, otherwise Express will match
// "list" as an :id param on the dynamic route below.
router.post("/", auth("superadmin", "admin", "dev"), validate(createStaffSchema), create);

// router.get("/list", auth("superadmin", "admin", "dev"), getStaffList);
router.get("/list", auth("superadmin", "admin", "dev"), getStaffList);

// ---------------------------------------------------------------------------
// Single PATCH endpoint — the frontend sends only the section(s)/key(s)
// that actually changed, e.g. { employment_details: {...} } or
// { personal_details: {...}, address: [...] }. Registered before "/:id"'s
// sibling GET is fine either way since methods differ, but kept here for
// consistency with the rest of the file's ordering.
// ---------------------------------------------------------------------------
// Registered before "/:id" — otherwise Express matches "bulk" as an :id
// param on the dynamic PATCH route below.
router.patch("/bulk", auth("superadmin", "admin", "dev"), validate(bulkUpdateStaffSchema), bulkUpdate);

router.patch("/:id", auth("superadmin", "admin", "dev"), validate(patchStaffSchema), patchStaff);

router.get("/:id", auth("superadmin", "admin", "dev"), getById);
router.get("/",    auth("superadmin", "admin", "dev"), getAll);

module.exports = router;