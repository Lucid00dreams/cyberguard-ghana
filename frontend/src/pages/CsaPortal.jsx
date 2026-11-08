import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  FileDown,
  UserCheck,
  Award,
  Users,
  Trash2,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Check,
  Clock,
  Search,
  Lock,
  ExternalLink,
  X,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  LogOut,
  Globe,
  LayoutGrid,
  Menu,
  Mail,
  Send,
  Loader2,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import AccountSettingsView from "../components/AccountSettingsView";
import CyberGuardLogo from "../components/CyberGuardLogo";
import UserAvatar from "../components/UserAvatar";

const VALID_TABS = [
  "overview",
  "users",
  "daily-tips",
  "reports",
  "approvals",
  "tutors",
  "courses",
  "certificates",
  "settings",
];

const TAB_META = {
  overview: {
    label: "Overview",
    shortLabel: "Overview",
    title: "Admin Overview",
    description: "Platform metrics, recent accounts, incident reports, and pending tutor applications.",
  },
  users: {
    label: "Users",
    shortLabel: "Users",
    title: "Users & Permissions",
    description: "Manage learner, tutor, and officer roles or remove accounts across the platform.",
  },
  "daily-tips": {
    label: "Daily Tips",
    shortLabel: "Daily Tips",
    title: "Daily Cyber Safety Tips",
    description: "Automated broadcast schedule, subscriber directory, and delivery audit logs.",
  },
  reports: {
    label: "Incident Reports",
    shortLabel: "Reports",
    title: "Incident Reports",
    description: "Review confidential cyber incident submissions, update case status, and export PDF briefs.",
  },
  approvals: {
    label: "Tutor Applications",
    shortLabel: "Approvals",
    title: "Tutor Applications",
    description: "Review and approve educators applying to host 1-on-1 mentorship sessions.",
  },
  tutors: {
    label: "Verified Tutors",
    shortLabel: "Tutors",
    title: "Verified Tutors",
    description: "Accredited mentors currently active in the public mentorship directory.",
  },
  courses: {
    label: "Courses",
    shortLabel: "Courses",
    title: "Course Catalog",
    description: "Manage published curriculum modules or launch Course Studio to author new lessons.",
  },
  certificates: {
    label: "Certificates",
    shortLabel: "Certs",
    title: "Issued Certificates",
    description: "Audit and verify completion credentials issued to learners.",
  },
  settings: {
    label: "Settings",
    shortLabel: "Settings",
    title: "Account & Profile Settings",
    description: "Manage your administrator profile, password, and notification preferences.",
  },
};

const ROLE_LABELS = {
  ADMIN: "Admin",
  CSA_OFFICER: "CSA Officer",
  TUTOR: "Tutor",
  STUDENT: "Student",
};

const ROLE_BADGE_STYLES = {
  ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  CSA_OFFICER: "bg-blue-50 text-[#0056D2] border-blue-200/80",
  TUTOR: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  STUDENT: "bg-slate-100 text-slate-700 border-slate-200/80",
};

const INCIDENT_STATUS_STYLES = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  ESCALATED: "bg-rose-50 text-rose-800 border-rose-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  DISMISSED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function CsaPortal() {
  const { user, logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const adminScrollRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = VALID_TABS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const [active, setActive] = useState(initialTab);
  const isSuperAdmin = user?.role === "ADMIN";

  const [reports, setReports] = useState([]);
  const [pendingTutors, setPendingTutors] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [users, setUsers] = useState([]);

  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Daily Cyber Safety Tips Superadmin Log State
  const [dailyTipsData, setDailyTipsData] = useState({
    summary: null,
    dispatches: [],
    emailLogs: [],
    subscribers: [],
  });
  const [dailyTipsLoading, setDailyTipsLoading] = useState(false);
  const [dispatchingNow, setDispatchingNow] = useState(false);
  const [tipLogDate, setTipLogDate] = useState("");
  const [tipLogStatus, setTipLogStatus] = useState("");
  const [tipLogSearch, setTipLogSearch] = useState("");
  const [tipLogSubView, setTipLogSubView] = useState("daily");
  const [scheduleConfig, setScheduleConfig] = useState({
    hour: 7,
    minute: 0,
    timeString: "07:00",
    displayTime: "7:00 AM",
    enabled: true,
  });
  const [scheduleInputTime, setScheduleInputTime] = useState("07:00");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam)) {
      if ((tabParam === "users" || tabParam === "daily-tips") && !isSuperAdmin) {
        setActive("overview");
      } else {
        setActive(tabParam);
      }
    }
  }, [searchParams, isSuperAdmin]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  function notify(text, type = "info") {
    setActionStatus({ text, type });
  }

  function selectAdminTab(tabKey) {
    setActive(tabKey);
    setSearchParams({ tab: tabKey });
    setMobileSidebarOpen(false);
    adminScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  function handleGlobalSearchSubmit(e) {
    if (e) e.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;

    setMobileSearchOpen(false);

    if (/^CG-/i.test(query) && active !== "certificates") {
      selectAdminTab("reports");
      setReportSearch(query);
      return;
    }

    if (active === "reports") {
      setReportSearch(query);
    } else if (active === "courses") {
      setCourseSearch(query);
    } else if (active === "certificates") {
      setCertSearch(query);
    } else if (active === "daily-tips" && isSuperAdmin) {
      setTipLogSearch(query);
      loadDailyTipsLogs(query);
    } else if (isSuperAdmin) {
      selectAdminTab("users");
      setUserSearch(query);
      loadUsers(query, userRoleFilter);
    } else {
      selectAdminTab("reports");
      setReportSearch(query);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (active === "reports") loadReports();
    if (active === "approvals") loadPendingTutors();
    if (active === "users" && isSuperAdmin) loadUsers();
    if (active === "daily-tips" && isSuperAdmin) loadDailyTipsLogs();
    if (active === "tutors") loadTutors();
    if (active === "courses") loadCourses();
    if (active === "certificates") loadCertificates();
  }, [active, categoryFilter, userRoleFilter, tipLogDate, tipLogStatus]);

  async function loadOverview() {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadReports(),
        loadPendingTutors(),
        loadCourses(),
        loadTutors(),
        loadCertificates(),
        ...(isSuperAdmin ? [loadUsers(), loadDailyTipsLogs()] : []),
      ]);
    } finally {
      setLoading(false);
    }
  }

  function loadStats() {
    return api
      .get("/courses/stats/summary")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }

  function loadReports() {
    return api
      .get("/incidents", { params: categoryFilter ? { category: categoryFilter } : {} })
      .then((res) => setReports(res.data || []))
      .catch(() => setReports([]));
  }

  function loadPendingTutors() {
    return api
      .get("/tutors/pending")
      .then((res) => setPendingTutors(res.data || []))
      .catch(() => setPendingTutors([]));
  }

  function loadTutors() {
    return api
      .get("/tutors")
      .then((res) => setTutors(res.data || []))
      .catch(() => setTutors([]));
  }

  function loadCourses() {
    return api
      .get("/courses/all")
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }

  function loadCertificates() {
    return api
      .get("/courses/certificates")
      .then((res) => setCertificates(res.data || []))
      .catch(() => setCertificates([]));
  }

  async function loadUsers(searchVal = userSearch, roleVal = userRoleFilter) {
    if (!isSuperAdmin) return;
    try {
      const res = await api.get("/auth/users", {
        params: { role: roleVal || undefined, search: searchVal || undefined },
      });
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    }
  }

  async function loadDailyTipsLogs(customSearch = tipLogSearch) {
    if (!isSuperAdmin) return;
    setDailyTipsLoading(true);
    try {
      const res = await api.get("/daily-tips/logs", {
        params: {
          date: tipLogDate || undefined,
          status: tipLogStatus || undefined,
          search: customSearch || undefined,
        },
      });
      setDailyTipsData({
        summary: res.data?.summary || null,
        dispatches: res.data?.dispatches || [],
        emailLogs: res.data?.emailLogs || [],
        subscribers: res.data?.subscribers || [],
      });
      if (res.data?.summary?.schedule) {
        setScheduleConfig(res.data.summary.schedule);
        setScheduleInputTime(res.data.summary.schedule.timeString || "07:00");
      }
    } catch {
      setDailyTipsData({ summary: null, dispatches: [], emailLogs: [], subscribers: [] });
    } finally {
      setDailyTipsLoading(false);
    }
  }

  async function handleSaveSchedule(e) {
    if (e) e.preventDefault();
    if (scheduleSaving) return;

    const [hStr, mStr] = (scheduleInputTime || "07:00").split(":");
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);

    if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(minute) || minute < 0 || minute > 59) {
      notify("Please select a valid time (HH:MM).", "error");
      return;
    }

    setScheduleSaving(true);
    try {
      const res = await api.patch("/daily-tips/schedule", {
        hour,
        minute,
        enabled: scheduleConfig.enabled,
      });
      notify(res.data?.message || "Notification schedule updated.");
      if (res.data?.schedule) {
        setScheduleConfig(res.data.schedule);
        setScheduleInputTime(res.data.schedule.timeString);
      }
      await loadDailyTipsLogs();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to update notification schedule.", "error");
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleToggleScheduleStatus() {
    if (scheduleSaving) return;
    setScheduleSaving(true);
    try {
      const newEnabled = !scheduleConfig.enabled;
      const res = await api.patch("/daily-tips/schedule", {
        hour: scheduleConfig.hour,
        minute: scheduleConfig.minute,
        enabled: newEnabled,
      });
      notify(`Automated tips dispatch ${newEnabled ? "activated" : "paused"}.`);
      if (res.data?.schedule) {
        setScheduleConfig(res.data.schedule);
        setScheduleInputTime(res.data.schedule.timeString);
      }
      await loadDailyTipsLogs();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to toggle schedule.", "error");
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleDispatchTipsNow() {
    if (dispatchingNow) return;
    setDispatchingNow(true);
    try {
      const res = await api.post("/daily-tips/dispatch-now");
      notify(res.data?.message || "Daily cyber safety tips sent.");
      await loadDailyTipsLogs();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to send daily cyber safety tips.", "error");
    } finally {
      setDispatchingNow(false);
    }
  }

  function exportDailyTipLogsCsv() {
    const rows = dailyTipsData.emailLogs || [];
    if (rows.length === 0) return;
    const headers = [
      "Date",
      "Sent At (ISO)",
      "Recipient Email",
      "Recipient Name",
      "Tip Title",
      "Status",
      "Message ID",
      "Error",
    ];
    const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.dispatchDate,
          r.sentAt ? new Date(r.sentAt).toISOString() : "",
          r.recipientEmail,
          r.recipientName,
          r.tipTitle,
          r.status,
          r.messageId || "",
          r.errorMessage || "",
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-cyber-tips-log-${tipLogDate || "all"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function changeUserRole(userId, newRole) {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      notify(`Updated role to ${ROLE_LABELS[newRole] || newRole}.`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      await loadStats();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to update user role.", "error");
    }
  }

  function deleteUser(userId, name) {
    setConfirmDialog({
      title: `Delete user "${name}"?`,
      message:
        "This permanently deletes the user's profile, course enrollments, mentorship bookings, and certificates. This action cannot be undone.",
      confirmLabel: "Delete user",
      onConfirm: async () => {
        try {
          await api.delete(`/auth/users/${userId}`);
          notify(`Removed user "${name}".`);
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          await loadStats();
        } catch (err) {
          notify(err.response?.data?.error || "Failed to delete user account.", "error");
        }
      },
    });
  }

  async function updateIncidentStatus(id, newStatus) {
    try {
      await api.patch(`/incidents/${id}/status`, { status: newStatus });
      notify(`Incident status updated to ${newStatus.replace("_", " ").toLowerCase()}.`);
      await loadReports();
    } catch {
      notify("Failed to update incident status.", "error");
    }
  }

  async function exportPdf(id, refCode) {
    try {
      const res = await api.get(`/incidents/${id}/export-pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `case-brief-${refCode}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      notify("Could not export PDF case brief.", "error");
    }
  }

  async function approveTutor(tutorId) {
    try {
      await api.patch(`/tutors/${tutorId}/vet`);
      notify("Tutor application approved.");
      await Promise.all([loadPendingTutors(), loadTutors(), loadStats()]);
    } catch (err) {
      notify(err.response?.data?.error || "Failed to approve tutor application.", "error");
    }
  }

  function removeTutor(tutorId, tutorName) {
    setConfirmDialog({
      title: `Revoke tutor verification${tutorName ? ` for ${tutorName}` : ""}?`,
      message:
        "This removes the tutor's verified mentor profile and reverts their account role to standard learner.",
      confirmLabel: "Revoke verification",
      onConfirm: async () => {
        try {
          await api.delete(`/tutors/${tutorId}`);
          notify("Tutor verification revoked.");
          await Promise.all([loadTutors(), loadPendingTutors(), loadStats()]);
        } catch (err) {
          notify(err.response?.data?.error || "Failed to revoke tutor.", "error");
        }
      },
    });
  }

  function removeCourse(courseId, title) {
    setConfirmDialog({
      title: `Delete course${title ? ` "${title}"` : ""}?`,
      message:
        "This removes the course and its modules, lessons, and quizzes from the catalog. This action cannot be undone.",
      confirmLabel: "Delete course",
      onConfirm: async () => {
        try {
          await api.delete(`/courses/${courseId}`);
          notify("Course deleted from catalog.");
          await Promise.all([loadCourses(), loadStats()]);
        } catch (err) {
          notify(err.response?.data?.error || "Failed to delete course.", "error");
        }
      },
    });
  }

  const filteredReports = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.refCode?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.narrative?.toLowerCase().includes(q)
    );
  }, [reports, reportSearch]);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
    );
  }, [courses, courseSearch]);

  const filteredCerts = useMemo(() => {
    const q = certSearch.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter(
      (c) =>
        c.certRef?.toLowerCase().includes(q) ||
        c.user?.displayName?.toLowerCase().includes(q) ||
        c.course?.title?.toLowerCase().includes(q)
    );
  }, [certificates, certSearch]);

  const totalUsersCount = stats?.users ?? users.length;

  const sidebarSections = [
    {
      title: "Administration",
      items: [
        { key: "overview", label: "Overview", shortLabel: "Overview", icon: LayoutGrid, count: null },
        ...(isSuperAdmin
          ? [
              { key: "users", label: "Users", shortLabel: "Users", icon: Users, count: totalUsersCount },
              {
                key: "daily-tips",
                label: "Daily Tips",
                shortLabel: "Daily Tips",
                icon: Mail,
                count: dailyTipsData.summary?.activeSubscribers ?? null,
              },
            ]
          : []),
      ],
    },
    {
      title: "Moderation",
      items: [
        { key: "reports", label: "Incident Reports", shortLabel: "Reports", icon: AlertTriangle, count: reports.length },
        {
          key: "approvals",
          label: "Tutor Applications",
          shortLabel: "Approvals",
          icon: UserCheck,
          count: pendingTutors.length,
        },
        { key: "tutors", label: "Verified Tutors", shortLabel: "Tutors", icon: ShieldCheck, count: tutors.length },
      ],
    },
    {
      title: "Learning",
      items: [
        { key: "courses", label: "Courses", shortLabel: "Courses", icon: BookOpen, count: courses.length },
        { key: "certificates", label: "Certificates", shortLabel: "Certs", icon: Award, count: certificates.length },
      ],
    },
    {
      title: "Account",
      items: [{ key: "settings", label: "Settings", shortLabel: "Settings", icon: SlidersHorizontal, count: null }],
    },
    {
      title: "Shortcuts",
      items: [
        { key: "studio", label: "Course Studio", icon: Plus, isLink: true, to: "/course-studio" },
        { key: "cyberchat", label: "Mentor Chat", icon: Lock, isLink: true, to: "/cyberchat" },
        {
          key: "reportPortal",
          label: "Public Report Form",
          icon: ExternalLink,
          isLink: true,
          to: "/report",
        },
      ],
    },
  ];

  const mobileTabs = sidebarSections
    .flatMap((s) => s.items)
    .filter((item) => !item.isLink);

  const currentMeta = TAB_META[active] || TAB_META.overview;

  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div className="h-screen h-[100dvh] w-full max-w-full min-w-0 overflow-hidden bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-slate-900 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Stationary Sidebar (Desktop) & Slide-Over Drawer (Mobile) */}
      <aside
        className={`w-64 max-w-[82vw] bg-white text-slate-800 border-r border-slate-200/90 flex flex-col justify-between shrink-0 z-40 transition-transform duration-200 fixed inset-y-0 left-0 h-full lg:static lg:h-full lg:translate-x-0 lg:shadow-none ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-15 sm:h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center min-w-0 shrink-0"
            title="Return to public website"
          >
            <CyberGuardLogo variant="full" size="xs" subtitle="CSA Admin Console" interactive />
          </Link>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto overscroll-contain py-3.5 px-3 space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                if (item.isLink) {
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => selectAdminTab(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isActive
                        ? "bg-[#0056D2]/10 text-[#0056D2] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#0056D2]" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== null && item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          isActive
                            ? "bg-[#0056D2] text-white"
                            : "bg-slate-100 text-slate-600"
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

        {/* Account Footer */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => selectAdminTab("settings")}
            title="Account settings"
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition cursor-pointer flex-1"
          >
            <UserAvatar user={user} size="sm" rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.displayName || "Administrator"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {ROLE_LABELS[user?.role] || "Admin"}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => selectAdminTab("settings")}
              title="Settings"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                active === "settings"
                  ? "bg-slate-200/80 text-slate-900"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Workspace */}
      <div
        ref={adminScrollRef}
        className="flex-1 min-w-0 w-full max-w-full flex flex-col h-full overflow-y-auto overflow-x-hidden overscroll-contain bg-[#F8FAFC]"
      >
        {/* Sticky Top Bar */}
        <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 w-full">
          <div className="h-14 sm:h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
            {/* Left: Drawer Button + Breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-slate-700 hover:text-slate-900 p-2 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 cursor-pointer shrink-0"
                aria-label="Open navigation"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
                <span className="hidden xs:inline font-medium text-slate-400 shrink-0">Admin</span>
                <span className="hidden xs:inline text-slate-300 shrink-0">/</span>
                <span className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                  {currentMeta.label}
                </span>
              </div>
            </div>

            {/* Right: Search + Refresh + Public Site */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Desktop Quick Search */}
              <form
                onSubmit={handleGlobalSearchSubmit}
                className="hidden md:flex items-center relative w-56 lg:w-68"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Quick search..."
                  className="w-full pl-8 pr-14 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0056D2] transition"
                />
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  Ctrl K
                </kbd>
              </form>

              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setTimeout(() => mobileSearchInputRef.current?.focus(), 60);
                    }
                    return next;
                  });
                }}
                aria-label="Toggle quick search"
                className={`md:hidden p-2 rounded-xl border transition cursor-pointer ${
                  mobileSearchOpen
                    ? "bg-blue-50 border-blue-200 text-[#0056D2]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={loadOverview}
                disabled={loading}
                title="Refresh data"
                className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${loading ? "animate-spin text-[#0056D2]" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <Link
                to="/"
                title="Open public site"
                className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <Globe className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Public site</span>
              </Link>
            </div>
          </div>

          {/* Expandable Mobile Quick Search Bar */}
          {mobileSearchOpen && (
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="md:hidden px-3 pb-2.5 pt-0.5 border-t border-slate-100 bg-white flex items-center gap-2"
            >
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search users, CG-ref codes, courses..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0056D2]"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#0056D2] text-white text-xs font-bold shrink-0"
              >
                Go
              </button>
            </form>
          )}

          {/* Mobile Quick Tab Strip with Icons & Counts */}
          <div className="lg:hidden bg-slate-50/90 border-t border-slate-200/70 px-2.5 sm:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full max-w-full">
            {mobileTabs.map((t) => {
              const TabIcon = t.icon;
              const isTabActive = active === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectAdminTab(t.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isTabActive
                      ? "bg-slate-900 text-white font-bold shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isTabActive ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{t.shortLabel || t.label}</span>
                  {t.count !== null && t.count !== undefined && t.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                        isTabActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 sm:pb-12 max-w-6xl w-full mx-auto space-y-4 sm:space-y-6 min-w-0">
          {/* Status Banner */}
          <AnimatePresence>
            {actionStatus && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className={`p-3 sm:p-3.5 rounded-xl border text-xs font-semibold flex justify-between items-center gap-3 ${
                  actionStatus.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-2xs"
                }`}
              >
                <span className="min-w-0 break-words">{actionStatus.text}</span>
                <button
                  type="button"
                  onClick={() => setActionStatus(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page Heading (AccountSettingsView renders its own heading) */}
          {active !== "settings" && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currentMeta.title}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {currentMeta.description}
                </p>
              </div>

              {active === "courses" && (
                <Link
                  to="/course-studio"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-xs transition shrink-0 shadow-xs w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Course in Studio</span>
                </Link>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ================================================================= */}
            {/* PANEL 1: OVERVIEW                                                 */}
            {/* ================================================================= */}
            {active === "overview" && (
              <motion.div key="overview" {...panelMotion} className="space-y-4 sm:space-y-6 min-w-0">
                {/* 4 Summary Metric Cards (2x2 Grid on Mobile, 4-Col on Desktop) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <MetricCard
                    label="Registered Users"
                    value={totalUsersCount}
                    sublabel={`${stats?.students ?? 0} learners`}
                    icon={Users}
                    onClick={isSuperAdmin ? () => selectAdminTab("users") : undefined}
                  />
                  <MetricCard
                    label="Incident Reports"
                    value={stats?.reports ?? reports.length}
                    sublabel="Submitted cases"
                    icon={AlertTriangle}
                    onClick={() => selectAdminTab("reports")}
                  />
                  <MetricCard
                    label="Published Courses"
                    value={stats?.courses ?? courses.length}
                    sublabel={`${stats?.certificates ?? certificates.length} certs issued`}
                    icon={BookOpen}
                    onClick={() => selectAdminTab("courses")}
                  />
                  <MetricCard
                    label="Verified Tutors"
                    value={stats?.vettedTutors ?? tutors.length}
                    sublabel={
                      pendingTutors.length > 0
                        ? `${pendingTutors.length} awaiting review`
                        : "All applications vetted"
                    }
                    icon={ShieldCheck}
                    onClick={() =>
                      selectAdminTab(pendingTutors.length > 0 ? "approvals" : "tutors")
                    }
                  />
                </div>

                {/* Quick Admin Actions Strip */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
                      Quick Actions
                    </span>
                    {isSuperAdmin && (
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                        Daily Broadcast: <strong className="text-slate-800">{scheduleConfig.displayTime} GMT</strong> ({scheduleConfig.enabled ? "Active" : "Paused"})
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Link
                      to="/course-studio"
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-bold text-slate-800 hover:text-[#0056D2] transition"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Plus className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />
                        <span className="truncate">Course Studio</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => selectAdminTab("reports")}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-bold text-slate-800 hover:text-[#0056D2] transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Triage Reports</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {isSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => selectAdminTab("daily-tips")}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-bold text-slate-800 hover:text-[#0056D2] transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />
                          <span className="truncate">Tips Schedule</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectAdminTab("approvals")}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-bold text-slate-800 hover:text-[#0056D2] transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Tutor Reviews</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    <Link
                      to="/cyberchat"
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-bold text-slate-800 hover:text-[#0056D2] transition"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Mentor Chat</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  </div>
                </div>

                {/* Recent Users (Superadmin) */}
                {isSuperAdmin && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xs min-w-0">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Recent Accounts</h2>
                      <button
                        type="button"
                        onClick={() => selectAdminTab("users")}
                        className="text-xs font-semibold text-[#0056D2] hover:underline cursor-pointer shrink-0"
                      >
                        Manage all ({totalUsersCount})
                      </button>
                    </div>

                    {users.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No registered accounts found.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {users.slice(0, 5).map((u) => (
                          <div
                            key={u.id}
                            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 min-w-0"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              <UserAvatar user={u} size="sm" rounded="rounded-xl" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {u.displayName}
                                  </p>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                                <p className="text-[10px] text-slate-400 sm:hidden mt-0.5">
                                  {u._count?.enrollments || 0} courses · {u._count?.certificates || 0} certs
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 shrink-0">
                              <span className="hidden sm:inline">
                                {u._count?.enrollments || 0} courses ·{" "}
                                {u._count?.certificates || 0} certs
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                                  ROLE_BADGE_STYLES[u.role] || ROLE_BADGE_STYLES.STUDENT
                                }`}
                              >
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Incidents & Tutor Applications Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0 w-full">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xs min-w-0">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Recent Incident Reports
                      </h2>
                      <button
                        type="button"
                        onClick={() => selectAdminTab("reports")}
                        className="text-xs font-semibold text-[#0056D2] hover:underline cursor-pointer shrink-0"
                      >
                        View all ({reports.length})
                      </button>
                    </div>

                    {reports.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No incident reports submitted.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {reports.slice(0, 4).map((r) => (
                          <div
                            key={r.id}
                            className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex justify-between items-center gap-3 text-xs min-w-0"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-mono font-bold text-slate-900">
                                {r.refCode}
                              </span>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {r.category}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold shrink-0 ${
                                INCIDENT_STATUS_STYLES[r.status] ||
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {r.status.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xs min-w-0">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Pending Tutor Applications
                      </h2>
                      <button
                        type="button"
                        onClick={() => selectAdminTab("approvals")}
                        className="text-xs font-semibold text-[#0056D2] hover:underline cursor-pointer shrink-0"
                      >
                        Review ({pendingTutors.length})
                      </button>
                    </div>

                    {pendingTutors.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No tutor applications awaiting review.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {pendingTutors.slice(0, 4).map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex justify-between items-center gap-3 text-xs min-w-0"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">
                                {t.user?.displayName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{t.headline}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => approveTutor(t.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition shrink-0 cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 2: USERS                                                    */}
            {/* ================================================================= */}
            {active === "users" && isSuperAdmin && (
              <motion.div
                key="users"
                {...panelMotion}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xs min-w-0"
              >
                {/* Mobile-Optimized Search & Role Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-0 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") loadUsers(userSearch, userRoleFilter);
                        }}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                      >
                        <option value="">All roles</option>
                        <option value="STUDENT">Students</option>
                        <option value="TUTOR">Tutors</option>
                        <option value="CSA_OFFICER">CSA Officers</option>
                        <option value="ADMIN">Admins</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => loadUsers(userSearch, userRoleFilter)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Search
                      </button>

                      {(userSearch || userRoleFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearch("");
                            setUserRoleFilter("");
                            loadUsers("", "");
                          }}
                          className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs text-slate-500 font-mono shrink-0">
                    {users.length} {users.length === 1 ? "account" : "accounts"}
                  </span>
                </div>

                {users.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 text-xs">
                    No accounts match your filter.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <UserAvatar user={u} size="md" rounded="rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-full">
                                {u.displayName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  ROLE_BADGE_STYLES[u.role] || ROLE_BADGE_STYLES.STUDENT
                                }`}
                              >
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                              {u.ageBand && (
                                <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                                  {u.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19+"}
                                </span>
                              )}
                              {u.receiveDailyTips && (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/70 inline-flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" /> Tips On
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                              <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                              <span>·</span>
                              <span>
                                {u._count?.enrollments || 0} courses, {u._count?.certificates || 0} certs
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                            <label className="text-[11px] font-semibold text-slate-500 shrink-0">
                              Role:
                            </label>
                            <select
                              value={u.role}
                              onChange={(e) => changeUserRole(u.id, e.target.value)}
                              className="flex-1 sm:flex-initial text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#0056D2] cursor-pointer"
                            >
                              <option value="STUDENT">Student</option>
                              <option value="TUTOR">Tutor</option>
                              <option value="CSA_OFFICER">CSA Officer</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteUser(u.id, u.displayName)}
                            title="Delete user account"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/60 sm:border-transparent hover:border-rose-200 transition cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 3: DAILY CYBER SAFETY TIPS LOG & SCHEDULE                   */}
            {/* ================================================================= */}
            {active === "daily-tips" && isSuperAdmin && (
              <motion.div key="daily-tips" {...panelMotion} className="space-y-4 sm:space-y-6 min-w-0">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xs min-w-0">
                  {/* Top Bar: Schedule Summary + Action Buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                      <Clock className="w-4 h-4 text-[#0056D2] shrink-0" />
                      <span className="leading-snug">
                        Next broadcast:{" "}
                        <strong className="text-slate-900">
                          {dailyTipsData.summary?.nextScheduledRunLabel || `${scheduleConfig.displayTime} GMT`}
                        </strong>{" "}
                        <span className="text-slate-400">
                          ({dailyTipsData.summary?.timezone || "Africa/Accra"})
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadDailyTipsLogs()}
                        disabled={dailyTipsLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${dailyTipsLoading ? "animate-spin text-[#0056D2]" : ""}`}
                        />
                        <span>Refresh</span>
                      </button>

                      <button
                        type="button"
                        onClick={exportDailyTipLogsCsv}
                        disabled={!dailyTipsData.emailLogs?.length}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-400" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDispatchTipsNow}
                        disabled={
                          dispatchingNow || (dailyTipsData.summary?.activeSubscribers ?? 0) === 0
                        }
                        title="Send today's cyber safety tip to all opted-in subscribers"
                        className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                      >
                        {dispatchingNow ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending Broadcast...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Today&apos;s Tip Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ADMIN SCHEDULE CONTROL PANEL */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-4 h-4 text-[#0056D2] shrink-0" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Broadcast Schedule Controls
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            scheduleConfig.enabled
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {scheduleConfig.enabled ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Dispatches automated tips (email &amp; web push) daily at{" "}
                        <strong className="text-slate-800">{scheduleConfig.displayTime} GMT</strong>.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSaveSchedule}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 sm:py-1.5 shadow-2xs">
                        <label
                          htmlFor="tips-schedule-time"
                          className="text-xs font-semibold text-slate-500"
                        >
                          Time (GMT):
                        </label>
                        <input
                          id="tips-schedule-time"
                          type="time"
                          value={scheduleInputTime}
                          onChange={(e) => setScheduleInputTime(e.target.value)}
                          className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={scheduleSaving || scheduleInputTime === scheduleConfig.timeString}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          {scheduleSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Set Time</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleScheduleStatus}
                          disabled={scheduleSaving}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            scheduleConfig.enabled
                              ? "border-amber-200 bg-amber-50 hover:bg-amber-100/70 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800"
                          }`}
                        >
                          {scheduleConfig.enabled ? "Pause Auto-Send" : "Resume Auto-Send"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 4 Summary Metrics (2x2 Grid on Mobile) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                      <p className="text-[11px] font-medium text-slate-500">Subscribers</p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-display">
                        {dailyTipsData.summary?.activeSubscribers ?? 0}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Opted-in accounts</p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        Sent today ({dailyTipsData.summary?.todayDateStr || "Today"})
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-display">
                        {dailyTipsData.summary?.sentTodayCount ?? 0}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                        Next: {dailyTipsData.summary?.nextScheduledRunLabel || "07:00 GMT"}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                      <p className="text-[11px] font-medium text-slate-500">Total delivered</p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-display">
                        {dailyTipsData.summary?.totalEmailsSent ?? 0}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">All-time emails</p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                      <p className="text-[11px] font-medium text-slate-500">Delivery errors</p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-display">
                        {dailyTipsData.summary?.totalFailed ?? 0}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Bounce/relay errors</p>
                    </div>
                  </div>

                  {/* Preview Card for Today's Tip */}
                  {dailyTipsData.summary?.todaysTip && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/40 border border-blue-200/60 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-[#0056D2] font-bold">
                        <span>Today&apos;s Tip #{dailyTipsData.summary.todaysTip.index}</span>
                        <span>·</span>
                        <span>{dailyTipsData.summary.todaysTip.category}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {dailyTipsData.summary.todaysTip.title}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {dailyTipsData.summary.todaysTip.summary}
                      </p>
                    </div>
                  )}

                  {/* Sub-view Switcher & Filters */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
                    <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
                      <button
                        type="button"
                        onClick={() => setTipLogSubView("daily")}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer truncate ${
                          tipLogSubView === "daily"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        By day ({dailyTipsData.dispatches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipLogSubView("emails")}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer truncate ${
                          tipLogSubView === "emails"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Emails ({dailyTipsData.emailLogs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipLogSubView("subscribers")}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer truncate ${
                          tipLogSubView === "subscribers"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Subscribers ({dailyTipsData.subscribers.length})
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="grid grid-cols-2 sm:flex items-center gap-2">
                        <input
                          type="date"
                          value={tipLogDate}
                          onChange={(e) => setTipLogDate(e.target.value)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-800 focus:outline-none focus:border-[#0056D2] focus:bg-white w-full sm:w-auto"
                          title="Filter by dispatch date"
                        />

                        <select
                          value={tipLogStatus}
                          onChange={(e) => setTipLogStatus(e.target.value)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0056D2] focus:bg-white w-full sm:w-auto"
                        >
                          <option value="">All statuses</option>
                          <option value="SENT">Sent</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-48">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={tipLogSearch}
                            onChange={(e) => setTipLogSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") loadDailyTipsLogs(tipLogSearch);
                            }}
                            placeholder="Recipient email..."
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => loadDailyTipsLogs(tipLogSearch)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
                        >
                          Filter
                        </button>

                        {(tipLogDate || tipLogStatus || tipLogSearch) && (
                          <button
                            type="button"
                            onClick={() => {
                              setTipLogDate("");
                              setTipLogStatus("");
                              setTipLogSearch("");
                              loadDailyTipsLogs("");
                            }}
                            className="px-2 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-view 1: Daily Dispatches */}
                  {tipLogSubView === "daily" && (
                    <div className="space-y-4 pt-1">
                      {dailyTipsLoading ? (
                        <div className="py-10 text-center text-xs text-slate-500">
                          Loading dispatch logs...
                        </div>
                      ) : dailyTipsData.dispatches.length === 0 ? (
                        <div className="py-10 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 space-y-1.5">
                          <Mail className="w-5 h-5 text-slate-400 mx-auto" />
                          <p className="text-sm font-bold text-slate-800">
                            No daily dispatches recorded yet
                          </p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Tips are sent automatically at {scheduleConfig.displayTime} GMT to opted-in accounts, or use &ldquo;Send Today&apos;s Tip Now&rdquo; above.
                          </p>
                        </div>
                      ) : (
                        dailyTipsData.dispatches.map((d) => (
                          <div
                            key={d.id}
                            className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                          >
                            <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                    {d.dispatchDate}
                                  </span>
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {d.triggerType === "SCHEDULED_7AM"
                                      ? "Scheduled"
                                      : "Manual send"}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(d.startedAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                  Tip #{d.tipIndex}: {d.tipTitle}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                  {d.sentCount} sent
                                </span>
                                {d.failedCount > 0 && (
                                  <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                                    {d.failedCount} failed
                                  </span>
                                )}
                              </div>
                            </div>

                            {!d.logs || d.logs.length === 0 ? (
                              <p className="p-4 text-xs text-slate-500">
                                No matching recipient rows for this dispatch.
                              </p>
                            ) : (
                              <>
                                {/* Mobile Recipient List */}
                                <div className="md:hidden divide-y divide-slate-100">
                                  {d.logs.map((log) => (
                                    <div key={log.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-900 truncate">{log.recipientName}</p>
                                        <p className="font-mono text-[11px] text-slate-500 truncate">{log.recipientEmail}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        {log.status === "SENT" ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                            <CheckCircle2 className="w-3 h-3" /> Sent
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                                            Failed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-200/80 text-[11px] text-slate-500 bg-white">
                                        <th className="py-2.5 px-4 font-semibold">Recipient</th>
                                        <th className="py-2.5 px-4 font-semibold">Name</th>
                                        <th className="py-2.5 px-4 font-semibold">Time sent</th>
                                        <th className="py-2.5 px-4 font-semibold">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {d.logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/60">
                                          <td className="py-2.5 px-4 font-mono text-slate-800">
                                            {log.recipientEmail}
                                          </td>
                                          <td className="py-2.5 px-4 text-slate-600">
                                            {log.recipientName}
                                          </td>
                                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                                            {new Date(log.sentAt).toLocaleString()}
                                          </td>
                                          <td className="py-2.5 px-4">
                                            {log.status === "SENT" ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                                <CheckCircle2 className="w-3 h-3" /> Sent
                                              </span>
                                            ) : (
                                              <span
                                                title={log.errorMessage || "Delivery failed"}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold"
                                              >
                                                Failed
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sub-view 2: All Recipient Emails */}
                  {tipLogSubView === "emails" && (
                    <div className="pt-1">
                      {dailyTipsData.emailLogs.length === 0 ? (
                        <p className="py-10 text-center text-xs text-slate-400">
                          No email log entries match your filter.
                        </p>
                      ) : (
                        <>
                          {/* Mobile Card List */}
                          <div className="md:hidden space-y-2">
                            {dailyTipsData.emailLogs.map((log) => (
                              <div
                                key={log.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-bold text-slate-700">
                                    {log.dispatchDate}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      log.status === "SENT"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-rose-50 text-rose-800 border-rose-200"
                                    }`}
                                  >
                                    {log.status === "SENT" ? "Sent" : "Failed"}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-900 truncate">{log.recipientName}</p>
                                <p className="font-mono text-[11px] text-slate-500 truncate">{log.recipientEmail}</p>
                                <p className="text-[11px] text-slate-600 truncate">{log.tipTitle}</p>
                              </div>
                            ))}
                          </div>

                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-500">
                                  <th className="py-2.5 px-4 font-semibold">Date</th>
                                  <th className="py-2.5 px-4 font-semibold">Recipient</th>
                                  <th className="py-2.5 px-4 font-semibold">Name</th>
                                  <th className="py-2.5 px-4 font-semibold">Tip</th>
                                  <th className="py-2.5 px-4 font-semibold">Time</th>
                                  <th className="py-2.5 px-4 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {dailyTipsData.emailLogs.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50/60">
                                    <td className="py-2.5 px-4 font-mono text-slate-700">
                                      {log.dispatchDate}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono text-slate-900">
                                      {log.recipientEmail}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-600">{log.recipientName}</td>
                                    <td className="py-2.5 px-4 text-slate-800">{log.tipTitle}</td>
                                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                                      {new Date(log.sentAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                      })}
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                          log.status === "SENT"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : "bg-rose-50 text-rose-800 border-rose-200"
                                        }`}
                                      >
                                        {log.status === "SENT" ? "Sent" : "Failed"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Sub-view 3: Subscribers */}
                  {tipLogSubView === "subscribers" && (
                    <div className="pt-1">
                      {dailyTipsData.subscribers.length === 0 ? (
                        <p className="py-10 text-center text-xs text-slate-400">
                          No accounts are currently subscribed to daily tips.
                        </p>
                      ) : (
                        <>
                          {/* Mobile Subscriber Cards */}
                          <div className="md:hidden space-y-2">
                            {dailyTipsData.subscribers.map((sub) => (
                              <div
                                key={sub.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 truncate">{sub.displayName}</p>
                                  <p className="font-mono text-[11px] text-slate-500 truncate">{sub.email}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Joined {new Date(sub.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 ${
                                    ROLE_BADGE_STYLES[sub.role] || ROLE_BADGE_STYLES.STUDENT
                                  }`}
                                >
                                  {ROLE_LABELS[sub.role] || sub.role}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-500">
                                  <th className="py-2.5 px-4 font-semibold">Email</th>
                                  <th className="py-2.5 px-4 font-semibold">Name</th>
                                  <th className="py-2.5 px-4 font-semibold">Role</th>
                                  <th className="py-2.5 px-4 font-semibold">Joined</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {dailyTipsData.subscribers.map((sub) => (
                                  <tr key={sub.id} className="hover:bg-slate-50/60">
                                    <td className="py-2.5 px-4 font-mono text-slate-900">
                                      {sub.email}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-700">{sub.displayName}</td>
                                    <td className="py-2.5 px-4">
                                      <span
                                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                                          ROLE_BADGE_STYLES[sub.role] || ROLE_BADGE_STYLES.STUDENT
                                        }`}
                                      >
                                        {ROLE_LABELS[sub.role] || sub.role}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-500">
                                      {new Date(sub.createdAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 4: INCIDENT REPORTS                                         */}
            {/* ================================================================= */}
            {active === "reports" && (
              <motion.div
                key="reports"
                {...panelMotion}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xs min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-0 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ref code or narrative..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0056D2] focus:bg-white"
                    >
                      <option value="">All categories</option>
                      <option value="SEXTORTION">Sextortion</option>
                      <option value="GROOMING">Grooming</option>
                      <option value="SCAM">Scams &amp; fraud</option>
                      <option value="BULLYING">Cyberbullying</option>
                      <option value="IMPERSONATION">Impersonation</option>
                    </select>
                  </div>

                  <span className="text-[11px] sm:text-xs text-slate-500 font-mono shrink-0">
                    {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
                  </span>
                </div>

                {filteredReports.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-12">
                    No incident reports match this filter.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((r) => (
                      <div
                        key={r.id}
                        className="p-3.5 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3 min-w-0"
                      >
                        {/* Case Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                              {r.refCode}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {r.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold ${
                                INCIDENT_STATUS_STYLES[r.status] ||
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {r.status.replace("_", " ")}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Case Narrative */}
                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80 break-words">
                          {r.narrative}
                        </p>

                        {/* Officer Action Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Update case disposition or export official brief:
                          </span>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                              value={r.status}
                              onChange={(e) => updateIncidentStatus(r.id, e.target.value)}
                              className="flex-1 sm:flex-initial text-xs font-semibold px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0056D2] cursor-pointer"
                            >
                              <option value="SUBMITTED">Submitted</option>
                              <option value="UNDER_REVIEW">Under review</option>
                              <option value="ESCALATED">Escalated</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="DISMISSED">Dismissed</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => exportPdf(r.id, r.refCode)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shrink-0"
                            >
                              <FileDown className="w-3.5 h-3.5 text-[#0056D2]" />
                              <span>PDF Brief</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 5: TUTOR APPLICATIONS                                       */}
            {/* ================================================================= */}
            {active === "approvals" && (
              <motion.div
                key="approvals"
                {...panelMotion}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 shadow-2xs min-w-0"
              >
                {pendingTutors.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-12">
                    No pending tutor applications.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingTutors.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3 min-w-0"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar user={t.user} size="md" rounded="rounded-xl" />
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {t.user?.displayName}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5 break-words">{t.headline}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => approveTutor(t.id)}
                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 sm:py-2 rounded-xl text-xs transition shrink-0 cursor-pointer"
                          >
                            Approve Tutor
                          </button>
                        </div>
                        {t.bio && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80 break-words">
                            {t.bio}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 6: VERIFIED TUTORS                                          */}
            {/* ================================================================= */}
            {active === "tutors" && (
              <motion.div
                key="tutors"
                {...panelMotion}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 shadow-2xs min-w-0"
              >
                {tutors.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-12">
                    No verified tutors yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {tutors.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-slate-300 transition min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar user={t.user} size="md" rounded="rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {t.user?.displayName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{t.headline}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTutor(t.id, t.user?.displayName)}
                          className="w-full sm:w-auto text-center text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-3.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 transition shrink-0 cursor-pointer"
                        >
                          Revoke Verification
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 7: COURSES                                                  */}
            {/* ================================================================= */}
            {active === "courses" && (
              <motion.div
                key="courses"
                {...panelMotion}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xs min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 border-b border-slate-100">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter courses by title or category..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
                    {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
                  </span>
                </div>

                {filteredCourses.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-12">
                    No courses match your search.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {filteredCourses.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-slate-300 transition min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm break-words">
                            {c.title}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-[11px] font-medium text-slate-500">
                              {c.category}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                              {c.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19+"}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                          <Link
                            to={`/courses/${c.slug}`}
                            className="text-center px-3.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                          >
                            Preview
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeCourse(c.id, c.title)}
                            className="text-center px-3.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 8: CERTIFICATES                                             */}
            {/* ================================================================= */}
            {active === "certificates" && (
              <motion.div
                key="certificates"
                {...panelMotion}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xs min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 border-b border-slate-100">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ref code, learner, or course..."
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
                    {filteredCerts.length}{" "}
                    {filteredCerts.length === 1 ? "certificate" : "certificates"}
                  </span>
                </div>

                {filteredCerts.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-12">
                    No certificates match your search.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {filteredCerts.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white hover:border-slate-300 transition min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {c.user?.displayName}
                          </p>
                          <p className="text-slate-500 mt-0.5 break-words">{c.course?.title}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                              {c.certRef}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(c.issuedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Link
                            to={`/verify-certificate/${c.certRef}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0056D2] hover:bg-blue-100 font-bold text-[11px] transition shrink-0"
                          >
                            <span>Verify</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* PANEL 9: SETTINGS                                                 */}
            {/* ================================================================= */}
            {active === "settings" && (
              <motion.div key="settings" {...panelMotion} className="min-w-0">
                <AccountSettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs"
          onClick={() => {
            if (!confirmBusy) setConfirmDialog(null);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 break-words">
                  {confirmDialog.title}
                </h3>
              </div>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmDialog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>

            <div className="grid grid-cols-2 sm:flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  try {
                    await confirmDialog.onConfirm?.();
                    setConfirmDialog(null);
                  } finally {
                    setConfirmBusy(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {confirmBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{confirmDialog.confirmLabel || "Confirm"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sublabel, icon: Icon, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`w-full text-left bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 transition shadow-2xs min-w-0 ${
        onClick ? "hover:border-blue-300 hover:shadow-xs cursor-pointer" : ""
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug truncate">
          {label}
        </span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-200/80 text-[#0056D2] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight font-display">
        {value}
      </div>
      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{sublabel}</p>
    </Wrapper>
  );
}
