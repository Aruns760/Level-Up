const express = require("express");
const multer = require("multer");
const path = require("path"); // Need to import 'path' for the file extension
const prisma = require("../prismaClient");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// --- 1. Configure Multer Storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Note: Make sure the 'uploads' folder exists in your backend root directory
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Gives the file a unique name: timestamp + original extension (e.g., 1690000000.png)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// --- 2. Initialize Multer ---
const upload = multer({ storage });

// --- 3. Upload Route (POST /upload) ---
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    // Safety check: ensure a file was actually sent
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Create the frontend-friendly path
    const imagePath = `/uploads/${req.file.filename}`;

    // Update the user in the database
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { image: imagePath }
    });

    // Return the response you specified
    res.json({
      message: "Image uploaded successfully",
      image: imagePath,
      user
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// --- 4. Get Current User Profile (GET /me) ---
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("FETCH USER ERROR:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

module.exports = router;