import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { CheckCircle2, PlayCircle, FileText, HelpCircle, Award, ChevronLeft, ChevronRight, Sparkles, BookOpen, Shield, Lock, Eye, ArrowRight, Clock, RotateCcw } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "../components/CyberSpinner";
import FormattedLessonContent from "../components/FormattedLessonContent";
import CertificateModal from "../components/CertificateModal";
import CourseraVideoPlayer from "../components/CourseraVideoPlayer";

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [message, setMessage] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Callback when a lesson is transcribed or updated dynamically
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

  // Interactive Widget States
  const [testPassword, setTestPassword] = useState("");
  const [phishInput, setPhishInput] = useState("");
  const [phishAnalysis, setPhishAnalysis] = useState(null);

  const [enrollment, setEnrollment] = useState(null);

  useEffect(() => {
    api.get(`/courses/${slug}`).then(async (res) => {
      setCourse(res.data);
      const firstLesson = res.data.modules?.[0]?.lessons?.[0];
      setActiveLesson(firstLesson || null);
      setMessage("");

      if (user && res.data?.id) {
        try {
          const enrollRes = await api.get(`/courses/${res.data.id}/enrollment`);
          setEnrolled(!!enrollRes.data?.enrolled);
          setEnrollment(enrollRes.data?.enrollment || null);
        } catch (e) {
          setEnrolled(false);
          setEnrollment(null);
        }
      } else {
        setEnrolled(false);
        setEnrollment(null);
      }
    });
  }, [slug, user]);

  async function handleEnroll() {
    if (!user) {
      setMessage("Please log in or create an account to enroll.");
      return;
    }
    if (!course) return;
    setEnrolling(true);
    try {
      await api.post(`/courses/${course.id}/enroll`);
      setEnrolled(true);
      setMessage("Enrolled successfully! You now have full access to all lessons and quizzes.");
    } catch (error) {
      setMessage("Unable to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  }

  function analyzePhishingUrl() {
    if (!phishInput) return;
    const lower = phishInput.toLowerCase();
    let isPhish = false;
    let reason = "This URL appears to match expected domain structures.";

    if (lower.includes("free") || lower.includes("bonus") || lower.includes("login-") || lower.includes("verify-")) {
      isPhish = true;
      reason = "Suspicious keywords detected ('free', 'bonus', 'verify'). High risk of phishing!";
    } else if (lower.includes("192.168") || lower.includes(".xyz") || lower.includes(".top")) {
      isPhish = true;
      reason = "Unsafe domain extension or raw IP address detected!";
    } else if (lower.includes("mtn.com.gh") || lower.includes("ecobank.com")) {
      isPhish = false;
      reason = "Legitimate verified domain structure.";
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

    if (score < 50) return { score, label: "Weak", color: "bg-red-500" };
    if (score < 75) return { score, label: "Moderate", color: "bg-amber-500" };
    return { score, label: "Unbreakable Fortress", color: "bg-emerald-500" };
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <CyberSpinner size="lg" label="Loading Interactive Learning Experience..." />
      </div>
    );
  }

  const pwdRating = evaluatePasswordStrength(testPassword);

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Full-Width Course Cover Photo Header Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white min-h-[420px] flex items-center border-b border-slate-200">
        {/* Full Course Cover Background Photo Layer */}
        {course.coverImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85 scale-105 transition-transform duration-1000"
            style={{ backgroundImage: `url('${course.coverImageUrl}')` }}
          />
        )}
        
        {/* Dark High-Contrast Gradient Readability Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10 w-full grid lg:grid-cols-[1fr_360px] gap-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <Link to="/courses" className="hover:underline">Courses</Link>
              <span>/</span>
              <span>{course.category}</span>
              <span>/</span>
              <span>{course.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-blue-300 block mb-1">
                CyberGuard National COP Academy
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                {course.title}
              </h1>
            </div>

            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed font-medium drop-shadow-sm">
              {course.description}
            </p>
            
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-200 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                4.9 ★ <span className="text-slate-300 font-normal">(420 ratings)</span>
              </span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> Approx. 45 Mins</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-400" /> {course.modules?.length || 0} Modules</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> Certificate Included</span>
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-300">
              <div className="w-8 h-8 rounded-full bg-[#0056D2] text-white flex items-center justify-center font-bold text-xs shadow-md">
                AB
              </div>
              <div>
                <span className="text-white font-bold block">Instructor: Ama Boateng</span>
                <span className="text-[11px] text-slate-300">Senior Cybersecurity Specialist</span>
              </div>
            </div>
          </div>

          {/* Standalone Enroll/Continue CTA Section */}
          <div className="space-y-4 bg-slate-950/80 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400">
                {enrolled ? "Enrolled & Active" : "Free Enrollment Active"}
              </span>
              <h3 className="text-lg font-bold text-white">
                {enrolled ? "My Course Progress" : "Start Learning Today"}
              </h3>
              <p className="text-xs text-slate-300">
                {enrolled
                  ? "Access interactive modules, complete quiz challenges, or retake lessons."
                  : "Gain instant access to interactive modules & official COP certificate."}
              </p>
            </div>

            {enrolled ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const firstLesson = course.modules?.[0]?.lessons?.[0];
                    if (firstLesson) setActiveLesson(firstLesson);
                  }}
                  className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-600/30 transition hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> {enrollment?.progressPct >= 100 ? "Retake Course / Review Content" : "Continue Course"}
                </button>

                {enrollment?.progressPct >= 100 || enrollment?.status === "COMPLETED" ? (
                  <button
                    onClick={() => setShowCertModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
                  >
                    <Award className="w-4 h-4" /> View & Export Certificate (Unlocked)
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Certificate Locked ({enrollment?.progressPct || 0}% Complete)</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-600/30 transition hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {enrolling ? "Enrolling…" : "Enroll Now in Course (Free)"}
              </button>
            )}

            {message && <p className="text-xs text-emerald-400 font-bold text-center mt-2">{message}</p>}
            <p className="text-[11px] text-slate-400 text-center">100% Free · Flexible Schedule · Verifiable Certificate</p>
          </div>
        </div>
      </div>

      {/* Main Course Player Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[340px_1fr] gap-8">
        {/* Left Sidebar: Curriculum Navigator */}
        <aside className="glass-card rounded-3xl p-5 space-y-6 h-fit border border-line shadow-lg">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Course Content</h3>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Lessons
            </span>
          </div>

          <div className="space-y-4">
            {course.modules?.map((mod, mIdx) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-xs font-bold text-mist uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono text-[10px]">
                    {mIdx + 1}
                  </span>
                  {mod.title}
                </div>

                <div className="space-y-1">
                  {mod.lessons?.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isQuiz = lesson.type === "QUIZ";

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs font-semibold ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "bg-paper hover:bg-black/5 dark:hover:bg-white/5 text-ink border border-line/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {isQuiz ? (
                            <HelpCircle className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-300" : "text-amber-500"}`} />
                          ) : lesson.type === "VIDEO" ? (
                            <PlayCircle className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-blue-500"}`} />
                          ) : (
                            <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {isQuiz && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? "bg-amber-400/30 text-amber-200" : "bg-amber-500/10 text-amber-600"
                          }`}>
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
        <main className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-line shadow-xl">
          {!user ? (
            /* Unauthenticated Lock Screen */
            <div className="text-center py-16 px-4 space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">
                  Sign In Required
                </span>
                <h2 className="text-2xl font-black text-ink mt-1">Sign In to Access Course</h2>
                <p className="text-sm text-mist mt-2 leading-relaxed">
                  Please log in or create a student account to access full course lessons, interactive tools, and quiz challenges.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center gap-2"
                >
                  Sign In to Access <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  state={{ from: location }}
                  className="border border-line bg-paper text-ink font-bold px-6 py-3 rounded-xl hover:border-slate-400 transition text-sm flex items-center justify-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          ) : !enrolled ? (
            /* Authenticated but Not Enrolled Lock Screen */
            <div className="text-center py-16 px-4 space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                  Enrollment Required
                </span>
                <h2 className="text-2xl font-black text-ink mt-1">Enroll to Unlock Lessons</h2>
                <p className="text-sm text-mist mt-2 leading-relaxed">
                  Enroll in <span className="font-bold text-ink">{course.title}</span> to gain access to all modules, hands-on simulators, and certificates.
                </p>
              </div>

              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-600/30 transition hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {enrolling ? "Enrolling..." : "Enroll Now in Course (Free)"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : !activeLesson ? (
            <p className="text-mist text-center py-12">Select a lesson from the sidebar to begin.</p>
          ) : activeLesson.type === "QUIZ" && activeLesson.quiz ? (
            /* Dedicated Quiz Launcher Card */
            <div className="text-center py-10 space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                  Interactive Assessment
                </span>
                <h2 className="text-3xl font-black text-ink mt-1">{activeLesson.title}</h2>
                <p className="text-sm text-mist mt-2">
                  Test your cybersecurity instincts in our dedicated fullscreen quiz challenge.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-line text-left text-xs space-y-2">
                <div className="flex justify-between text-ink font-bold">
                  <span>Pass Threshold:</span>
                  <span>{activeLesson.quiz.passMarkPct}% Score</span>
                </div>
                <div className="flex justify-between text-ink font-bold">
                  <span>Questions Count:</span>
                  <span>{activeLesson.quiz.questions?.length || 5} Questions</span>
                </div>
                <div className="flex justify-between text-ink font-bold">
                  <span>XP Reward:</span>
                  <span className="text-amber-500">+100 Points</span>
                </div>
              </div>

              <Link
                to={`/courses/${slug}/quiz/${activeLesson.quiz.id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition hover:scale-105"
              >
                Launch Dedicated Quiz Challenge <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            /* Regular Text or Video Lesson Content */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    Lesson Content
                  </span>
                  <h2 className="text-2xl font-black text-ink mt-1">{activeLesson.title}</h2>
                </div>
              </div>

              {activeLesson.type === "VIDEO" ? (
                <CourseraVideoPlayer
                  lesson={activeLesson}
                  onLessonUpdate={handleLessonUpdated}
                />
              ) : (
                <FormattedLessonContent content={activeLesson.textContent} />
              )}

              {/* Embedded Interactive Hands-On Simulator Widgets */}
              {activeLesson.title?.toLowerCase().includes("momo") || activeLesson.title?.toLowerCase().includes("url") ? (
                <div className="mt-8 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <Shield className="w-5 h-5" />
                    Interactive Hands-On Tool: URL Phishing Analyzer
                  </div>
                  <p className="text-xs text-mist">Test suspicious SMS or website links to detect typosquatting tricks.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. http://mtn-free-bonus.xyz"
                      value={phishInput}
                      onChange={(e) => setPhishInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-paper text-sm text-ink focus:outline-none"
                    />
                    <button
                      onClick={analyzePhishingUrl}
                      className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
                    >
                      Analyze Link
                    </button>
                  </div>
                  {phishAnalysis && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${phishAnalysis.isPhish ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                      {phishAnalysis.reason}
                    </div>
                  )}
                </div>
              ) : activeLesson.title?.toLowerCase().includes("password") ? (
                <div className="mt-8 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    <Lock className="w-5 h-5" />
                    Interactive Hands-On Tool: Password Strength Tester
                  </div>
                  <p className="text-xs text-mist">Type a passphrase to test its brute-force resistance score.</p>
                  <input
                    type="text"
                    placeholder="Type a sample passphrase..."
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-line bg-paper text-sm text-ink focus:outline-none font-mono"
                  />
                  {testPassword && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Strength Score:</span>
                        <span>{pwdRating.label}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${pwdRating.color}`} style={{ width: `${pwdRating.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Slide Navigation Control Bar with Next/Prev Buttons */}
              {(() => {
                const allLessons = course.modules?.flatMap((m) => m.lessons || []) || [];
                const currentLessonIdx = allLessons.findIndex((l) => l.id === activeLesson?.id);
                const prevLesson = currentLessonIdx > 0 ? allLessons[currentLessonIdx - 1] : null;
                const nextLesson = currentLessonIdx < allLessons.length - 1 ? allLessons[currentLessonIdx + 1] : null;
                const quizLesson = allLessons.find((l) => l.type === "QUIZ" && l.quiz);

                return (
                  <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => prevLesson && setActiveLesson(prevLesson)}
                      disabled={!prevLesson}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-line bg-paper text-sm font-bold text-ink hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous Slide
                    </button>

                    <span className="text-xs font-mono font-bold text-mist">
                      Slide {currentLessonIdx + 1} of {allLessons.length}
                    </span>

                    {nextLesson ? (
                      <button
                        type="button"
                        onClick={() => setActiveLesson(nextLesson)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white text-sm font-bold shadow-md transition hover:scale-[1.02]"
                      >
                        Next Slide <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : quizLesson?.quiz ? (
                      <Link
                        to={`/courses/${slug}/quiz/${quizLesson.quiz.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold shadow-md transition hover:scale-[1.02]"
                      >
                        Proceed to Quiz Challenge <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {showCertModal && (
        <CertificateModal
          studentName={user?.displayName}
          courseTitle={course?.title}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
}


