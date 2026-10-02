// src/routes/classroom.routes.js

"use strict";

const express  = require("express");
const router   = express.Router();

const auth     = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createClassroomSchema,
  updateClassroomSchema,
  getClassroomsQuerySchema,
  getClassroomsListQuerySchema,
  bulkUpdateClassroomSchema
} = require("../middlewares/validators/classroom.validator");
const { create, getById, getAll, getAllList, update, bulkUpdate } = require("../controllers/classroom.controller");

router.post("/",    auth("dev", "superadmin", "admin"),          validate(createClassroomSchema),             create);
router.patch("/bulk", auth("dev", "superadmin", "admin"),        validate(bulkUpdateClassroomSchema),         bulkUpdate);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateClassroomSchema),             update);
router.get ("/list", auth("dev", "superadmin", "admin", "staff"), validate(getClassroomsListQuerySchema, "query"), getAllList);
router.get ("/:id", auth("dev", "superadmin", "admin", "staff"),                                              getById);
router.get ("/",    auth("dev", "superadmin", "admin", "staff"), validate(getClassroomsQuerySchema, "query"), getAll);

module.exports = router;