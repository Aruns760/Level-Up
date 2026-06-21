require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");

const app = express();

/* ================= CORS ================= */

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://level-up-livid.vercel.app",
    ],
    credentials: true,
  })
);

/* ================= MIDDLEWARE ================= */

app.use(express.json());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use(limiter);

/* ================= STATIC FILES ================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/* ================= TEST ROUTE ================= */

app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend Connected Successfully 🚀",
  });
});

/* ================= ROOT ROUTE ================= */

app.get("/", (req, res) => {
  res.send("TalentLevelUp API Running 🚀");
});

/* ================= ROUTES ================= */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/recruiter", require("./routes/recruiter"));
app.use("/api/jobs", require("./routes/job"));
app.use("/api/tests", require("./routes/test"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/user", require("./routes/user"));
app.use("/api/candidate", require("./routes/candidate"));

/* ================= ERROR HANDLER ================= */

const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});