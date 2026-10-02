import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Award, ShieldCheck, RefreshCw, Sparkles, HelpCircle, Trophy, Lock } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CertificateModal from "../components/CertificateModal";
import CyberSpinner from "../components/CyberSpinner";

export default function QuizPage() {
  const { slug, quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [message, setMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  async function fetchQuiz() {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/quizzes/${quizId}`);
      setQuiz(data);
    } catch (err) {
      console.error("Failed to load quiz", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(qId, optionIdx) {
    if (result) return; // Prevent changing after submit
    setAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  }

  async function handleSubmit() {
    if (!user) {
      setMessage("Please log in to submit your quiz attempt.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await api.post(`/courses/quizzes/${quizId}/attempt`, { answers });
      setResult(data);
      if (data.passed) {
        setShowConfetti(true);
        try {
          const courseId = quiz?.lesson?.module?.course?.id;
          if (courseId) {
            await api.post(`/courses/${courseId}/progress`, { progressPct: 100 });
          }
        } catch (e) {
          // ignore error if progress already logged
        }
      }
    } catch (err) {
      setMessage("Failed to submit quiz attempt. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function claimCert() {
    try {
      const courseId = quiz?.lesson?.module?.course?.id;
      if (!courseId) {
        setMessage("Course information missing. Cannot claim certificate.");
        return;
      }
      const { data } = await api.post(`/courses/${courseId}/certificate`);
      setCertificate(data);
      setMessage("Certificate generated! Your verification code is below.");
    } catch (err) {
      setMessage(err?.response?.data?.error || "Could not generate certificate.");
    }
  }

  function resetQuiz() {
    setAnswers({});
    setCurrentIdx(0);
    setResult(null);
    setShowConfetti(false);
    setMessage("");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <CyberSpinner size="lg" label="Loading Knowledge Check Challenge..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">
            Sign In Required
          </span>
          <h2 className="text-2xl font-black text-ink mt-1">Sign In to Take Quiz</h2>
          <p className="text-sm text-mist mt-2 leading-relaxed">
            You must be signed into your CyberGuard student account to complete quizzes, submit attempts, and earn certificates.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/login"
            state={{ from: location }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center gap-2"
          >
            Sign In to Start Quiz <ArrowRight className="w-4 h-4" />
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
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <HelpCircle className="w-12 h-12 text-mist mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-ink">Quiz Not Found</h2>
        <p className="text-mist mt-2 mb-6">The requested quiz could not be located or has been moved.</p>
        <Link to={`/courses/${slug}`} className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </Link>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === totalQ;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-amber-500/10 blur-3xl pointer-events-none" />

      {/* Confetti Animation Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce bg-amber-400/20 text-amber-500 p-6 rounded-full border border-amber-400/40 backdrop-blur-md">
            <Trophy className="w-20 h-20 animate-pulse" />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-line">
          <div>
            <Link
              to={`/courses/${quiz.lesson?.module?.course?.slug || slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-mist hover:text-blue-500 transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to {quiz.lesson?.module?.course?.title || "Course"}
            </Link>
            <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {quiz.lesson?.title || "Knowledge Check"}
            </h1>
            <p className="text-xs text-mist font-medium mt-0.5">
              Module: {quiz.lesson?.module?.title} · Pass Mark: <span className="text-ink font-bold">{quiz.passMarkPct}%</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              +50 XP Challenge
            </div>
            <div className="bg-slate-200 dark:bg-slate-800 text-ink text-xs font-mono font-bold px-3 py-1.5 rounded-xl">
              {answeredCount}/{totalQ} Answered
            </div>
          </div>
        </div>

        {/* Global Quiz Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
          />
        </div>

        {/* Main Quiz Card */}
        {!result ? (
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
            {/* Question Tracker Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-mist font-semibold">
                Question {currentIdx + 1} of {totalQ}
              </span>
              <div className="flex gap-1.5">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                      currentIdx === idx
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : answers[q.id] !== undefined
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-mist hover:text-ink"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Prompt */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                {currentQ.prompt}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((optText, oIdx) => {
                const isSelected = answers[currentQ.id] === oIdx;
                const optionLabel = String.fromCharCode(65 + oIdx); // A, B, C, D

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQ.id, oIdx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                      isSelected
                        ? "border-blue-600 bg-blue-600/10 dark:bg-blue-500/10 text-ink ring-2 ring-blue-600/30 shadow-md"
                        : "border-line bg-paper hover:border-blue-500/40 text-ink/90 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-800 text-mist"
                      }`}
                    >
                      {optionLabel}
                    </div>
                    <span className="text-sm font-medium leading-relaxed pt-0.5">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit Buttons */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line bg-paper text-sm font-semibold text-mist hover:text-ink hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {currentIdx < totalQ - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.min(totalQ - 1, prev + 1))}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isAllAnswered || submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition"
                >
                  {submitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" /> Grading Answers…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Submit Quiz Attempt
                    </>
                  )}
                </button>
              )}
            </div>

            {!isAllAnswered && (
              <p className="text-xs text-amber-500 font-medium text-center flex items-center justify-center gap-1.5">
                Please answer all {totalQ} questions before submitting your quiz.
              </p>
            )}
          </div>
        ) : (
          /* Quiz Results View */
          <div className="glass-card rounded-3xl p-8 space-y-8 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30 mx-auto">
              {result.passed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10 text-red-300" />}
            </div>

            <div>
              <span className={`text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                result.passed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-600 border border-red-500/30"
              }`}>
                {result.passed ? "QUIZ PASSED" : "CHALLENGE UNMET"}
              </span>

              <h2 className="text-3xl font-black text-ink mt-3">
                Your Score: <span className={result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>{result.scorePct}%</span>
              </h2>
              <p className="text-sm text-mist mt-1">
                Pass mark requirement is <span className="font-bold text-ink">{result.passMarkPct}%</span>.
              </p>
            </div>

            {/* Score Breakdown Bar */}
            <div className="max-w-md mx-auto bg-slate-200 dark:bg-slate-800 p-4 rounded-2xl text-left space-y-2">
              <div className="flex justify-between text-xs font-bold text-ink">
                <span>Result Summary</span>
                <span>{result.passed ? "+100 XP Awarded!" : "Try again to earn XP"}</span>
              </div>
              <div className="w-full bg-slate-300 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    result.passed ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{ width: `${result.scorePct}%` }}
                />
              </div>
            </div>

            {message && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-semibold max-w-md mx-auto">
                {message}
              </div>
            )}

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {result.passed ? (
                <>
                  <button
                    onClick={claimCert}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-amber-500/30 transition hover:scale-105"
                  >
                    <Award className="w-5 h-5" /> Claim Official Certificate
                  </button>
                  <Link
                    to={`/courses/${quiz.lesson?.module?.course?.slug || slug}`}
                    className="inline-flex items-center gap-2 border border-line bg-paper text-ink font-bold px-6 py-3.5 rounded-2xl hover:border-slate-400 transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Return to Course
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={resetQuiz}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake Quiz
                  </button>
                  <Link
                    to={`/courses/${quiz.lesson?.module?.course?.slug || slug}`}
                    className="inline-flex items-center gap-2 border border-line bg-paper text-mist hover:text-ink font-bold px-6 py-3.5 rounded-2xl transition"
                  >
                    Review Lesson Material
                  </Link>
                </>
              )}
            </div>

            {/* Issued Certificate Modal Generator */}
            {certificate && (
              <CertificateModal
                certificate={certificate}
                studentName={user?.displayName}
                courseTitle={quiz?.lesson?.module?.course?.title}
                onClose={() => setCertificate(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
