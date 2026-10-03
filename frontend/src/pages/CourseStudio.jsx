import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Video,
  UploadCloud,
  Subtitles,
  Loader2,
  Clock,
  Check,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import AccountSettingsView from "../components/AccountSettingsView";

export default function CourseStudio() {
  const { user } = useAuth();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [newCourse, setNewCourse] = useState({
    title: "",
    slug: "",
    description: "",
    ageBand: "JUNIOR",
    category: "",
    coverImageUrl: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [moduleForm, setModuleForm] = useState({ title: "", order: 1 });
  const [lessonForm, setLessonForm] = useState({
    moduleId: "",
    title: "",
    type: "TEXT",
    order: 1,
    videoUrl: "",
    textContent: "",
    transcript: "",
    transcriptSegments: null,
  });

  // Video Upload & Auto-Transcription state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [previewSegments, setPreviewSegments] = useState([]);
  const videoInputRef = useRef(null);

  const [publishLoading, setPublishLoading] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    if (!user) return;
    loadCourses();
  }, [user]);

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await api.get("/courses/mine");
      setCourses(res.data);
      if (!selectedCourseId && res.data.length > 0) {
        setSelectedCourseId(res.data[0].id);
      }
    } catch (error) {
      setStatus({ type: "error", message: "Unable to load your courses." });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse(event) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      let coverImageUrl = newCourse.coverImageUrl || null;

      if (coverPreview && coverPreview.startsWith("data:image")) {
        const uploadRes = await api.post("/uploads/image", { image: coverPreview });
        coverImageUrl = uploadRes.data?.url || coverImageUrl;
      }

      const { data } = await api.post("/courses", { ...newCourse, coverImageUrl });
      setStatus({ type: "success", message: "Course created with cover image. You can now add modules and lessons." });
      setNewCourse({ title: "", slug: "", description: "", ageBand: "JUNIOR", category: "", coverImageUrl: "" });
      setCoverFile(null);
      setCoverPreview("");
      await loadCourses();
      setSelectedCourseId(data.id);
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.error || "Unable to create course." });
    } finally {
      setSaving(false);
    }
  }

  function handleCoverFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setNewCourse((current) => ({ ...current, coverImageUrl: "" }));
  }

  async function addModule(event) {
    event.preventDefault();
    if (!selectedCourse) return;
    setStatus(null);

    try {
      await api.post(`/courses/${selectedCourse.id}/modules`, moduleForm);
      setStatus({ type: "success", message: "Module added." });
      setModuleForm({ title: "", order: selectedCourse.modules.length + 1 });
      await loadCourses();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.error || "Unable to add module." });
    }
  }

  async function handleVideoFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setVideoUploading(true);
    setStatus(null);
    setUploadProgressText(
      autoTranscribe
        ? "Uploading video & extracting Coursera-style AI transcripts with Google Gemini..."
        : "Uploading video..."
    );

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", lessonForm.title || file.name.replace(/\.[^/.]+$/, ""));

      const endpoint = autoTranscribe ? "/uploads/video-with-transcription" : "/uploads/video";
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.url) {
        setLessonForm((current) => ({
          ...current,
          videoUrl: res.data.url,
          transcript: res.data.transcript || current.transcript,
          transcriptSegments: res.data.transcriptSegments || current.transcriptSegments,
        }));

        if (res.data.transcriptSegments && res.data.transcriptSegments.length > 0) {
          setPreviewSegments(res.data.transcriptSegments);
          setStatus({
            type: "success",
            message: `Video uploaded successfully! ${res.data.transcriptSegments.length} synchronized Coursera-style transcript segments generated.`,
          });
        } else {
          setStatus({
            type: "success",
            message: "Video uploaded successfully.",
          });
        }
      }
    } catch (err) {
      console.error("Video upload failed:", err);
      setStatus({
        type: "error",
        message: err?.response?.data?.error || "Video upload failed. Please verify file type and size.",
      });
    } finally {
      setVideoUploading(false);
      setUploadProgressText("");
    }
  }

  async function handleTranscribeExistingUrl() {
    if (!lessonForm.videoUrl) return;
    setVideoUploading(true);
    setUploadProgressText("Analyzing audio and generating Coursera-style timestamps with Gemini AI...");
    try {
      const res = await api.post("/uploads/transcribe", {
        videoUrl: lessonForm.videoUrl,
        title: lessonForm.title || "Lecture Video",
      });
      if (res.data?.segments) {
        setLessonForm((current) => ({
          ...current,
          transcript: res.data.fullTranscript,
          transcriptSegments: res.data.segments,
        }));
        setPreviewSegments(res.data.segments);
        setStatus({
          type: "success",
          message: `Transcription complete! ${res.data.segments.length} timestamped segments created.`,
        });
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setStatus({
        type: "error",
        message: "Failed to transcribe video. Please verify the URL or try again.",
      });
    } finally {
      setVideoUploading(false);
      setUploadProgressText("");
    }
  }

  async function addLesson(event) {
    event.preventDefault();
    if (!selectedCourse) return;
    setStatus(null);

    try {
      await api.post(`/courses/${selectedCourse.id}/lessons`, lessonForm);
      setStatus({ type: "success", message: "Lesson added with video & transcript!" });
      setLessonForm((current) => ({
        ...current,
        title: "",
        order: current.order + 1,
        videoUrl: "",
        textContent: "",
        transcript: "",
        transcriptSegments: null,
      }));
      setVideoFile(null);
      setPreviewSegments([]);
      if (videoInputRef.current) videoInputRef.current.value = "";
      await loadCourses();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.error || "Unable to add lesson." });
    }
  }

  async function createQuiz(lessonId) {
    if (!selectedCourse) return;
    setStatus(null);

    try {
      await api.post(`/lessons/${lessonId}/quiz`, { passMarkPct: 70 });
      setStatus({ type: "success", message: "Quiz created for this lesson." });
      await loadCourses();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.error || "Unable to create quiz." });
    }
  }

  async function publishCourse() {
    if (!selectedCourse) return;
    setPublishLoading(true);
    setStatus(null);

    try {
      await api.patch(`/courses/${selectedCourse.id}/publish`);
      setStatus({ type: "success", message: "Course published and now visible to learners." });
      await loadCourses();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.error || "Unable to publish course." });
    } finally {
      setPublishLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-xl border border-line bg-paper p-10 text-center">
          <p className="text-mist mb-4">You must be logged in as a tutor or admin to build courses.</p>
          <div className="flex justify-center gap-4">
            <Link to="/login" state={{ from: location, intercepted: true }} className="text-sm font-semibold text-guard">Log in</Link>
            <Link to="/register" state={{ from: location, intercepted: true }} className="text-sm font-semibold bg-guard text-white px-4 py-2 rounded-md">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Course Studio Header Banner with Background Image */}
      <div className="bg-[#001E3C] rounded-3xl p-8 sm:p-10 relative overflow-hidden text-white border border-slate-800 shadow-xl min-h-[180px] flex items-center justify-between flex-col md:flex-row gap-6">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 scale-105"
          style={{ backgroundImage: "url('/hero-courses.png?v=1038')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/50" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Build and Publish Your Course</h1>
          <p className="text-slate-200 text-sm leading-relaxed font-medium">
            Create interactive modules, upload high-res cover photos, add text, video, and quiz lessons for Ghanaian youth learners.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3.5 text-sm backdrop-blur-md border border-white/20 shadow-md transition cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Profile & Settings</span>
          </button>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 text-sm shadow-xl transition"
          >
            <ArrowRight className="w-4 h-4" /> View Published Catalog
          </Link>
        </div>
      </div>

      {status && (
        <div className={`mb-8 rounded-xl p-4 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-alert/10 text-alert"}`}>
          {status.message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[320px_1fr] items-start">
        <aside className="space-y-6 lg:sticky lg:top-20">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Your Courses</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a course to manage modules and lessons.</p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700 font-mono">
                {courses.length}
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="text-xs text-slate-400">No course created yet. Use the form below to start a new one.</p>
            ) : (
              <div className="space-y-2.5">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                      selectedCourseId === course.id
                        ? "border-blue-500 bg-blue-50/50 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{course.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{course.slug}</p>
                      </div>
                      {course.isPublished ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Draft</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0056D2] font-bold flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-circle-user"></i>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName}</p>
                <p className="text-[10px] text-slate-500 font-mono capitalize">{user?.role?.toLowerCase()} Author</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Edit Profile & Picture"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4">Create a New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <label className="block">
                <span className="text-sm font-semibold">Course title</span>
                <input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                  placeholder="E.g. Mobile money scam awareness"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Slug</span>
                <input
                  value={newCourse.slug}
                  onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                  placeholder="mobile-money-scam-awareness"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Age band</span>
                <select
                  value={newCourse.ageBand}
                  onChange={(e) => setNewCourse({ ...newCourse, ageBand: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                >
                  <option value="JUNIOR">12–18</option>
                  <option value="YOUNG_ADULT">19–23</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Category</span>
                <input
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                  placeholder="E.g. Fraud Awareness"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Description</span>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows="3"
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                  placeholder="Short course summary"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Course cover image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                />
                <p className="text-xs text-mist mt-2">Optional: upload an image for your course card.</p>
              </label>
              {coverPreview ? (
                <div className="mt-4 rounded-3xl overflow-hidden border border-line bg-paper">
                  <img src={coverPreview} alt="Course preview" className="h-40 w-full object-cover" />
                </div>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-guard px-5 py-3 text-sm font-semibold text-white hover:bg-guardLight disabled:opacity-60"
              >
                <Plus className="w-4 h-4" /> Create course
              </button>
            </form>
          </section>
        </aside>

        <section className="space-y-6">
          {!selectedCourse ? (
            <div className="rounded-3xl border border-line bg-paper p-10 text-center">
              <p className="font-semibold">Select a course from the left panel to start building it.</p>
              <p className="text-sm text-mist mt-3">Create a draft first, then add modules, lessons, and quizzes.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-line bg-paper p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Course Details
                    </div>
                    <h2 className="text-2xl font-semibold">{selectedCourse.title}</h2>
                    <p className="text-sm text-mist mt-2">{selectedCourse.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedCourse.isPublished ? "bg-green-50 text-green-700" : "bg-mist/10 text-mist"}`}>
                      {selectedCourse.isPublished ? "Published" : "Draft"}
                    </span>
                    <button
                      onClick={publishCourse}
                      disabled={selectedCourse.isPublished || publishLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-guard px-4 py-2 text-sm font-semibold text-white hover:bg-guardLight disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Publish course
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                  <section className="rounded-3xl border border-line bg-paper p-6">
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-semibold">Modules</h3>
                        <p className="text-sm text-mist">Add sections that group lessons and quizzes.</p>
                      </div>
                    </div>

                    {selectedCourse.modules.length === 0 ? (
                      <p className="text-mist">No modules yet. Add one to start building content.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedCourse.modules.map((module) => (
                          <div key={module.id} className="rounded-3xl border border-line bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div>
                                <p className="font-semibold">{module.order}. {module.title}</p>
                                <p className="text-xs text-mist">{module.lessons.length} lesson(s)</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {module.lessons.map((lesson) => (
                                <div key={lesson.id} className="rounded-2xl border border-line bg-paper p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold">{lesson.order}. {lesson.title}</p>
                                      <p className="text-xs text-mist">{lesson.type} lesson</p>
                                    </div>
                                    {lesson.type === "QUIZ" && lesson.quiz ? (
                                      <span className="rounded-full bg-guard/10 px-2 py-1 text-[11px] font-semibold text-guard">Quiz ready</span>
                                    ) : lesson.type === "QUIZ" ? (
                                      <button
                                        onClick={() => createQuiz(lesson.id)}
                                        className="rounded-full border border-guard px-3 py-1 text-xs font-semibold text-guard hover:bg-guard/5"
                                      >
                                        Add quiz
                                      </button>
                                    ) : null}
                                  </div>

                                  {lesson.quiz && (
                                    <div className="mt-4 rounded-2xl border border-line bg-slate-50 p-4">
                                      <div className="flex items-center justify-between gap-2 mb-3">
                                        <p className="text-sm font-semibold">Quiz questions</p>
                                        <span className="text-xs text-mist">{lesson.quiz.questions.length} question(s)</span>
                                      </div>
                                      {lesson.quiz.questions.length === 0 ? (
                                        <p className="text-sm text-mist">No questions yet. Add one below.</p>
                                      ) : (
                                        <ul className="space-y-3">
                                          {lesson.quiz.questions.map((question) => (
                                            <li key={question.id} className="rounded-2xl border border-line bg-paper p-3">
                                              <p className="text-sm font-semibold">{question.order}. {question.prompt}</p>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                      <AddQuestionForm
                                        quiz={lesson.quiz}
                                        onCreated={loadCourses}
                                        setStatus={setStatus}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-line bg-paper p-6">
                    <h3 className="text-lg font-semibold mb-4">Add a lesson</h3>
                    <form onSubmit={addLesson} className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold">Module</span>
                        <select
                          value={lessonForm.moduleId}
                          onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                        >
                          <option value="">Select module</option>
                          {selectedCourse.modules.map((module) => (
                            <option key={module.id} value={module.id}>{module.title}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold">Lesson title</span>
                        <input
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                          placeholder="E.g. Recognizing scam messages"
                        />
                      </label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-semibold">Type</span>
                          <select
                            value={lessonForm.type}
                            onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                          >
                            <option value="TEXT">Text</option>
                            <option value="VIDEO">Video</option>
                            <option value="QUIZ">Quiz</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-semibold">Lesson order</span>
                          <input
                            type="number"
                            min="1"
                            value={lessonForm.order}
                            onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
                            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                          />
                        </label>
                      </div>
                      {lessonForm.type === "VIDEO" && (
                        <div className="space-y-4 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-900/30 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold flex items-center gap-2">
                              <Video className="w-4 h-4 text-blue-600" />
                              Video Lecture & Automatic Transcription
                            </span>
                            <span className="text-[11px] font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full font-bold">
                              Coursera Style
                            </span>
                          </div>

                          {/* Direct Video File Upload Box */}
                          <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 text-center bg-white dark:bg-slate-800/60 hover:border-blue-500 transition">
                            <input
                              ref={videoInputRef}
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/mov,video/m4v"
                              onChange={handleVideoFileUpload}
                              className="hidden"
                              id="lecture-video-input"
                              disabled={videoUploading}
                            />
                            <label
                              htmlFor="lecture-video-input"
                              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-xs">
                                {videoUploading ? (
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                  <UploadCloud className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                  {videoUploading
                                    ? "Processing video & audio…"
                                    : videoFile
                                    ? videoFile.name
                                    : "Click to upload lecture video file (.mp4, .webm, .mov)"}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {videoFile
                                    ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`
                                    : "Max file size: 250MB"}
                                </p>
                              </div>
                            </label>

                            {/* Auto-transcribe checkbox */}
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2">
                              <input
                                type="checkbox"
                                id="autoTranscribe"
                                checked={autoTranscribe}
                                onChange={(e) => setAutoTranscribe(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                              />
                              <label htmlFor="autoTranscribe" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1 font-medium">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Auto-transcribe audio with Google Gemini AI (Coursera timestamps)
                              </label>
                            </div>

                            {/* Progress indicator */}
                            {videoUploading && (
                              <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{uploadProgressText}</span>
                              </div>
                            )}
                          </div>

                          {/* Fallback Manual Video URL Input */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Or Video URL (if already hosted)
                              </label>
                              {lessonForm.videoUrl && (
                                <button
                                  type="button"
                                  onClick={handleTranscribeExistingUrl}
                                  disabled={videoUploading}
                                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Transcribe with Gemini
                                </button>
                              )}
                            </div>
                            <input
                              value={lessonForm.videoUrl}
                              onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                              className="w-full rounded-2xl border border-line px-4 py-2.5 text-xs bg-white dark:bg-slate-800"
                              placeholder="https:// or /uploads/videos/..."
                            />
                          </div>

                          {/* Preview Generated Transcript Segments */}
                          {previewSegments.length > 0 && (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Subtitles className="w-3.5 h-3.5 text-emerald-600" />
                                  Generated Transcript ({previewSegments.length} Segments)
                                </span>
                                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
                                  Synced
                                </span>
                              </div>
                              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px]">
                                {previewSegments.map((seg, idx) => (
                                  <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 font-mono font-bold text-blue-700 dark:text-blue-300 text-[10px] shrink-0">
                                      {seg.start}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300 leading-snug">{seg.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(lessonForm.type === "TEXT" || lessonForm.type === "QUIZ") && (
                        <label className="block">
                          <span className="text-sm font-semibold">Text content</span>
                          <textarea
                            value={lessonForm.textContent}
                            onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })}
                            rows="4"
                            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                            placeholder={lessonForm.type === "QUIZ" ? "Quiz description or instructions" : "Lesson content"}
                          />
                        </label>
                      )}
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl bg-guard px-5 py-3 text-sm font-semibold text-white hover:bg-guardLight"
                      >
                        <Plus className="w-4 h-4" /> Add lesson
                      </button>
                    </form>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-3xl border border-line bg-paper p-6">
                    <h3 className="text-lg font-semibold mb-4">Add a module</h3>
                    <form onSubmit={addModule} className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold">Module title</span>
                        <input
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                          placeholder="E.g. Scams and social engineering"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold">Module order</span>
                        <input
                          type="number"
                          min="1"
                          value={moduleForm.order}
                          onChange={(e) => setModuleForm({ ...moduleForm, order: Number(e.target.value) })}
                          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
                        />
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl bg-guard px-5 py-3 text-sm font-semibold text-white hover:bg-guardLight"
                      >
                        <Plus className="w-4 h-4" /> Add module
                      </button>
                    </form>
                  </section>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Account Settings Modal Drawer */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] overflow-y-auto">
            <AccountSettingsView isModal onClose={() => setShowSettingsModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddQuestionForm({ quiz, onCreated, setStatus }) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.post(`/quizzes/${quiz.id}/questions`, {
        prompt,
        options,
        correctIndex,
        order: quiz.questions.length + 1,
      });
      setStatus({ type: "success", message: "Question added." });
      setPrompt("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      await onCreated();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.error || "Unable to add question." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-paper p-4">
      <label className="block">
        <span className="text-sm font-semibold">Question prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows="3"
          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
          placeholder="Enter the quiz question"
        />
      </label>
      {options.map((option, index) => (
        <label key={index} className="block">
          <span className="text-sm font-semibold">Option {index + 1}</span>
          <input
            value={option}
            onChange={(e) => setOptions((current) => current.map((opt, idx) => (idx === index ? e.target.value : opt)))}
            className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
            placeholder={`Answer option ${index + 1}`}
          />
        </label>
      ))}
      <label className="block">
        <span className="text-sm font-semibold">Correct option</span>
        <select
          value={correctIndex}
          onChange={(e) => setCorrectIndex(Number(e.target.value))}
          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm"
        >
          {options.map((_, index) => (
            <option key={index} value={index}>Option {index + 1}</option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-2xl bg-guard px-5 py-3 text-sm font-semibold text-white hover:bg-guardLight disabled:opacity-60"
      >
        Add question
      </button>
    </form>
  );
}

