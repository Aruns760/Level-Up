const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.put(
  "/profile",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      // 🔥 Extract 'name' from req.body as well
      const { name, skills, education, experience } = req.body;

      // 1. Update the Profile table
      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { skills, education, experience },
        create: { userId: req.user.id, skills, education, experience },
      });

      // 2. 🔥 Update the User table (This fixes the name issue!)
      if (name) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { name: name }
        });
      }

      res.json({ message: "Profile and Identity updated successfully" });
    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);
      res.status(500).json({ message: "Error updating profile" });
    }
  }
);
/* =======================================================
   GET CANDIDATE PROFILE
======================================================= */
router.get(
  "/profile",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true, // 🔥 THIS IS THE FIX
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err) {
      console.error("PROFILE ERROR:", err);
      res.status(500).json({ message: "Error fetching profile" });
    }
  }
);

router.put(
  "/profile",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const { skills, education, experience } = req.body;

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: {
          skills,
          education,
          experience,
        },
        create: {
          userId: req.user.id,
          skills,
          education,
          experience,
        },
      });

      res.json(profile);
    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);
      res.status(500).json({ message: "Error updating profile" });
    }
  }
);

module.exports = router;