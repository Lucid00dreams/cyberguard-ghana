import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  PlayCircle,
  FileText,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Shield,
  Lock,
  ArrowRight,
  RotateCcw,
  Headphones,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "../components/CyberSpinner";
import FormattedLessonContent from "../components/FormattedLessonContent";
import CertificateModal from "../components/CertificateModal";
import CourseAudioNarrator, { extractSentences } from "../components/CourseAudioNarrator";
import WordInspectorPopup from "../components/WordInspectorPopup";

function getInitials(name) {
  if (!name) return "CG";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [message, setMessage] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [earnedCert, setEarnedCert] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const [testPassword, setTestPassword] = useState("");
  const [phishInput, setPhishInput] = useState("");
  const [phishAnalysis, setPhishAnalysis] = useState(null);

  // Read-Aloud & Word Inspector State
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const lessonContainerRef = useRef(null);

  const lessonSentences = useMemo(
    () => extractSentences(activeLesson?.textContent || ""),
    [activeLesson?.textContent]
  );
  const activeSentenceText = lessonSentences[activeSentenceIndex] || "";

  useEffect(() => {
    setActiveSentenceIndex(0);
  }, [activeLesson?.id]);

  function handleLessonUpdated(updatedLesson) {
    setActiveLesson(updatedLesson);
    setCourse((prevCourse) => {
      if (!prevCourse) return prevCourse;
      const updatedModules = prevCourse.modules?.map((m) => ({
        ...m,
        lessons: m.lessons?.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)),
      }));
      return { ...prevCourse, modules: updatedModules };
    });
  }

  useEffect(() => {
    let cancelled = false;
    api.get(`/courses/${slug}`).then(async (res) => {
      if (cancelled) return;
      setCourse(res.data);
      const firstLesson = res.data.modules?.[0]?.lessons?.[0];
      setActiveLesson(firstLesson || null);
      setMessage("");

      if (user && res.data?.id) {
        try {
          const [enrollRes, certsRes] = await Promise.all([
            api.get(`/courses/${res.data.id}/enrollment`),
            api.get("/courses/my-certificates").catch(() => ({ data: [] })),
          ]);
          if (cancelled) return;
          setEnrolled(Boolean(enrollRes.data?.enrolled));
          setEnrollment(enrollRes.data?.enrollment || null);
          const matchingCert = (certsRes.data || []).find(
            (c) => (c.courseId || c.course?.id) === res.data.id
          );
          setEarnedCert(matchingCert || null);
        } catch {
          if (!cancelled) {
            setEnrolled(false);
            setEnrollment(null);
          }
        }
      } else {
        setEnrolled(false);
        setEnrollment(null);
        setEarnedCert(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  async function handleEnroll() {
    if (!user) {
      setMessage("Please sign in or create an account to enroll.");
      return;
    }
    if (!course) return;
    setEnrolling(true);
    try {
      const res = await api.post(`/courses/${course.id}/enroll`);
      setEnrolled(true);
      setEnrollment(res.data || { progressPct: 0 });
      setMessage("Enrolled. You now have access to all lessons and quizzes.");
    } catch (error) {
      setMessage(error.response?.data?.error || "Unable to enroll right now. Please try again.");
    } finally {
      setEnrolling(false);
    }
  }

  function analyzePhishingUrl() {
    if (!phishInput.trim()) return;
    const lower = phishInput.trim().toLowerCase();
    let isPhish = false;
    let reason = "No obvious URL formatting red flags found — still verify before entering any PIN.";

    if (
      lower.includes("free") ||
      lower.includes("bonus") ||
      lower.includes("login-") ||
      lower.includes("verify-")
    ) {
      isPhish = true;
      reason =
        "Deceptive lure or hyphenated login keywords detected — common in SMS phishing links.";
    } else if (
      lower.startsWith("http://") ||
      /\b\d{1,3}(\.\d{1,3}){3}\b/.test(lower) ||
      lower.includes(".xyz") ||
      lower.includes(".top")
    ) {
      isPhish = true;
      reason = "Unencrypted HTTP, raw IP address, or high-risk domain extension detected.";
    }

    setPhishAnalysis({ isPhish, reason });
  }

  function evaluatePasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score < 50) return { score, label: "Weak", color: "bg-rose-500" };
    if (score < 75) return { score, label: "Moderate", color: "bg-amber-500" };
    return { score, label: "Strong", color: "bg-emerald-600" };
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <CyberSpinner size="lg" label="Loading course..." />
      </div>
    );
  }

  const pwdRating = evaluatePasswordStrength(testPassword);
  const totalLessons =
    course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const authorName = course.author?.displayName || "CyberGuard Curriculum Team";
  const authorRole =
    course.author?.role === "TUTOR" ? "Verified Tutor" : "CyberGuard Curriculum Team";
  const isCourseCompleted =
    (enrollment?.progressPct || 0) >= 100 || enrollment?.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Course Header Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white min-h-[380px] sm:min-h-[420px] flex items-center border-b border-slate-800 w-full">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 scale-100 transition-transform duration-700"
          style={{ backgroundImage: `url('${course.coverImageUrl || "/hero-courses.png?v=1038"}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 via-45% to-slate-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 w-full grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-center min-w-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <Link to="/courses" className="hover:underline">
                Courses
              </Link>
              <span>/</span>
              <span>{course.category || "Cyber Safety"}</span>
              <span>/</span>
              <span>{course.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
              {course.description}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-5 text-xs text-slate-200 font-medium">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-300" />
                {course.modules?.length || 0}{" "}
                {course.modules?.length === 1 ? "module" : "modules"} ({totalLessons}{" "}
                {totalLessons === 1 ? "lesson" : "lessons"})
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-300" />
                Verifiable completion certificate
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-300">
              <div className="w-8 h-8 rounded-full bg-[#0056D2] text-white flex items-center justify-center font-bold text-xs">
                {getInitials(authorName)}
              </div>
              <div>
                <span className="text-white font-semibold block">{authorName}</span>
                <span className="text-[11px] text-slate-300">{authorRole}</span>
              </div>
            </div>
          </div>

          {/* Enroll / Progress Card */}
          <div className="space-y-4 bg-slate-900/80 p-6 rounded-2xl border border-white/15 backdrop-blur-md shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-sky-400">
                {enrolled ? "Enrolled" : "Free course"}
              </span>
              <h3 className="text-lg font-bold text-white">
                {enrolled ? "Your progress" : "Start learning"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {enrolled
                  ? "Work through each module and pass the final quiz to earn your certificate."
                  : "Free access to all lessons, practice checks, and a verifiable certificate."}
              </p>
            </div>

            {enrolled ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const firstLesson = course.modules?.[0]?.lessons?.[0];
                    if (firstLesson) setActiveLesson(firstLesson);
                  }}
                  className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isCourseCompleted ? "Review lessons" : "Continue lessons"}</span>
                </button>

                {isCourseCompleted ? (
                  <button
                    type="button"
                    onClick={() => setShowCertModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Certificate</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 text-xs font-medium text-center flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Certificate unlocks at 100% ({enrollment?.progressPct || 0}%)</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {enrolling ? "Enrolling..." : "Enroll for Free"}
              </button>
            )}

            {message && (
              <p className="text-xs text-sky-200 font-semibold text-center pt-1">{message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Course Player Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start min-w-0 w-full">
        {/* Left Sidebar: Curriculum Navigator */}
        <aside className="order-2 lg:order-1 bg-white rounded-2xl p-4 sm:p-5 space-y-5 border border-slate-200/90 shadow-2xs min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Course Outline</h3>
            <span className="text-xs font-medium text-slate-500">
              {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          <div className="space-y-4">
            {course.modules?.map((mod, mIdx) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-50 text-[#0056D2] flex items-center justify-center font-mono text-[10px] shrink-0">
                    {mIdx + 1}
                  </span>
                  <span className="text-slate-800 break-words line-clamp-2">{mod.title}</span>
                </div>

                <div className="space-y-1">
                  {mod.lessons?.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isQuiz = lesson.type === "QUIZ";

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs font-semibold cursor-pointer ${
                          isActive
                            ? "bg-[#0056D2] text-white"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                          {isQuiz ? (
                            <HelpCircle
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-amber-200" : "text-amber-600"
                              }`}
                            />
                          ) : (
                            <Headphones
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-white" : "text-[#0056D2]"
                              }`}
                            />
                          )}
                          <span className="truncate min-w-0 flex-1">{lesson.title}</span>
                        </div>
                        {isQuiz && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            Quiz
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Main Viewer */}
        <main className="order-1 lg:order-2 bg-white rounded-2xl p-4 sm:p-8 border border-slate-200/90 shadow-2xs min-w-0 w-full">
          {!user ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs max-w-xl mx-auto">
              <div className="h-44 sm:h-52 relative overflow-hidden bg-slate-950">
                <img
                  src={course.coverImageUrl || "/hero-courses.png?v=1038"}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-900 border border-slate-200/80 shadow-2xs">
                  {course.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[11px] font-bold text-sky-400 block">{course.category || "Cyber Safety"}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{course.title}</h3>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 text-center">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Sign in to Start This Course
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Sign in or create a free account to read lessons, listen to audio narration, track your progress, and earn your verified completion certificate.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
                  <Link
                    to="/login"
                    state={{ from: location, intercepted: true }}
                    className="bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/register"
                    state={{ from: location, intercepted: true }}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-2.5 rounded-xl transition text-xs flex items-center justify-center"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            </div>
          ) : !enrolled ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs max-w-xl mx-auto">
              <div className="h-44 sm:h-52 relative overflow-hidden bg-slate-950">
                <img
                  src={course.coverImageUrl || "/hero-courses.png?v=1038"}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-900 border border-slate-200/80 shadow-2xs">
                  {course.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[11px] font-bold text-sky-400 block">{course.category || "Cyber Safety"}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{course.title}</h3>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Enroll for Free to Unlock All Lessons
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Enroll in <span className="font-semibold text-slate-900">{course.title}</span> to get unlimited access to every module, real voice audio narration, and certificate assessment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <BookOpen className="w-4 h-4 text-[#0056D2] shrink-0" />
                    <span>{course.modules?.length || 0} Modules ({totalLessons} Lessons)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Verifiable Certificate</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Headphones className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real Voice Read Aloud</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>100% Free Forever</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                  <span>{enrolling ? "Enrolling..." : "Enroll for Free & Begin"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !activeLesson ? (
            <p className="text-slate-500 text-sm text-center py-12">
              Select a lesson from the outline to begin.
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLesson.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {activeLesson.type === "QUIZ" && activeLesson.quiz ? (
                  <div className="text-center py-10 space-y-6 max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-amber-700">
                        Course Assessment
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                        {activeLesson.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-2">
                        Pass this assessment to verify your understanding and unlock your course certificate.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-medium">Passing score</span>
                        <span className="font-bold text-slate-900">
                          {activeLesson.quiz.passMarkPct}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="font-medium">Questions</span>
                        <span className="font-bold text-slate-900">
                          {activeLesson.quiz.questions?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="font-medium">Credential</span>
                        <span className="font-semibold text-emerald-700">
                          Verifiable Certificate
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/courses/${slug}/quiz/${activeLesson.quiz.id}`}
                      className="inline-flex items-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3.5 rounded-xl transition text-sm"
                    >
                      <span>Start Assessment Quiz</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-xs font-semibold text-[#0056D2]">Lesson</span>
                      <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                        {activeLesson.title}
                      </h2>
                    </div>

                    {/* Read-Aloud Narration Player with Synchronized Teleprompter Captions */}
                    <CourseAudioNarrator
                      title={activeLesson.title}
                      content={activeLesson.textContent}
                      activeSentenceIndex={activeSentenceIndex}
                      onSentenceChange={setActiveSentenceIndex}
                    />

                    {/* Lesson Material Container with Word Inspector Floating Definition Popover */}
                    <div ref={lessonContainerRef} className="relative pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                        <span className="font-semibold text-slate-800">Lesson Material</span>
                        <span className="italic text-[11px] text-slate-400">
                          Highlight any word for instant dictionary &amp; cybersecurity meaning
                        </span>
                      </div>

                      <div className="pt-4">
                        <FormattedLessonContent
                          content={activeLesson.textContent}
                          activeSentence={activeSentenceText}
                          onSentenceClick={(clickedText) => {
                            const cleanClick = clickedText.replace(/[*#_`]/g, "").trim().toLowerCase();
                            const idx = lessonSentences.findIndex(
                              (s) =>
                                s.toLowerCase().includes(cleanClick) ||
                                cleanClick.includes(s.toLowerCase())
                            );
                            if (idx !== -1) {
                              setActiveSentenceIndex(idx);
                            }
                          }}
                        />
                      </div>

                      {/* Interactive Floating Definition Box */}
                      <WordInspectorPopup containerRef={lessonContainerRef} />
                    </div>

                    {/* Hands-on Lesson Mini-Check */}
                    {activeLesson.title?.toLowerCase().includes("momo") ||
                    activeLesson.title?.toLowerCase().includes("url") ? (
                      <div className="mt-8 p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                        <div className="flex items-center gap-2 text-[#0056D2] font-bold text-sm">
                          <Shield className="w-4 h-4" />
                          <span>Practice Check: Inspect a Link</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Paste a sample SMS or website link to spot common phishing red flags.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="e.g. http://mtn-free-bonus.xyz"
                            value={phishInput}
                            onChange={(e) => setPhishInput(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0056D2]"
                          />
                          <button
                            type="button"
                            onClick={analyzePhishingUrl}
                            className="bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                          >
                            Check Link
                          </button>
                        </div>
                        {phishAnalysis && (
                          <div
                            className={`p-3 rounded-xl text-xs font-semibold ${
                              phishAnalysis.isPhish
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {phishAnalysis.reason}
                          </div>
                        )}
                      </div>
                    ) : activeLesson.title?.toLowerCase().includes("password") ? (
                      <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                          <Lock className="w-4 h-4 text-[#0056D2]" />
                          <span>Practice Check: Passphrase Strength</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Type a sample passphrase (never enter a real password you use elsewhere).
                        </p>
                        <input
                          type="text"
                          placeholder="Try a 4-word passphrase..."
                          value={testPassword}
                          onChange={(e) => setTestPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0056D2]"
                        />
                        {testPassword && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                              <span>Strength</span>
                              <span>{pwdRating.label}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${pwdRating.color}`}
                                style={{ width: `${pwdRating.score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Lesson Navigation Bar */}
                    {(() => {
                      const allLessons =
                        course.modules?.flatMap((m) => m.lessons || []) || [];
                      const currentLessonIdx = allLessons.findIndex(
                        (l) => l.id === activeLesson?.id
                      );
                      const prevLesson =
                        currentLessonIdx > 0 ? allLessons[currentLessonIdx - 1] : null;
                      const nextLesson =
                        currentLessonIdx < allLessons.length - 1
                          ? allLessons[currentLessonIdx + 1]
                          : null;
                      const quizLesson = allLessons.find(
                        (l) => l.type === "QUIZ" && l.quiz
                      );

                      return (
                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0">
                          <button
                            type="button"
                            onClick={() => prevLesson && setActiveLesson(prevLesson)}
                            disabled={!prevLesson}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous Lesson</span>
                          </button>

                          <span className="text-xs font-medium text-slate-500">
                            Lesson {currentLessonIdx + 1} of {allLessons.length}
                          </span>

                          {nextLesson ? (
                            <button
                              type="button"
                              onClick={() => setActiveLesson(nextLesson)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold transition cursor-pointer"
                            >
                              <span>Next Lesson</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : quizLesson?.quiz ? (
                            <Link
                              to={`/courses/${slug}/quiz/${quizLesson.quiz.id}`}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
                            >
                              <span>Start Assessment Quiz</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {showCertModal && (
        <CertificateModal
          certificate={
            earnedCert
              ? {
                  certRef: earnedCert.certRef,
                  courseTitle: course?.title,
                  issuedAt: earnedCert.issuedAt,
                }
              : undefined
          }
          studentName={user?.displayName}
          courseTitle={course?.title}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
}
