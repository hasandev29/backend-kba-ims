// src/routes/subject.routes.js

"use strict";

const express  = require("express");
const router   = express.Router();
const auth     = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createSubjectSchema,
  updateSubjectSchema,
  bulkUpdateSubjectSchema,
  getSubjectsQuerySchema,
} = require("../middlewares/validators/subject.validator");
const { create, getById, getAll, update, bulkUpdate } = require("../controllers/subject.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createSubjectSchema),                create);
router.patch("/bulk", auth("dev", "superadmin", "admin"),          validate(bulkUpdateSubjectSchema),            bulkUpdate);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateSubjectSchema),                update);
router.get ("/:id", auth("dev", "superadmin", "admin", "staff"),                                                getById);
router.get ("/",    auth("dev", "superadmin", "admin", "staff"), validate(getSubjectsQuerySchema, "query"),     getAll);

module.exports = router;