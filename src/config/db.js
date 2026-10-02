// src/config/db.js

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
  multipleStatements: true
  });

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();

    console.log("✅ MySQL connected successfully");

    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error.message);
    // process.exit(1);
    throw error;
  }
};

module.exports = {
  pool,
  connectDB,
};