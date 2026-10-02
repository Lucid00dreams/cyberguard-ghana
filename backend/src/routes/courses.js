const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { generateRefCode } = require("../utils/refCode");

const router = express.Router();

// Public: list published courses, optionally filtered by age band
router.get("/", async (req, res, next) => {
  try {
    const { ageBand, category } = req.query;
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        ...(ageBand ? { ageBand } : {}),
        ...(category ? { category } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImageUrl: true,
        ageBand: true,
        category: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// Public: verify official digital certificate by certRef
router.get("/certificates/verify/:certRef", async (req, res, next) => {
  try {
    const { certRef } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { certRef: certRef.trim().toUpperCase() },
      include: {
        user: { select: { displayName: true, email: true, role: true } },
        course: { select: { title: true, category: true, ageBand: true } },
      },
    });

    if (!cert) {
      return res.status(404).json({
        valid: false,
        error: "Certificate not found or invalid reference code.",
      });
    }

    res.json({
      valid: true,
      certRef: cert.certRef,
      recipient: cert.user.displayName,
      courseTitle: cert.course.title,
      category: cert.course.category,
      issuedAt: cert.issuedAt,
      authority: "CyberGuard Ghana • National Child Online Protection Academy",
      framework: "Ghana Cybersecurity Act, 2020 (Act 1038)",
    });
  } catch (err) {
    next(err);
  }
});

// Authenticated: list courses created by the current tutor/admin
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { authorId: req.user.id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                quiz: { include: { questions: { orderBy: { order: "asc" } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

function ensureCourseAuthor(course, user) {
  if (!course) return { status: 404, error: "Course not found." };
  if (course.authorId !== user.id && user.role !== "ADMIN") {
    return { status: 403, error: "User is not authorized to manage this course." };
  }
  return null;
}

// Admin/Tutor: get course management data for builder
router.get("/:courseId/manage", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                quiz: { include: { questions: { orderBy: { order: "asc" } } } },
              },
            },
          },
        },
      },
    });

    const validation = ensureCourseAuthor(course, req.user);
    if (validation) return res.status(validation.status).json({ error: validation.error });

    res.json(course);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor: add a module to a course
router.post("/:courseId/modules", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    const validation = ensureCourseAuthor(course, req.user);
    if (validation) return res.status(validation.status).json({ error: validation.error });

    const { title, order } = req.body;
    const module = await prisma.module.create({
      data: { title, order: Number(order), courseId: req.params.courseId },
    });
    res.status(201).json(module);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor: add a lesson to a module
router.post("/:courseId/lessons", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    const validation = ensureCourseAuthor(course, req.user);
    if (validation) return res.status(validation.status).json({ error: validation.error });

    const { moduleId, title, type, order, videoUrl, textContent, transcript, transcriptSegments } = req.body;
    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title,
        type,
        order: Number(order),
        videoUrl: videoUrl || null,
        textContent: textContent || null,
        transcript: transcript || null,
        transcriptSegments: transcriptSegments || null,
      },
    });
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor or Student: Trigger on-demand Coursera AI transcription for a lesson
router.post("/lessons/:lessonId/transcribe", requireAuth, async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) return res.status(404).json({ error: "Lesson not found." });

    const { transcribeVideoFile, generateFallbackTranscript } = require("../services/transcriptionService");
    let result = null;

    if (lesson.videoUrl && lesson.videoUrl.includes("/uploads/videos/")) {
      const filename = lesson.videoUrl.split("/uploads/videos/")[1];
      const path = require("path");
      const localPath = path.join(__dirname, "../../public/uploads/videos", filename);
      const fs = require("fs");
      if (fs.existsSync(localPath)) {
        result = await transcribeVideoFile(localPath, "video/mp4", { title: lesson.title });
      }
    }

    if (!result) {
      result = generateFallbackTranscript(lesson.title, 120);
    }

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        transcript: result.fullTranscript,
        transcriptSegments: result.segments,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor: add a quiz for a lesson
router.post("/lessons/:lessonId/quiz", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { module: { include: { course: true } } },
    });
    const validation = ensureCourseAuthor(lesson?.module?.course, req.user);
    if (validation) return res.status(validation.status).json({ error: validation.error });

    const { passMarkPct = 70 } = req.body;
    const quiz = await prisma.quiz.create({ data: { lessonId: lesson.id, passMarkPct: Number(passMarkPct) } });
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor: add a question to a quiz
router.post("/quizzes/:quizId/questions", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.quizId },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    const validation = ensureCourseAuthor(quiz?.lesson?.module?.course, req.user);
    if (validation) return res.status(validation.status).json({ error: validation.error });

    const { prompt, options, correctIndex, order } = req.body;
    const question = await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        prompt,
        options,
        correctIndex: Number(correctIndex),
        order: Number(order),
      },
    });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor: publish a course
router.patch("/:courseId/publish", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    const validation = ensureCourseAuthor(course, req.user);
    if (validation) return res.status(validation.status).json({ error: validation.error });

    const updated = await prisma.course.update({
      where: { id: req.params.courseId },
      data: { isPublished: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin: view issued certificates
router.get("/certificates", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        user: { select: { displayName: true } },
        course: { select: { title: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
    res.json(certificates);
  } catch (err) {
    next(err);
  }
});

// Admin: list all courses (including drafts)
router.get("/all", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: { author: { select: { id: true, displayName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// Admin: delete a course
router.delete("/:courseId", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) return res.status(404).json({ error: "Course not found." });

    // remove related modules/lessons/quizzes via cascading deletes if configured
    await prisma.course.delete({ where: { id: req.params.courseId } });
    res.json({ success: true, message: "Course removed." });
  } catch (err) {
    next(err);
  }
});

// Student: list my enrollments with course details
router.get("/my-enrollments", requireAuth, async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: {
        course: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });
    res.json(enrollments);
  } catch (err) {
    next(err);
  }
});

// Student: list my earned certificates (only issued when course is 100% completed)
router.get("/my-certificates", requireAuth, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      include: {
        course: { select: { id: true, title: true, slug: true, category: true, ageBand: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
    res.json(certificates);
  } catch (err) {
    next(err);
  }
});

// Public: full course detail with modules/lessons (no quiz answers exposed)
router.get("/:slug", async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
                videoUrl: true,
                textContent: true,
                transcript: true,
                transcriptSegments: true,
                quiz: {
                  select: {
                    id: true,
                    passMarkPct: true,
                    questions: {
                      select: { id: true, prompt: true, options: true, order: true },
                      orderBy: { order: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course || !course.isPublished) {
      return res.status(404).json({ error: "Course not found." });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// Student: check enrollment status
router.get("/:courseId/enrollment", requireAuth, async (req, res, next) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: req.params.courseId } },
    });
    res.json({ enrolled: !!enrollment, enrollment });
  } catch (err) {
    next(err);
  }
});

// Student: enroll in a course (Admins cannot enroll as students)
router.post("/:courseId/enroll", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "CSA_OFFICER") {
      return res.status(403).json({
        error: "Admins and CSA Officers have supervisory roles and cannot enroll as students.",
      });
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: req.params.courseId } },
      update: {},
      create: { userId: req.user.id, courseId: req.params.courseId },
    });
    res.status(201).json(enrollment);
  } catch (err) {
    next(err);
  }
});

// Student: submit a quiz attempt, auto-graded server-side
router.post("/quizzes/:quizId/attempt", requireAuth, async (req, res, next) => {
  try {
    const { answers } = req.body; // { [questionId]: selectedIndex }

    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.quizId },
      include: { questions: true, lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });

    let correctCount = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctIndex) correctCount += 1;
    }
    const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePct >= quiz.passMarkPct;

    const attempt = await prisma.quizAttempt.create({
      data: { quizId: quiz.id, userId: req.user.id, scorePct, passed, answers },
    });

    if (passed) {
      await prisma.enrollment.updateMany({
        where: { userId: req.user.id, courseId: quiz.lesson.module.courseId },
        data: { progressPct: 100, lastActiveAt: new Date() },
      });
    }

    res.status(201).json({ attempt, scorePct, passed, passMarkPct: quiz.passMarkPct });
  } catch (err) {
    next(err);
  }
});

// Student: update course progress when a lesson or quiz is completed
router.post("/:courseId/progress", requireAuth, async (req, res, next) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: req.params.courseId } },
    });
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found." });
    }

    const progressPct = Math.min(100, Number(req.body.progressPct) || 100);
    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progressPct, lastActiveAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Student: issue or fetch certificate once course completion is verified server-side
router.post("/:courseId/certificate", requireAuth, async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              include: { quiz: true },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      return res.status(403).json({
        error: "Certificate locked. You must be actively enrolled in this course.",
      });
    }

    // Identify all required quizzes across modules
    const requiredQuizzes = [];
    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (les.quiz) requiredQuizzes.push(les.quiz.id);
      }
    }

    // Verify student has passed all quizzes for this course
    if (requiredQuizzes.length > 0) {
      const passedAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
          quizId: { in: requiredQuizzes },
          passed: true,
        },
        select: { quizId: true },
      });

      const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
      const hasPassedAll = requiredQuizzes.every((qId) => passedQuizIds.has(qId));

      if (!hasPassedAll) {
        return res.status(403).json({
          error: "Certificate locked. Academic records show that required course quizzes have not been passed yet.",
        });
      }
    } else if (enrollment.progressPct < 100) {
      return res.status(403).json({
        error: "Certificate locked. You must complete 100% of the course modules to unlock your certificate.",
      });
    }

    let certificate = await prisma.certificate.findFirst({
      where: { userId, courseId },
      include: {
        course: { select: { title: true } },
      },
    });

    if (!certificate) {
      certificate = await prisma.certificate.create({
        data: {
          userId,
          courseId,
          certRef: generateRefCode("CERT"),
        },
        include: {
          course: { select: { title: true } },
        },
      });
    }

    res.status(200).json(certificate);
  } catch (err) {
    next(err);
  }
});

// Admin/Tutor: create a course (Admin Studio)
router.post("/", requireAuth, requireRole("ADMIN", "TUTOR"), async (req, res, next) => {
  try {
    const { title, slug, description, ageBand, category, coverImageUrl } = req.body;
    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        ageBand,
        category,
        coverImageUrl,
        authorId: req.user.id,
      },
    });
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

// Public/Authenticated: fetch standalone quiz details by quizId (without correctIndex)
router.get("/quizzes/:quizId", async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.quizId },
      include: {
        questions: {
          select: { id: true, prompt: true, options: true, order: true },
          orderBy: { order: "asc" },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// Admin/CSA Officer: get global dashboard stats
router.get("/stats/summary", requireAuth, requireRole("ADMIN", "CSA_OFFICER"), async (req, res, next) => {
  try {
    const [reportsCount, pendingTutorsCount, tutorsCount, coursesCount, certificatesCount, studentsCount] = await Promise.all([
      prisma.incidentReport.count(),
      prisma.tutorProfile.count({ where: { vetted: false } }),
      prisma.tutorProfile.count({ where: { vetted: true } }),
      prisma.course.count(),
      prisma.certificate.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
    ]);

    res.json({
      reports: reportsCount,
      pendingTutors: pendingTutorsCount,
      vettedTutors: tutorsCount,
      courses: coursesCount,
      certificates: certificatesCount,
      students: studentsCount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

