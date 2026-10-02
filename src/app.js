// src/app.js

require("dotenv").config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const batchRoutes = require("./routes/batch.routes");
const studentRoutes = require("./routes/student.routes");
const staffRoutes = require("./routes/staff.routes");
const classroomRoutes = require("./routes/classroom.routes");
const subjectRoutes = require("./routes/subject.routes");
const timetableFormatRoutes = require("./routes/timetableFormat.routes");
const timetableRoutes = require("./routes/timetable.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const semesterRoutes = require("./routes/semester.routes");
const courseRoutes = require("./routes/course.routes");
const academicYears = require("./routes/academicYear.routes");
const studentEntollments = require("./routes/studentAcademicEnrollment.routes");
const academicTermRoutes = require("./routes/academicTerm.routes");
const academicCalendarRoutes = require("./routes/academicCalendar.routes");
const additionalClass = require("./routes/additionalClass.routes");

// Reports
const attendanceReport = require("./routes/reports/attendance.report.routes");

const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 App is running successfully");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timetable-formats", timetableFormatRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/academic-years", academicYears);
app.use("/api/student-enrollments", studentEntollments);
app.use("/api/academic-terms", academicTermRoutes);
app.use("/api/calendar", academicCalendarRoutes);
app.use("/api/additional-class", additionalClass);

app.use("/api/reports/attendance", attendanceReport);

app.use(errorHandler);

module.exports = {
  app,
  connectDB,
};