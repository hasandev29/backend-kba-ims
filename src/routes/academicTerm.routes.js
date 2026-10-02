// src/routes/academicTerm.routes.js

"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createAcademicTermSchema,
  updateAcademicTermSchema,
  getAcademicTermsQuerySchema,
} = require("../middlewares/validators/academicTerm.validator");
const { create, getById, getAll, update } = require("../controllers/academicTerm.controller");

router.post("/",     auth("dev", "superadmin", "admin"),          validate(createAcademicTermSchema),        create);
router.patch("/:id", auth("dev", "superadmin", "admin"),          validate(updateAcademicTermSchema),        update);
router.get("/:id",   auth("dev", "superadmin", "admin", "staff"),                                           getById);
router.get("/",      auth("dev", "superadmin", "admin", "staff"), validate(getAcademicTermsQuerySchema, "query"), getAll);

module.exports = router;