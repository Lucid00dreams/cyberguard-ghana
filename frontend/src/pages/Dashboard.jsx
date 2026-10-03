import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Video,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  Lock,
  Search,
  ExternalLink,
  Key,
  ShieldAlert,
  SlidersHorizontal,
  LogOut,
  Globe,
  Menu,
  X,
  MessageSquare,
  Loader2
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "../components/CyberSpinner";
import CertificateModal from "../components/CertificateModal";
import AccountSettingsView from "../components/AccountSettingsView";
import CyberGuardLogo from "../components/CyberGuardLogo";

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Strict role access control
  if (user?.role === "ADMIN" || user?.role === "CSA_OFFICER") {
    return <Navigate to="/admin" replace />;
  }

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [, setMyCertificates] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "courses";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Course & Certificate filtering
  const [courseFilter, setCourseFilter] = useState("all"); // "all" | "in-progress" | "completed"
  const [courseSearch, setCourseSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["courses", "certificates", "mentorship", "security", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
    setMobileSidebarOpen(false);
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

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    setPasswordLoading(true);
    setPasswordStatus(null);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordStatus({ type: "success", message: "Password updated successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordStatus({ type: "error", message: err.response?.data?.error || "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  }

  const completedEnrollments = myEnrollments.filter((e) => e.progressPct >= 100 || e.status === "COMPLETED");
  const inProgressEnrollments = myEnrollments.filter((e) => (e.progressPct || 0) < 100 && e.status !== "COMPLETED");

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

  const filteredCerts = completedEnrollments.filter((enr) => {
    const c = enr.course || {};
    const refCode = `CG-GH-${c.id?.substring(0, 6).toUpperCase() || "2026"}`;
    return (
      c.title?.toLowerCase().includes(certSearch.toLowerCase()) ||
      refCode.toLowerCase().includes(certSearch.toLowerCase())
    );
  });

  const overallProgress =
    myEnrollments.length > 0
      ? Math.round(myEnrollments.reduce((acc, curr) => acc + (curr.progressPct || 0), 0) / myEnrollments.length)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <CyberSpinner size="lg" label="Loading student portal..." />
      </div>
    );
  }

  const navSections = [
    {
      title: "Learning",
      items: [
        { key: "courses", label: "Enrolled courses", icon: BookOpen, count: myEnrollments.length },
        { key: "certificates", label: "Certificates", icon: Award, count: completedEnrollments.length },
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
        { key: "settings", label: "Profile settings", icon: SlidersHorizontal },
        { key: "security", label: "Security & password", icon: Lock },
      ],
    },
    {
      title: "Quick resources",
      items: [
        { label: "Course catalog", icon: Globe, isLink: true, to: "/courses" },
        { label: "CyberChat", icon: MessageSquare, isLink: true, to: "/cyberchat" },
        { label: "Report incident", icon: ShieldAlert, isLink: true, to: "/report" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Minimalist, Clean Light Sidebar */}
      <aside
        className={`w-64 bg-white text-slate-800 border-r border-slate-200/90 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 fixed shadow-xl" : "-translate-x-full lg:translate-x-0 fixed lg:sticky"
        }`}
      >
        {/* Brand Header */}
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

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                      isActive
                        ? "bg-blue-50 text-[#0056D2] font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#0056D2]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                          isActive ? "bg-[#0056D2] text-white" : "bg-slate-100 text-slate-600"
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

        {/* Minimal User Profile Footer */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.displayName?.charAt(0).toUpperCase() || "S"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.displayName || "Student"}
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FAFC]">
        {/* Clean, Understated Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
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
              <span className="text-slate-900 font-semibold capitalize">
                {activeTab === "courses"
                  ? "Enrolled courses"
                  : activeTab === "certificates"
                  ? "Certificates"
                  : activeTab === "mentorship"
                  ? "Mentorship"
                  : activeTab === "settings"
                  ? "Profile settings"
                  : "Security"}
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
        <div className="lg:hidden bg-white border-b border-slate-200/90 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none sticky top-16 z-10 shadow-2xs">
          {[
            { key: "courses", label: "Courses", count: myEnrollments.length },
            { key: "certificates", label: "Certificates", count: completedEnrollments.length },
            { key: "mentorship", label: "Mentorship", count: bookings.length },
            { key: "settings", label: "Settings" },
            { key: "security", label: "Security" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                activeTab === t.key
                  ? "bg-[#0056D2] text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/70"
              }`}
            >
              <span>{t.label}</span>
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
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
          {/* Calm Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Welcome back, {user?.displayName?.split(" ")[0] || "Student"}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track your active courses, download verifiable certificates, and prepare for digital safety challenges.
              </p>
            </div>

            {/* Quiet, Human Summary Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-[11px] sm:text-xs">
                {myEnrollments.length} {myEnrollments.length === 1 ? "course" : "courses"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-[11px] sm:text-xs">
                {completedEnrollments.length} {completedEnrollments.length === 1 ? "certificate" : "certificates"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-[11px] sm:text-xs">
                {overallProgress}% completion rate
              </span>
            </div>
          </div>

          {/* TAB 1: COURSES */}
          {activeTab === "courses" && (
            <div className="space-y-5">
              {/* Single, Focused Search & Status Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto scrollbar-none max-w-full">
                  <button
                    type="button"
                    onClick={() => setCourseFilter("all")}
                    className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                      courseFilter === "all"
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({myEnrollments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseFilter("in-progress")}
                    className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                      courseFilter === "in-progress"
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    In progress ({inProgressEnrollments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseFilter("completed")}
                    className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                      courseFilter === "completed"
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

              {/* Course Cards Grid */}
              {filteredCourses.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {courseSearch ? "No courses match your search" : "No enrolled courses yet"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Browse our curriculum catalog to start learning practical Mobile Money and digital safety defense.
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

                    return (
                      <div
                        key={enr.id}
                        className="bg-white rounded-xl p-5 border border-slate-200/90 hover:border-slate-300 transition flex flex-col justify-between space-y-4 shadow-2xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {c.category || "Cyber defense"}
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
                            <span className={isDone ? "text-[#0056D2] font-semibold" : "text-slate-700"}>
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
                                    certRef: `CG-GH-${c.id?.substring(0, 6).toUpperCase() || "2026"}`,
                                    courseTitle: c.title,
                                    issuedAt: enr.lastActiveAt || new Date().toISOString(),
                                  })
                                }
                                className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-[#0056D2] font-medium px-3 py-2 rounded-lg text-xs transition"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Certificate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CERTIFICATES */}
          {activeTab === "certificates" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-slate-900">Your verified credentials</h2>
                  <p className="text-xs text-slate-500">
                    Officially verifiable completion certificates under Ghana's Child Online Protection framework.
                  </p>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={certSearch}
                    onChange={(e) => setCertSearch(e.target.value)}
                    placeholder="Search certificates..."
                    className="w-full bg-white text-slate-900 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0056D2]"
                  />
                </div>
              </div>

              {filteredCerts.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No certificates earned yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete 100% of any enrolled course and pass the final assessment quiz to unlock your official credential.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTabChange("courses")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0056D2] hover:underline"
                  >
                    <span>Go to courses in progress</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCerts.map((enr) => {
                    const c = enr.course || {};
                    const refCode = `CG-GH-${c.id?.substring(0, 6).toUpperCase() || "2026"}`;

                    return (
                      <div
                        key={`cert-${enr.id}`}
                        className="bg-white rounded-xl p-5 border border-slate-200/90 hover:border-slate-300 transition space-y-4 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-mono text-slate-400 block">{refCode}</span>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.title}</h3>
                          </div>
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span>Issued {new Date(enr.lastActiveAt || Date.now()).toLocaleDateString()}</span>
                          <span className="text-slate-400">Act 1038 compliant</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCert({
                                certRef: refCode,
                                courseTitle: c.title,
                                issuedAt: enr.lastActiveAt || new Date().toISOString(),
                              })
                            }
                            className="flex-1 bg-[#0056D2] hover:bg-[#00419E] text-white font-medium py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View certificate</span>
                          </button>

                          <Link
                            to={`/verify-certificate/${refCode}`}
                            target="_blank"
                            title="Verify in public registry"
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MENTORSHIP */}
          {activeTab === "mentorship" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-slate-900">1-on-1 mentorship sessions</h2>
                  <p className="text-xs text-slate-500">
                    Connect directly with verified Ghanaian security practitioners for private guidance.
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
                <div className="text-center py-14 border border-dashed border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No scheduled sessions</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Need help with an incident, career questions, or practical cybersecurity exercises? Book time with a vetted mentor.
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
                      className="bg-white rounded-xl p-5 border border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs"
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

                      <a
                        href={b.jitsiUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#0056D2] hover:bg-[#00419E] text-white font-medium px-4 py-2 rounded-lg text-xs transition"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join encrypted call</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-slate-900">Security & credentials</h2>
                <p className="text-xs text-slate-500">
                  Manage your account password and security preferences.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-xl p-6 max-w-xl space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Key className="w-4 h-4 text-[#0056D2]" />
                  <h3 className="text-sm font-bold text-slate-900">Update password</h3>
                </div>

                {passwordStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs ${
                      passwordStatus.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {passwordStatus.message}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Current password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#0056D2]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">New password (minimum 8 characters)</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#0056D2]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Confirm new password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#0056D2]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex items-center gap-1.5 bg-[#0056D2] hover:bg-[#00419E] text-white font-medium px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Update password</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: ACCOUNT SETTINGS */}
          {activeTab === "settings" && <AccountSettingsView />}
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
