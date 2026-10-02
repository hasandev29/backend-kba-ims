// src/routes/timetable.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createTimetableSchema,
  updateTimetableSchema,
  getTimetablesQuerySchema,
  bulkUpdateTimetableSchema,
} = require("../middlewares/validators/timetable.validator");
const { create, getById, getAll, update, bulkUpdate } = require("../controllers/timetable.controller");

router.post("/",      auth("dev", "superadmin", "admin"),          validate(createTimetableSchema),          create);
router.patch("/bulk", auth("dev", "superadmin", "admin"),          validate(bulkUpdateTimetableSchema),      bulkUpdate);
router.patch("/:id",  auth("dev", "superadmin", "admin"),          validate(updateTimetableSchema),          update);
router.get("/:id",    auth("dev", "superadmin", "admin", "staff"),                                           getById);
router.get("/",       auth("dev", "superadmin", "admin", "staff"), validate(getTimetablesQuerySchema, "query"), getAll);

module.exports = router;