require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");

const app = express();

/* 🔥 MIDDLEWARES */

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-frontend.vercel.app",
    ],
    credentials: true,
  })
);

// JSON Parser
app.use(express.json());

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use(limiter);

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ✅ STATIC FILES */

app.use(
  "/uploads",
  cors(),
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/* 📦 ROUTES */

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const recruiterRoutes = require("./routes/recruiter");
const jobRoutes = require("./routes/job");
const testRoutes = require("./routes/test");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const candidateRoutes = require("./routes/candidate");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/candidate", candidateRoutes);

/* 📄 SWAGGER */

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* 🧪 TEST ROUTE */

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend Connected Successfully 🚀",
  });
});

/* ROOT */

app.get("/", (req, res) => {
  res.send("TalentLevelUp API Running 🚀");
});

/* ❌ ERROR HANDLER */

const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

/* 🚀 SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});