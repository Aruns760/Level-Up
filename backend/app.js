const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();

/* 🔥 MIDDLEWARES */
app.use(cors({
  origin: ["http://localhost:3000", "http://10.47.145.5:3000"],
  credentials: true
}));

app.use(express.json());

/* ✅ SERVE UPLOADED IMAGES (ONLY ONCE) */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* 🔐 SECURITY */
const helmet = require("helmet");
app.use(helmet());

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

/* 📦 ROUTES */
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const profileRoutes = require("./routes/profile");
app.use("/api/profile", profileRoutes);

const recruiterRoutes = require("./routes/recruiter");
const jobRoutes = require("./routes/job");
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/jobs", jobRoutes);

const testRoutes = require("./routes/test");
app.use("/api/tests", testRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const userRoutes = require("./routes/user");
app.use("/api/user", userRoutes);

/* 📄 SWAGGER */
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* 🧪 TEST ROUTE */
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend Connected Successfully" });
});

/* ROOT */
app.get("/", (req, res) => {
  res.send("TalentLevelUp API Running 🚀");
});

/* 📊 LOGGER */
const morgan = require("morgan");
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ❌ ERROR HANDLER */
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

/* 🚀 SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const candidateRoutes = require("./routes/candidate");

app.use("/api/candidate", candidateRoutes);