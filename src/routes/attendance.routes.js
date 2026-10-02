// src/routes/attendance.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createAttendanceSessionSchema,
  getAttendanceSessionsQuerySchema,
} = require("../middlewares/validators/attendance.validator");
const { dateViewQuerySchema, 
  slotDetailParamsSchema,
  slotDetailQuerySchema } = require("../middlewares/validators/attendanceList.validator");
const { create, getById, getAll } = require("../controllers/attendance.controller");
const { getDateView, getSlotDetail } = require("../controllers/attendanceList.controller");

router.post("/",    auth("dev", "superadmin", "admin", "staff"), validate(createAttendanceSessionSchema),        create);


// Static paths must stay above "/:id" so they are never captured as an id.
router.get("/sessions", auth("dev", "superadmin", "admin", "staff"), validate(dateViewQuerySchema, "query"), getDateView);

// GET /api/attendances/slot/:slot_id?date=2026-09-11&type=regular|extra
router.get( "/slot/:slot_id", auth("dev", "superadmin", "admin", "staff"), 
validate(slotDetailParamsSchema, "params"), validate(slotDetailQuerySchema, "query"), 
getSlotDetail);




router.get("/", auth("dev", "superadmin", "admin", "staff"), validate(getAttendanceSessionsQuerySchema, "query"), getAll);

// Must stay last so "/sessions" and "/slot/:slot_id" are never captured as an id.
router.get("/:id", auth("dev", "superadmin", "admin", "staff"), getById);

module.exports = router;