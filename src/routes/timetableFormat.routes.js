// src/routes/timetableFormat.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createTimetableFormatSchema,
  updateTimetableFormatSchema,
  getTimetableFormatsQuerySchema,
  bulkUpdateTimetableFormatSchema,
} = require("../middlewares/validators/timetableFormat.validator");
const { create, getById, getAll, update, bulkUpdate } = require("../controllers/timetableFormat.controller");

router.post("/",      auth("dev", "superadmin", "admin"),          validate(createTimetableFormatSchema),          create);
router.patch("/bulk", auth("dev", "superadmin", "admin"),          validate(bulkUpdateTimetableFormatSchema),      bulkUpdate);
router.patch("/:id",  auth("dev", "superadmin", "admin"),          validate(updateTimetableFormatSchema),          update);
router.get("/:id",    auth("dev", "superadmin", "admin", "staff"),                                                 getById);
router.get("/",       auth("dev", "superadmin", "admin", "staff"), validate(getTimetableFormatsQuerySchema, "query"), getAll);

module.exports = router;