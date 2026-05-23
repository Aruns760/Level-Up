const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =====================================================
   CREATE TEST (Admin Only)
===================================================== */
router.post(
  "/create",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        duration,
        level,
        difficulty,
        category,
      } = req.body;

      // ✅ VALIDATION
      if (!title || !duration || !level || !difficulty || !category) {
        return res.status(400).json({
          message:
            "Title, duration, level, difficulty, category are required",
        });
      }

      const test = await prisma.test.create({
        data: {
          title,
          description,
          duration: Number(duration), // 🔥 ensure number
          level,
          difficulty,
          category, // ✅ IMPORTANT FIX
        },
      });

      res.status(201).json(test);
    } catch (error) {
      console.error("CREATE TEST ERROR:", error); // 🔥 debug log
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =====================================================
   📦 ADD QUESTION TO BANK
===================================================== */
router.post(
  "/bank",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { question, optionA, optionB, optionC, optionD, correct, category, difficulty, type } = req.body;

      const q = await prisma.question.create({
        data: {
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correct,
          category,
          difficulty,
          type: type || "mcq",
          testId: null, // 🔥 BANK
        },
      });

      res.json(q);
    } catch (err) {
      res.status(500).json({ message: "Bank error" });
    }
  }
);

/* =====================================================
   📦 GET QUESTION BANK
===================================================== */
router.get("/bank", verifyToken, async (req, res) => {
  const questions = await prisma.question.findMany({
    where: { testId: null },
  });

  res.json(questions);
});
/* =====================================================
   ADD QUESTION (Admin Only)
===================================================== */
router.post(
  "/add-question/:testId",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);

      const {
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correct,
        type,
        codeTemplate,
        expectedOutput,
      } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question required" });
      }

      const newQuestion = await prisma.question.create({
        data: {
          testId,
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correct,
          type: type || "mcq",
          codeTemplate,
          expectedOutput,
        },
      });

      res.status(201).json(newQuestion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);
/* =====================================================
   🧠 GENERATE QUESTIONS (Admin Only)
===================================================== */
router.post(
  "/generate-questions",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { category, difficulty } = req.body;

      let count = 20;
      if (difficulty === "medium") count = 25;
      if (difficulty === "hard") count = 20;

      const questions = [];

      for (let i = 1; i <= count; i++) {
        questions.push({
          question: `${category} Question ${i}`,
          optionA: "Option A",
          optionB: "Option B",
          optionC: "Option C",
          optionD: "Option D",
          correct: "A",
        });
      }

      res.json({ success: true, questions });
    } catch (err) {
      res.status(500).json({ message: "Fallback failed" });
    }
  }
);
/* =====================================================
   GET ALL TESTS (ADMIN)
===================================================== */
router.get(
  "/",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const tests = await prisma.test.findMany({
        orderBy: { id: "desc" },
      });

      res.json(tests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching tests" });
    }
  }
);

/* =====================================================
   GET MY TESTS (Candidate)
===================================================== */
router.get("/my-tests", verifyToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    const tests = await prisma.test.findMany({
      where: {
        level: profile?.level || "Beginner",
        difficulty: profile?.difficulty || "easy",
      },
      orderBy: { id: "asc" },
    });

    res.json(tests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching tests" });
  }
});

router.put(
  "/edit/:id",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const updated = await prisma.test.update({
        where: { id },
        data: req.body,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  }
);
/* =====================================================
   TOGGLE ID
===================================================== */
router.put(
  "/toggle/:id",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;

      const updated = await prisma.test.update({
        where: { id },
        data: { isActive },
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Toggle failed" });
    }
  }
);
/* =====================================================
   SUBMIT TEST (Candidate)
===================================================== */
router.post("/submit/:testId", verifyToken, async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);
    const { answers } = req.body;

    const questions = await prisma.question.findMany({
      where: { testId },
    });

    let score = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correct) {
        score += q.marks; // 🔥 PER QUESTION MARKS
      }
    });

    const total = questions.reduce((sum, q) => sum + q.marks, 0);

    const percentage = (score / total) * 100;

    // 🔥 XP SYSTEM
    let xp = 10;
    if (percentage > 80) xp = 50;
    else if (percentage > 50) xp = 30;

    // 🔥 SAVE RESULT WITH ANSWERS
    const result = await prisma.result.create({
      data: {
        userId: req.user.id,
        testId,
        score,
        total,
        percentage,
        xpEarned: xp,
        answers, // 🔥 IMPORTANT
      },
    });

    // 🔥 UPDATE USER XP
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        xp: {
          increment: xp,
        },
      },
    });

    res.json({
      score,
      total,
      percentage,
      xpEarned: xp,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Submit failed" });
  }
});
/* =====================================================
   MY RESULTS
===================================================== */
router.get(
  "/my-results",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const results = await prisma.result.findMany({
        where: { userId: req.user.id },
        include: { test: true },
      });

      res.json(results);
    } catch {
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =====================================================
   LEADERBOARD
===================================================== */
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { xp: "desc" },
      take: 10,
      select: { id: true, name: true, xp: true, level: true },
    });

    res.json(users);
  } catch {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

/* =====================================================
   RESULT ROUTE (PUT THIS FIRST)
===================================================== */
router.get(
  "/result/:testId",
  verifyToken,
  async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);

      const result = await prisma.result.findFirst({
        where: {
          userId: req.user.id,
          testId,
        },
      });

      const questions = await prisma.question.findMany({
        where: { testId },
      });

      res.json({
        result,
        questions,
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching result" });
    }
  }
);

/* =====================================================
   GET TEST WITH QUESTIONS (⚠ ALWAYS LAST)
===================================================== */
router.get("/:testId", verifyToken, async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // 🔥 LIMIT BASED ON DIFFICULTY
    let limit = 20;
    if (test.difficulty === "medium") limit = 25;
    if (test.difficulty === "hard") limit = 20;

    const randomQuestions = test.questions
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    res.json({
      ...test,
      questions: randomQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
module.exports = router;