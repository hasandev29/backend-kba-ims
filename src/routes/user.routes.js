// src/routes/user.routes.js

"use strict";

const express  = require("express");
const router   = express.Router();

const auth     = require("../middlewares/auth");
const validate = require("../middlewares/validate.middleware");
const {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
  bulkUpdateUserSchema
} = require("../middlewares/validators/user.validator");
const { create, getAll, update, updatePassword, bulkUpdate } = require("../controllers/user.controller");

router.post(  "/",             auth("superadmin", "admin", "dev"), validate(createUserSchema),         create);
router.get(   "/",             auth("superadmin", "admin", "dev"),                                      getAll);
router.patch( "/bulk",         auth("superadmin", "admin", "dev"), validate(bulkUpdateUserSchema),      bulkUpdate);
router.put(   "/:id",          auth("superadmin", "admin", "dev"), validate(updateUserSchema),          update);
router.put(   "/:id/password", auth("superadmin", "admin", "dev"), validate(updatePasswordSchema),      updatePassword);


module.exports = router;