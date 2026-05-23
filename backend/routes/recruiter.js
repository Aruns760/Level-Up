const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

/* ===============================
   CREATE PROFILE
================================ */
router.post("/profile", verifyToken, authorizeRole("recruiter"), async (req, res) => {
  try {
    const { companyName, companyWebsite } = req.body;

    const existing = await prisma.recruiter.findUnique({
      where: { userId: req.user.id }
    });

    if (existing) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const profile = await prisma.recruiter.create({
      data: {
        userId: req.user.id,
        companyName,
        companyWebsite
      }
    });

    res.json(profile);

  } catch (error) {
    console.error("CREATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===============================
   GET PROFILE
================================ */
router.get("/profile", verifyToken, authorizeRole("recruiter"), async (req, res) => {
  try {
    const profile = await prisma.recruiter.findUnique({
      where: { userId: req.user.id }
    });

    res.json(profile); // can be null (handled in frontend)

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===============================
   UPDATE OR CREATE PROFILE
================================ */
router.put("/profile", verifyToken, authorizeRole("recruiter"), async (req, res) => {
  try {
    const { companyName, companyWebsite } = req.body;

    // 🔍 Check if profile exists
    const existing = await prisma.recruiter.findUnique({
      where: { userId: req.user.id }
    });

    // 🆕 If NOT exists → CREATE
    if (!existing) {
      const created = await prisma.recruiter.create({
        data: {
          userId: req.user.id,
          companyName,
          companyWebsite
        }
      });

      return res.json(created);
    }

    // ✏️ If exists → UPDATE
    const updated = await prisma.recruiter.update({
      where: { userId: req.user.id },
      data: {
        companyName,
        companyWebsite
      }
    });

    res.json(updated);

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;