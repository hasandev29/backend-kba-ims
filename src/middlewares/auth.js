// src/middlewares/auth.js

const jwt = require("jsonwebtoken");

const auth = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Token now arrives as an httpOnly cookie (set on login), not a
      // Bearer header — the browser attaches it automatically on every
      // request as long as axios/fetch sends withCredentials: true.
      const token = req.cookies?.token;

      if (!token) {
        // Truly no cookie present — either never logged in, or the
        // cookie's own maxAge elapsed. As long as COOKIE_MAX_AGE is
        // set comfortably LONGER than JWT_EXPIRES_IN (see auth.controller.js),
        // this branch should only realistically hit for "never logged
        // in" — a genuinely expired *session* will instead have a
        // cookie present but an expired JWT, caught below as
        // TokenExpiredError.
        return res.status(401).json({
          success: true,
          message: "Access token is required",
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded;

      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(decoded.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have access",
        });
      }

      next();
} catch (error) {

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED",
      message: "Session expired",
    });
  }

  return res.status(401).json({
    success: false,
    code: "INVALID_TOKEN",
    message: "Invalid access token",
  });
}
  };
};
  
module.exports = auth;