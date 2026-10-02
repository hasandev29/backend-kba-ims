"use strict";

// =============================================================================
// asyncHandler
// Wraps async controller functions so unhandled promise rejections
// are forwarded to next() → global error handler automatically.
// Eliminates repetitive try-catch blocks in every controller.
// =============================================================================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;