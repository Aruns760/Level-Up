const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

/* ===========================
   👥 GET ALL USERS (ADMIN)
=========================== */
router.get(
  "/users",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      res.json(users);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ===========================
   👤 GET ADMIN PROFILE
=========================== */
router.get(
  "/profile",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ===========================
   ✏️ UPDATE ADMIN PROFILE
=========================== */
router.put(
  "/profile",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { name } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { name }
      });

      res.json(updatedUser);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Update failed" });
    }
  }
);

/* ===========================
   ❌ DELETE USER
=========================== */
router.delete(
  "/users/:id",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id }
      });

      res.json({ message: "User deleted successfully" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

/* ===========================
   🔄 CHANGE USER ROLE
=========================== */
router.put(
  "/users/:id/role",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role }
      });

      res.json(updatedUser);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Role update failed" });
    }
  }
);

module.exports = router;