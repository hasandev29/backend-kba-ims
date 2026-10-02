// src/controllers/auth.controller.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByUserId, } = require("../models/user.model");


// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      user_id: user.user_id,
      role: user.role,
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// Cookie options shared between setting (login) and clearing (logout) —
// they must match exactly or the browser won't clear the right cookie.
const ACCESS_TOKEN_COOKIE = "token";
const getCookieOptions = () => ({
  httpOnly: true,                                   // JS can never read this — the whole point
  secure: process.env.COOKIE_SECURE === "true",      // true in production (HTTPS only)
  sameSite: process.env.COOKIE_SECURE === "true" ? "none" : "lax", // "none" needed if frontend/backend are on different domains in prod (requires secure:true too)
  // Must be a number in ms — env vars are always strings, and passing
  // one through unparsed can make the cookie expire at an unintended
  // time relative to the JWT itself (likely why you saw "Access token
  // is required" for what should read as a normal expiry). Keep
  // COOKIE_MAX_AGE and JWT_EXPIRES_IN representing the same duration
  // (e.g. COOKIE_MAX_AGE=3600000 for a 1h JWT_EXPIRES_IN="1h").
  maxAge: Number(process.env.COOKIE_MAX_AGE),
  path: "/",
});


// Login
const login = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const user = await findUserByUserId(user_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID or password",
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Generate Access Token
    const token = generateAccessToken(user);

    // Set as httpOnly cookie — the browser stores this itself; JS
    // (including any XSS payload) cannot read it via document.cookie
    // or localStorage. The frontend no longer needs to store or attach
    // this token manually.
    res.cookie(ACCESS_TOKEN_COOKIE, token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
  

  const register = async (req, res) => {
    try {
      const {
        user_id,
        email,
        role,
        password,
      } = req.body;
  
      const hashedPassword = await bcrypt.hash(
        password,
        10
      );
  
      await createUser({
        user_id,
        email,
        role,
        password: hashedPassword,
      });
  
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// Logout — clears the cookie server-side. This is something plain
// localStorage could never really do: the browser is instructed to
// delete the cookie, so a stolen/copied token string alone (unlike
// before) does nothing once the real user logs out from here.
const logout = (req, res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, getCookieOptions());
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Returns the current user based on the httpOnly cookie, or reports
// that there isn't one — WITHOUT throwing a 401. This route is
// intentionally NOT behind the auth() middleware: /auth/me exists to
// ANSWER "am I logged in?", and "no" is a normal, expected response
// (e.g. every fresh visit), not an error condition. Genuinely
// protected routes (users, students, etc.) still use auth() and still
// correctly return 401 when there's no valid session.
const me = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Expired or invalid — same "not authenticated", not an error.
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    const user = await findUserByUserId(decoded.user_id);

    if (!user) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // A genuine server-side failure (e.g. DB down) — this one really
    // is an error, so 500 stays appropriate here.
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  me,
};