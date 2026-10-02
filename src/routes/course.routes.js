// src/routes/course.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createCourseSchema,
  updateCourseSchema,
  getCoursesQuerySchema,
} = require("../middlewares/validators/course.validator");
const { create, getById, getAll, update } = require("../controllers/course.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createCourseSchema),        create);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateCourseSchema),        update);
router.get("/:id",   auth("dev", "superadmin", "admin", "staff"),                                     getById);
router.get("/",      auth("dev", "superadmin", "admin", "staff"), validate(getCoursesQuerySchema, "query"), getAll);

module.exports = router;