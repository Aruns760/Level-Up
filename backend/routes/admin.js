const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const multer = require("multer");
const path = require("path");

const router = express.Router();

/* 🔥 MULTER CONFIG */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ✅ GET ALL USERS */
router.get("/users", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ✅ GET ADMIN PROFILE */
router.get("/profile", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ✅ UPDATE PROFILE IMAGE (URL) */
router.put("/profile/image", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { image } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: Number(req.user.id) },
      data: { image },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ✅ UPLOAD PROFILE IMAGE (FILE) */
router.put(
  "/profile/upload",
  verifyToken,
  authorizeRole("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imagePath = `/uploads/${req.file.filename}`;

      const updatedUser = await prisma.user.update({
        where: { id: Number(req.user.id) },
        data: { image: imagePath },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

/* ✅ UPDATE PROFILE (NAME + EMAIL) */
router.put(
  "/profile/update",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { name, email } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: Number(req.user.id) },
        data: { name, email },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Update failed" });
    }
  }
);

/* ✅ GET ALL JOBS (ADMIN) */
router.get("/jobs", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        recruiter: {
          include: { user: true }
        }
      }
    });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/* ✅ APPROVE JOB */
router.put("/jobs/approve/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const job = await prisma.job.update({
      where: { id: Number(req.params.id) },
      data: { status: "approved" },
    });

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Approval failed" });
  }
});

/* ❌ REJECT JOB */
router.delete("/jobs/reject/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    await prisma.job.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Job rejected" });
  } catch (err) {
    res.status(500).json({ message: "Reject failed" });
  }
});

/* 🗑 DELETE JOB */
router.delete("/jobs/delete/:id", verifyToken, authorizeRole("admin"), async (req, res) => {
  await prisma.job.delete({
    where: { id: Number(req.params.id) }
  });
  res.json({ message: "Deleted" });
});

/* ✏️ EDIT JOB (ADMIN) */
router.put(
  "/jobs/edit/:id",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { title, description, location, salary } = req.body;

      const job = await prisma.job.update({
        where: { id: Number(req.params.id) },
        data: {
          title,
          description,
          location,
          salary: String(salary),
        },
      });

      res.json(job);
    } catch (error) {
      console.error("EDIT JOB ERROR:", error);
      res.status(500).json({ message: "Edit failed" });
    }
  }
);


module.exports = router;