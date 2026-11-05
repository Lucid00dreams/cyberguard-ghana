import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Video,
  Award,
  BookOpen,
  ArrowRight,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  Search,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  LogOut,
  Globe,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "../components/CyberSpinner";
import CertificateModal from "../components/CertificateModal";
import AccountSettingsView from "../components/AccountSettingsView";
import CyberGuardLogo from "../components/CyberGuardLogo";
import UserAvatar from "../components/UserAvatar";

function normalizeTab(tab) {
  if (tab === "security") return "settings";
  if (["courses", "certificates", "mentorship", "settings"].includes(tab)) {
    return tab;
  }
  return "courses";
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const mainScrollRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  if (user?.role === "ADMIN" || user?.role === "CSA_OFFICER") {
    return <Navigate to="/admin" replace />;
  }

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => normalizeTab(searchParams.get("tab")));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [courseFilter, setCourseFilter] = useState("all");
  const [courseSearch, setCourseSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(normalizeTab(tabParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const handleTabChange = (tabKey) => {
    const next = normalizeTab(tabKey);
    setActiveTab(next);
    setSearchParams({ tab: next });
    setMobileSidebarOpen(false);
    mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [bookingsRes, enrollmentsRes, certsRes] = await Promise.all([
        api.get("/tutors/bookings/mine").catch(() => ({ data: [] })),
        api.get("/courses/my-enrollments").catch(() => ({ data: [] })),
        api.get("/courses/my-certificates").catch(() => ({ data: [] })),
      ]);
      setBookings(bookingsRes.data || []);
      setMyEnrollments(enrollmentsRes.data || []);
      setMyCertificates(certsRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const certByCourseId = useMemo(() => {
    const map = new Map();
    for (const cert of myCertificates) {
      const cId = cert.courseId || cert.course?.id;
      if (cId) map.set(cId, cert);
    }
    return map;
  }, [myCertificates]);

  const completedEnrollments = myEnrollments.filter(
    (e) => e.progressPct >= 100 || e.status === "COMPLETED"
  );
  const inProgressEnrollments = myEnrollments.filter(
    (e) => (e.progressPct || 0) < 100 && e.status !== "COMPLETED"
  );

  // Merge official issued certificates with completed enrollments so real certRef is always used
  const earnedCredentials = useMemo(() => {
    if (myCertificates.length > 0) {
      return myCertificates.map((cert) => ({
        id: cert.id,
        certRef: cert.certRef,
        issuedAt: cert.issuedAt,
        isOfficial: true,
        course: cert.course || {},
      }));
    }
    return completedEnrollments.map((enr) => {
      const c = enr.course || {};
      const matched = certByCourseId.get(c.id);
      return {
        id: enr.id,
        certRef: matched?.certRef || `CG-GH-${c.id?.substring(0, 6).toUpperCase() || "2026"}`,
        issuedAt: matched?.issuedAt || enr.lastActiveAt || new Date().toISOString(),
        isOfficial: Boolean(matched?.certRef),
        course: c,
      };
    });
  }, [myCertificates, completedEnrollments, certByCourseId]);

  const filteredCourses = myEnrollments.filter((enr) => {
    const c = enr.course || {};
    const matchesSearch =
      c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(courseSearch.toLowerCase());
    const isDone = enr.progressPct >= 100 || enr.status === "COMPLETED";

    if (courseFilter === "in-progress") return matchesSearch && !isDone;
    if (courseFilter === "completed") return matchesSearch && isDone;
    return matchesSearch;
  });

  const filteredCerts = earnedCredentials.filter((cred) => {
    const c = cred.course || {};
    return (
      c.title?.toLowerCase().includes(certSearch.toLowerCase()) ||
      cred.certRef?.toLowerCase().includes(certSearch.toLowerCase())
    );
  });

  const overallProgress =
    myEnrollments.length > 0
      ? Math.round(
        myEnrollments.reduce((acc, curr) => acc + (curr.progressPct || 0), 0) /
        myEnrollments.length
      )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <CyberSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  const navSections = [
    {
      title: "Learning",
      items: [
        { key: "courses", label: "Enrolled courses", icon: BookOpen, count: myEnrollments.length },
        {
          key: "certificates",
          label: "Certificates",
          icon: Award,
          count: earnedCredentials.length,
        },
      ],
    },
    {
      title: "Sessions",
      items: [
        { key: "mentorship", label: "1-on-1 mentorship", icon: Calendar, count: bookings.length },
      ],
    },
    {
      title: "Account",
      items: [
        { key: "settings", label: "Profile & security", icon: SlidersHorizontal },
      ],
    },
    {
      title: "Quick resources",
      items: [
        { label: "Course catalog", icon: Globe, isLink: true, to: "/courses" },
        { label: "Mentor chat", icon: MessageSquare, isLink: true, to: "/cyberchat" },
        { label: "Report incident", icon: ShieldAlert, isLink: true, to: "/report" },
      ],
    },
  ];

  const tabMotion = prefersReducedMotion
    ? {}
    : {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
      transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
    };

  return (
    <div className="h-screen h-[100dvh] overflow-hidden bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Stationary Light Sidebar */}
      <aside
        className={`w-64 bg-white text-slate-800 border-r border-slate-200/90 flex flex-col justify-between shrink-0 z-40 transition-transform duration-200 fixed inset-y-0 left-0 h-full lg:static lg:h-full lg:translate-x-0 lg:shadow-none ${mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <Link to="/" className="flex items-center" title="Return to Home">
            <CyberGuardLogo variant="compact" size="sm" interactive />
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain py-5 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-slate-400">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;

                if (item.isLink) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabChange(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${isActive
                        ? "bg-blue-50 text-[#0056D2] font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-[#0056D2]" : "text-slate-400"}`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${isActive ? "bg-[#0056D2] text-white" : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <UserAvatar user={user} size="md" rounded="rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.displayName || "Learner"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "Student Portal"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <div
        ref={mainScrollRef}
        className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto overscroll-contain bg-[#F8FAFC]"
      >
        <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-[#0056D2]" />
              <span>Student Portal</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">
                {activeTab === "courses"
                  ? "Enrolled courses"
                  : activeTab === "certificates"
                    ? "Certificates"
                    : activeTab === "mentorship"
                      ? "Mentorship"
                      : "Profile & security"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/courses"
              className="text-xs font-medium text-[#0056D2] hover:text-[#00419E] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Browse catalog</span>
            </Link>
          </div>
        </header>

        {/* Mobile Horizontal Quick Tab Bar */}
        <div className="lg:hidden shrink-0 bg-white border-b border-slate-200/90 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none sticky top-16 z-10 shadow-2xs">
          {[
            { key: "courses", label: "Courses", count: myEnrollments.length },
            { key: "certificates", label: "Certificates", count: earnedCredentials.length },
            { key: "mentorship", label: "Mentorship", count: bookings.length },
            { key: "settings", label: "Profile & Security" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${activeTab === t.key
                  ? "bg-[#0056D2] text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/70"
                }`}
            >
              <span>{t.label}</span>
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-6xl w-full mx-auto pb-24 lg:pb-12">
          {activeTab !== "settings" && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back, {user?.displayName?.split(" ")[0] || "Learner"}
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Continue your courses, view earned certificates, and manage upcoming mentorship sessions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-[11px] sm:text-xs">
                  {myEnrollments.length} {myEnrollments.length === 1 ? "course" : "courses"}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-[11px] sm:text-xs">
                  {earnedCredentials.length}{" "}
                  {earnedCredentials.length === 1 ? "certificate" : "certificates"}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-[11px] sm:text-xs">
                  {overallProgress}% average progress
                </span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* TAB 1: COURSES */}
            {activeTab === "courses" && (
              <motion.div key="courses" {...tabMotion} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto scrollbar-none max-w-full">
                    <button
                      type="button"
                      onClick={() => setCourseFilter("all")}
                      className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${courseFilter === "all"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      All ({myEnrollments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourseFilter("in-progress")}
                      className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${courseFilter === "in-progress"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      In progress ({inProgressEnrollments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourseFilter("completed")}
                      className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${courseFilter === "completed"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Completed ({completedEnrollments.length})
                    </button>
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search enrolled courses..."
                      className="w-full bg-white text-slate-900 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0056D2]"
                    />
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {courseSearch ? "No courses match your search" : "No enrolled courses yet"}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Browse the course catalog to start learning practical Mobile Money and online safety skills.
                    </p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center gap-1.5 bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      <span>Browse course catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourses.map((enr) => {
                      const c = enr.course || {};
                      const isDone = enr.progressPct >= 100 || enr.status === "COMPLETED";
                      const matchedCert = certByCourseId.get(c.id);
                      const certRef =
                        matchedCert?.certRef ||
                        `CG-GH-${c.id?.substring(0, 6).toUpperCase() || "2026"}`;

                      return (
                        <motion.div
                          key={enr.id}
                          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                          transition={{ duration: 0.16 }}
                          className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition flex flex-col justify-between space-y-4 shadow-2xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {c.category || "Cyber Safety"}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                {c.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 leading-snug">
                              {c.title}
                            </h3>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {c.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-slate-500">Progress</span>
                              <span
                                className={
                                  isDone ? "text-[#0056D2] font-semibold" : "text-slate-700"
                                }
                              >
                                {enr.progressPct || 0}%
                              </span>
                            </div>

                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0056D2] rounded-full transition-all duration-300"
                                style={{ width: `${enr.progressPct || 0}%` }}
                              />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Link
                                to={`/courses/${c.slug}`}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isDone ? "Review course" : "Continue learning"}</span>
                              </Link>

                              {isDone && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedCert({
                                      certRef,
                                      courseTitle: c.title,
                                      issuedAt:
                                        matchedCert?.issuedAt ||
                                        enr.lastActiveAt ||
                                        new Date().toISOString(),
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-[#0056D2] font-medium px-3 py-2 rounded-lg text-xs transition cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Certificate</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: CERTIFICATES */}
            {activeTab === "certificates" && (
              <motion.div key="certificates" {...tabMotion} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-slate-900">Earned certificates</h2>
                    <p className="text-xs text-slate-500">
                      Completion certificates with public reference codes for verification.
                    </p>
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      placeholder="Search by title or reference code..."
                      className="w-full bg-white text-slate-900 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0056D2]"
                    />
                  </div>
                </div>

                {filteredCerts.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      No certificates earned yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Complete 100% of any enrolled course and pass its assessment quiz to unlock your certificate.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTabChange("courses")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0056D2] hover:underline cursor-pointer"
                    >
                      <span>Go to enrolled courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCerts.map((cred) => {
                      const c = cred.course || {};

                      return (
                        <motion.div
                          key={`cert-${cred.id}`}
                          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                          transition={{ duration: 0.16 }}
                          className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition space-y-4 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-[11px] font-mono text-slate-400 block">
                                {cred.certRef}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {c.title}
                              </h3>
                            </div>
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Issued
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>
                              Issued {new Date(cred.issuedAt || Date.now()).toLocaleDateString()}
                            </span>
                            <span className="text-slate-400">{c.category || "Cyber Safety"}</span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCert({
                                  certRef: cred.certRef,
                                  courseTitle: c.title,
                                  issuedAt: cred.issuedAt || new Date().toISOString(),
                                })
                              }
                              className="flex-1 bg-[#0056D2] hover:bg-[#00419E] text-white font-medium py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View certificate</span>
                            </button>

                            {cred.isOfficial && (
                              <Link
                                to={`/verify-certificate/${cred.certRef}`}
                                target="_blank"
                                title="Open public verification page"
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: MENTORSHIP */}
            {activeTab === "mentorship" && (
              <motion.div key="mentorship" {...tabMotion} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-slate-900">
                      1-on-1 mentorship sessions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Private guidance sessions booked with verified cybersecurity practitioners.
                    </p>
                  </div>

                  <Link
                    to="/tutors"
                    className="inline-flex items-center gap-1.5 bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shrink-0"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book a session</span>
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Video className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      No scheduled sessions
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Need help reviewing a suspicious message, career questions, or practical study guidance? Book time with a mentor.
                    </p>
                    <Link
                      to="/tutors"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0056D2] hover:underline"
                    >
                      <span>Browse mentor directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {b.tutor?.user?.displayName || "Verified mentor"}
                            </span>
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Confirmed
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(b.slot?.startsAt).toLocaleString()}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {b.tutor?.user?.id && (
                            <Link
                              to={`/cyberchat?mentor=${encodeURIComponent(b.tutor.user.id)}`}
                              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium px-3.5 py-2 rounded-lg text-xs transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                              <span>Message mentor</span>
                            </Link>
                          )}
                          <a
                            href={b.jitsiUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#0056D2] hover:bg-[#00419E] text-white font-medium px-4 py-2 rounded-lg text-xs transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join video room</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 4: UNIFIED PROFILE & SECURITY SETTINGS */}
            {activeTab === "settings" && (
              <motion.div key="settings" {...tabMotion}>
                <AccountSettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          studentName={user?.displayName}
          courseTitle={selectedCert.courseTitle}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
