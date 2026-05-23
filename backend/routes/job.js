const express = require("express");
const prisma = require("../prismaClient");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");
const { createJobSchema } = require("../validations/jobValidation");

const router = express.Router();

/* =======================================================
   POST JOB (Recruiter Only)
======================================================= */
router.post(
  "/create",
  verifyToken,
  authorizeRole("recruiter"),
  async (req, res) => {
    try {
      const { title, description, location, salary } = req.body;

      // 🔥 check recruiter profile
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
      });

      if (!recruiter) {
        return res.status(400).json({
          message: "Please create recruiter profile first"
        });
      }

      // 🔥 create job
      const job = await prisma.job.create({
        data: {
          title,
          description,
          location,
          salary,
          recruiterId: recruiter.id,
        },
      });

      res.status(201).json({
        success: true,
        data: job,
        message: "Job created successfully",
      });

    } catch (error) {
      console.error("POST JOB ERROR:", error);
      res.status(500).json({
        message: error.message
      });
    }
  }
);

/* =======================================================
   APPLY JOB (Candidate Only)
======================================================= */
router.post(
  "/apply/:jobId",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const existing = await prisma.application.findFirst({
        where: {
          userId: req.user.id,
          jobId,
        },
      });

      if (existing) {
        return res.status(400).json({
          message: "You already applied for this job",
        });
      }

      const application = await prisma.application.create({
        data: {
          userId: req.user.id,
          jobId,
        },
      });

      res.status(201).json(application);
    } catch (error) {
      console.error("APPLY ERROR:", error);
      res.status(500).json({ message: "Error applying for job" });
    }
  }
);

/* =======================================================
   GET MY APPLICATIONS (Candidate)
======================================================= */
router.get(
  "/my-applications",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.user.id },
        include: { job: true },
      });

      res.json(applications);
    } catch (error) {
      console.error("APPLICATION FETCH ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
   GET APPLICANTS (Recruiter Smart Ranking)
======================================================= */
router.get(
  "/applicants/:jobId",
  verifyToken,
  authorizeRole("recruiter"),
  async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { minScore } = req.query;

      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
      });

      if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
      }

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.recruiterId !== recruiter.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const applicants = await prisma.application.findMany({
        where: { jobId },
        include: {
          user: {
            include: {
              profile: true,
              results: true,
            },
          },
        },
      });

      const ranked = applicants.map((app) => {
        const results = app.user.results;

        const avgScore =
          results.length > 0
            ? results.reduce((sum, r) => sum + r.percentage, 0) /
              results.length
            : 0;

        return {
          ...app,
          averageScore: avgScore,
        };
      });

      ranked.sort((a, b) => b.averageScore - a.averageScore);

      const filteredApplicants = minScore
        ? ranked.filter((a) => a.averageScore >= parseInt(minScore))
        : ranked;

      res.json(filteredApplicants);
    } catch (error) {
      console.error("APPLICANTS FETCH ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
   RECRUITER DASHBOARD
======================================================= */
router.get(
  "/dashboard/stats",
  verifyToken,
  authorizeRole("recruiter"),
  async (req, res) => {
    try {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
      });

      if (!recruiter) {
        return res.status(404).json({
          message: "Recruiter profile not found",
        });
      }

      const totalJobs = await prisma.job.count({
        where: { recruiterId: recruiter.id },
      });

      const totalApplications = await prisma.application.count({
        where: {
          job: {
            recruiterId: recruiter.id,
          },
        },
      });

      res.json({
        totalJobs,
        totalApplications,
      });
    } catch (error) {
      console.error("RECRUITER DASHBOARD ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
   CANDIDATE DASHBOARD
======================================================= */
router.get(
  "/candidate/dashboard",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const totalApplications = await prisma.application.count({
        where: { userId: req.user.id },
      });

      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });

      res.json({
        totalApplications,
        profileCompleted: !!profile,
      });
    } catch (error) {
      console.error("CANDIDATE DASHBOARD ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
   RECOMMENDED JOBS
======================================================= */
router.get(
  "/recommended",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const results = await prisma.result.findMany({
        where: { userId: req.user.id },
        select: { percentage: true },
      });

      const avgScore =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.percentage, 0) /
            results.length
          : 0;

      let recommendedJobs;

      if (avgScore >= 80) {
        recommendedJobs = await prisma.job.findMany();
      } else if (avgScore >= 50) {
        recommendedJobs = await prisma.job.findMany({ take: 3 });
      } else {
        recommendedJobs = await prisma.job.findMany({ take: 2 });
      }

      res.json({
        averageScore: avgScore,
        recommendedJobs,
      });
    } catch (error) {
      console.error("RECOMMENDED JOB ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
   GET ALL JOBS (Public - MUST BE LAST)
======================================================= */
router.get("/", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: { recruiter: true },
    });

    res.json(jobs);
  } catch (error) {
    console.error("FETCH JOBS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* =======================================================
   GET MY JOBS (Recruiter)
======================================================= */
router.get(
  "/my-jobs",
  verifyToken,
  authorizeRole("recruiter"),
  async (req, res) => {
    try {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
      });

      if (!recruiter) {
        return res.status(404).json({
          message: "Recruiter profile not found",
        });
      }

      const jobs = await prisma.job.findMany({
        where: { recruiterId: recruiter.id },
        orderBy: { id: "desc" },
      });

      res.json(jobs);

    } catch (error) {
      console.error("MY JOBS ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
   DELETE JOB (Recruiter)
======================================================= */
router.delete(
  "/delete/:jobId",
  verifyToken,
  authorizeRole("recruiter"),
  async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);

      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
      });

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.recruiterId !== recruiter.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await prisma.job.delete({
        where: { id: jobId },
      });

      res.json({ message: "Job deleted successfully" });

    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* =======================================================
 ✏️ ADMIN EDIT JOB 
======================================================= */
/* ✏️ EDIT JOB (ADMIN) */
router.put(
  "/jobs/edit/:id",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { title, description, location, salary, status } = req.body;

      const job = await prisma.job.update({
        where: { id: Number(req.params.id) },
        data: {
          title,
          description,
          location,
          salary: salary ? String(salary) : undefined,
          status: status || undefined,
        },
      });

      res.json(job);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Edit failed" });
    }
  }
);

/* 🗑 DELETE JOB (ADMIN) */
router.delete(
  "/jobs/delete/:id",
  verifyToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      await prisma.job.delete({
        where: { id: Number(req.params.id) },
      });

      res.json({ message: "Deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

/* =======================================================
   GET APPLIED JOB IDS (Candidate)
======================================================= */
router.get(
  "/applied-ids",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.user.id },
        select: { jobId: true },
      });

      const appliedJobIds = applications.map((a) => a.jobId);

      res.json(appliedJobIds);
    } catch (error) {
      console.error("APPLIED IDS ERROR:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.delete(
  "/withdraw/:jobId",
  verifyToken,
  authorizeRole("candidate"),
  async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);

      await prisma.application.deleteMany({
        where: {
          userId: req.user.id,
          jobId,
        },
      });

      res.json({ message: "Application withdrawn" });
    } catch (err) {
      res.status(500).json({ message: "Error withdrawing" });
    }
  }
);

module.exports = router;