// src/routes/batch.routes.js

"use strict";

const express  = require("express");
const router   = express.Router();

const auth     = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createBatchSchema,
  updateBatchSchema,
} = require("../middlewares/validators/batch.validator");
const { create, edit, getById, getAll } = require("../controllers/batch.controller");

router.post("/",     auth("dev", "superadmin", "admin"),           validate(createBatchSchema), create);
router.put ("/:id",  auth("dev", "superadmin", "admin"),           validate(updateBatchSchema), edit);
router.get ("/:id",  auth("dev", "superadmin", "admin", "staff"),                                getById);
router.get ("/",     auth("dev", "superadmin", "admin", "staff"),                                getAll);

module.exports = router;