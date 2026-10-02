import { useEffect, useState } from "react";
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
  Clock,
  Compass,
  Filter,
  Search,
  Activity,
  FileText,
  Lock,
  Sparkles,
  ExternalLink,
  X,
  Shield,
  ArrowRight,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Cpu,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  Globe,
  LayoutGrid,
  Menu
} from "lucide-react";
import api from "../utils/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccountSettingsView from "../components/AccountSettingsView";
import CyberGuardLogo from "../components/CyberGuardLogo";

export default function CsaPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialActive = searchParams.get("tab") || "overview";
  const [active, setActive] = useState(initialActive);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "users", "reports", "approvals", "tutors", "courses", "certificates", "settings"].includes(tabParam)) {
      setActive(tabParam);
    }
  }, [searchParams]);

  const [reports, setReports] = useState([]);
  const [pendingTutors, setPendingTutors] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [stats, setStats] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [certSearch, setCertSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    const query = globalSearch.trim();
    if (searchCategory === "users") {
      setActive("users");
      setUserSearch(query);
      loadUsers(query, userRoleFilter);
    } else if (searchCategory === "reports") {
      setActive("reports");
    } else if (searchCategory === "courses") {
      setActive("courses");
    } else if (searchCategory === "certificates") {
      setActive("certificates");
      setCertSearch(query);
    } else {
      // Default behavior
      if (active === "users") {
        setUserSearch(query);
        loadUsers(query, userRoleFilter);
      } else if (active === "certificates") {
        setCertSearch(query);
      } else {
        setActive("users");
        setUserSearch(query);
        loadUsers(query, userRoleFilter);
      }
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (active === "reports") loadReports();
    if (active === "approvals") loadPendingTutors();
    if (active === "users") loadUsers();
    if (active === "tutors") loadTutors();
    if (active === "courses") loadCourses();
    if (active === "certificates") loadCertificates();
  }, [active, categoryFilter, userRoleFilter]);

  async function loadUsers(searchVal = userSearch, roleVal = userRoleFilter) {
    try {
      const res = await api.get("/auth/users", {
        params: { role: roleVal || undefined, search: searchVal || undefined },
      });
      setUsers(res.data || []);
    } catch (err) {
      setUsers([]);
    }
  }

  async function changeUserRole(userId, newRole) {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      setActionStatus(`User role successfully updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      await loadStats();
    } catch (err) {
      setActionStatus(err.response?.data?.error || "Failed to update user role.");
    }
  }

  async function deleteUser(userId, name) {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/auth/users/${userId}`);
      setActionStatus(`User account "${name}" removed.`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      await loadStats();
    } catch (err) {
      setActionStatus(err.response?.data?.error || "Failed to delete user account.");
    }
  }

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
        loadUsers(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  function loadStats() {
    return api.get("/courses/stats/summary").then((res) => setStats(res.data)).catch(() => setStats(null));
  }

  function loadReports() {
    return api
      .get("/incidents", { params: categoryFilter ? { category: categoryFilter } : {} })
      .then((res) => setReports(res.data))
      .catch(() => setReports([]));
  }

  function loadPendingTutors() {
    return api.get("/tutors/pending").then((res) => setPendingTutors(res.data)).catch(() => setPendingTutors([]));
  }

  function loadTutors() {
    return api.get("/tutors").then((res) => setTutors(res.data)).catch(() => setTutors([]));
  }

  function loadCourses() {
    return api.get("/courses/all").then((res) => setCourses(res.data)).catch(() => setCourses([]));
  }

  function loadCertificates() {
    return api.get("/courses/certificates").then((res) => setCertificates(res.data)).catch(() => setCertificates([]));
  }

  async function updateIncidentStatus(id, newStatus) {
    try {
      await api.patch(`/incidents/${id}/status`, { status: newStatus });
      setActionStatus(`Incident status updated to ${newStatus}`);
      await loadReports();
    } catch (e) {
      setActionStatus("Failed to update incident status.");
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
    } catch (e) {
      alert("Error exporting PDF case brief.");
    }
  }

  async function approveTutor(tutorId) {
    await api.patch(`/tutors/${tutorId}/vet`);
    setActionStatus("Tutor application approved & verified.");
    await loadPendingTutors();
    await loadTutors();
    await loadStats();
  }

  async function removeTutor(tutorId) {
    if (!confirm("Revoke tutor accreditation and revert user role?")) return;
    await api.delete(`/tutors/${tutorId}`);
    setActionStatus("Tutor accreditation revoked.");
    await loadTutors();
    await loadPendingTutors();
    await loadStats();
  }

  async function removeCourse(courseId) {
    if (!confirm("Permanently delete this course? This action cannot be undone.")) return;
    await api.delete(`/courses/${courseId}`);
    setActionStatus("Course removed from catalog.");
    await loadCourses();
    await loadStats();
  }

  const filteredCerts = certificates.filter((c) =>
    c.certRef?.toLowerCase().includes(certSearch.toLowerCase()) ||
    c.user?.displayName?.toLowerCase().includes(certSearch.toLowerCase()) ||
    c.course?.title?.toLowerCase().includes(certSearch.toLowerCase())
  );

  const SIDEBAR_SECTIONS = [
    {
      title: "Operations & Governance",
      items: [
        { key: "overview", label: "Overview", icon: LayoutGrid, count: null, color: "text-blue-300", bg: "bg-blue-500/20" },
        { key: "users", label: "User Governance", icon: Users, count: users.length, color: "text-indigo-300", bg: "bg-indigo-500/20" },
      ],
    },
    {
      title: "Safety & Compliance",
      items: [
        { key: "reports", label: "Incident Triage", icon: AlertTriangle, count: reports.length, alert: reports.length > 0, color: "text-rose-300", bg: "bg-rose-500/20" },
        { key: "approvals", label: "Mentor Vetting", icon: UserCheck, count: pendingTutors.length, warn: pendingTutors.length > 0, color: "text-amber-300", bg: "bg-amber-500/20" },
        { key: "tutors", label: "Accredited Mentors", icon: ShieldCheck, count: tutors.length, color: "text-emerald-300", bg: "bg-emerald-500/20" },
      ],
    },
    {
      title: "Curriculum & Records",
      items: [
        { key: "courses", label: "Course Catalog", icon: BookOpen, count: courses.length, color: "text-sky-300", bg: "bg-sky-500/20" },
        { key: "certificates", label: "Issued Registry", icon: Award, count: certificates.length, color: "text-amber-300", bg: "bg-amber-500/20" },
      ],
    },
    {
      title: "Account & Preferences",
      items: [
        { key: "settings", label: "Account Settings", icon: SlidersHorizontal, color: "text-cyan-300", bg: "bg-cyan-500/20" },
      ],
    },
    {
      title: "Quick Portals",
      items: [
        { key: "cyberchat", label: "CyberChat (E2EE)", icon: Lock, isLink: true, to: "/cyberchat", color: "text-teal-300", bg: "bg-teal-500/20" },
        { key: "studio", label: "Course Studio", icon: Plus, isLink: true, to: "/course-studio", color: "text-purple-300", bg: "bg-purple-500/20" },
        { key: "reportPortal", label: "Incident Portal", icon: ExternalLink, isLink: true, to: "/report", color: "text-rose-300", bg: "bg-rose-500/20" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-slate-900 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===================== CSA COMMAND CENTER BLUE SIDEBAR ===================== */}
      <aside
        className={`w-68 bg-[#0A1E3F] text-white border-r border-blue-900/60 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 fixed shadow-2xl" : "-translate-x-full lg:translate-x-0 fixed lg:sticky"
        }`}
      >
        {/* Top Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-blue-900/60 bg-[#07162E]/70">
          <Link to="/" className="flex items-center group" title="Return to Landing Page">
            <CyberGuardLogo variant="full" size="sm" subtitle="CSA Command Center" theme="dark" interactive />
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-blue-300 hover:text-white p-1.5 rounded-lg hover:bg-blue-800/40 transition"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Middle Scrollable Nav List Categorized */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-blue-300/80">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                if (item.isLink) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-blue-100/90 hover:text-white hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.bg || 'bg-blue-500/20'} ${item.color || 'text-blue-300'} ring-1 ring-white/10 group-hover:scale-105 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-300/50 group-hover:text-blue-200 shrink-0 transition" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActive(item.key);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group ${
                      isActive
                        ? "bg-[#0056D2] text-white font-bold shadow-md shadow-blue-950/60 ring-1 ring-blue-400/40"
                        : "text-blue-100/90 hover:text-white hover:bg-white/10 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isActive
                            ? "bg-white/20 text-white ring-1 ring-white/30"
                            : `${item.bg || 'bg-blue-500/20'} ${item.color || 'text-blue-300'} ring-1 ring-white/10 group-hover:scale-105`
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.count !== null && item.count !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.alert
                              ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                              : item.warn
                              ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                              : "bg-[#07162E] text-blue-200 border border-blue-800/80"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User Profile Footer */}
        <div className="border-t border-blue-900/60 p-3 bg-[#07162E]/80 flex items-center justify-between">
          <button
            onClick={() => {
              setActive("settings");
              setMobileSidebarOpen(false);
            }}
            title="Open Account Settings"
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition cursor-pointer group flex-1 mr-1"
          >
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-blue-400/40 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-900/60 text-emerald-400 flex items-center justify-center text-base border border-blue-500/40 shadow-xs">
                  <i className="fa-solid fa-circle-user"></i>
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#07162E]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition">
                {user?.displayName || "Patrick Paul"}
              </p>
              <p className="text-[10px] text-blue-300/80 font-mono truncate">
                {user?.phoneNumber || user?.email || "+233544748171"}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                setActive("settings");
                setMobileSidebarOpen(false);
              }}
              title="Account Settings"
              className={`p-1.5 rounded-lg transition ${
                active === "settings"
                  ? "bg-blue-600 text-white"
                  : "text-blue-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/25 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN ADMINISTRATIVE CANVAS ===================== */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#f8fafc]">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Admin</span>
              </div>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-900 capitalize">
                {active === "overview" ? "Overview" : active}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform Online</span>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + "/admin");
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition"
              title="Copy Command Portal URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>cyberguard.gh/admin</span>
            </button>

            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition hidden md:flex items-center gap-1.5"
              title="View Public Site"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Site</span>
            </Link>

            <button
              onClick={() => setActive("settings")}
              title="Open Account Settings"
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 hover:ring-2 hover:ring-emerald-400 transition cursor-pointer shrink-0"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-900 text-emerald-400 flex items-center justify-center text-base">
                  <i className="fa-solid fa-circle-user"></i>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Status Message Notification */}
          {actionStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex justify-between items-center shadow-xs">
              <span>{actionStatus}</span>
              <button onClick={() => setActionStatus("")} className="text-emerald-700 hover:text-emerald-950">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Admin Overview Header (shown on admin tabs) */}
          {active !== "settings" && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {active === "overview" ? "Admin Overview" : active.replace(/^[a-z]/, (c) => c.toUpperCase())}
                </h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time governance, Act 1038 incident triage, and educational telemetry console.
              </p>
            </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold font-mono shadow-2xs">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{users.length || 74} registered users</span>
              </div>
            </div>
          )}

          {/* Executive Command Search Console & 4 Executive KPI Cards (hidden on settings tab) */}
          {active !== "settings" && (
            <>
              {/* Executive Command Search Console */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xs"
              >
                <div className="relative shrink-0 sm:w-44">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 pr-8 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer transition"
                  >
                    <option value="all">All Modules</option>
                    <option value="users">Users</option>
                    <option value="reports">Incidents</option>
                    <option value="courses">Courses</option>
                    <option value="certificates">Certificates</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search across users, incident reference codes, or courses..."
                    value={globalSearch}
                    onChange={(e) => {
                      setGlobalSearch(e.target.value);
                      setUserSearch(e.target.value);
                    }}
                    className="w-full bg-transparent text-slate-900 text-xs placeholder-slate-400 pl-9 pr-12 py-2 focus:outline-none"
                  />
                  <div className="hidden sm:flex items-center absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                      Ctrl K
                    </kbd>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </form>

              {/* 4 Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-slate-600">Total Users</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-display">
                    {users.length || 74}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Platform accounts</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-slate-600">Total Incidents</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-display">
                    {stats?.reports ?? reports.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Act 1038 reports</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-slate-600">Total Courses</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-display">
                    {stats?.courses ?? courses.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Published curriculum</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-slate-600">Accredited Mentors</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-display">
                    {stats?.vettedTutors ?? tutors.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Verified tutors</p>
                </div>
              </div>
            </>
          )}

          {/* PANEL 1: SYSTEM OVERVIEW */}
          {active === "overview" && (
            <div className="space-y-6">
              {/* Recent Users Card matching Lynkinbio screenshot */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Users</h2>
                  <button
                    onClick={() => setActive("users")}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    View all
                  </button>
                </div>

                {users.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No users registered yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {users.slice(0, 4).map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-300 hover:bg-white transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                            <i className="fa-solid fa-circle-user text-base"></i>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{u.displayName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {u.phoneNumber || u.email} — <span className="text-emerald-700 font-semibold">{u.role}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <span>{u._count?.enrollments || 0} courses · {u._count?.certificates || 0} certs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incidents & Tutor Approvals Row */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" /> Active Incidents
                    </h3>
                    <button
                      onClick={() => setActive("reports")}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Manage all ({reports.length})
                    </button>
                  </div>

                  {reports.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No active incident reports.</p>
                  ) : (
                    <div className="space-y-2">
                      {reports.slice(0, 3).map((r) => (
                        <div key={r.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex justify-between items-center text-xs hover:border-slate-300 transition">
                          <div>
                            <span className="font-mono font-bold text-emerald-700">{r.refCode}</span>
                            <p className="font-semibold text-slate-900">{r.category}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-500" /> Pending Mentor Vettings
                    </h3>
                    <button
                      onClick={() => setActive("approvals")}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Review all ({pendingTutors.length})
                    </button>
                  </div>

                  {pendingTutors.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No applications awaiting review.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingTutors.slice(0, 3).map((t) => (
                        <div key={t.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex justify-between items-center text-xs hover:border-slate-300 transition">
                          <div>
                            <p className="font-bold text-slate-900">{t.user?.displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{t.headline}</p>
                          </div>
                          <button
                            onClick={() => approveTutor(t.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow-xs"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 2: USER ROLES & GOVERNANCE */}
          {active === "users" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Access Control & Managerial Roles</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">User Management & Permissions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Promote users, reassign managerial roles, or manage accounts. Administrators hold supervisory oversight and cannot enroll as students.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") loadUsers(userSearch, userRoleFilter);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={() => loadUsers(userSearch, userRoleFilter)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                  >
                    Filter
                  </button>
                </div>
              </div>

              {/* Users Roster List */}
              {users.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No accounts found matching your query.
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => {
                    const roleBadgeColor =
                      u.role === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : u.role === "CSA_OFFICER"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : u.role === "TUTOR"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={u.id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <i className="fa-solid fa-circle-user text-xl text-emerald-700"></i>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{u.displayName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                                {u.role}
                              </span>
                              {u.ageBand && (
                                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  {u.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              <span>{u.email}</span>
                              <span>•</span>
                              <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="font-medium text-emerald-700">
                                {u._count?.enrollments || 0} Enrollments · {u._count?.certificates || 0} Certs
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Managerial Role Selector & Actions */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">Role:</span>
                            <select
                              value={u.role}
                              onChange={(e) => changeUserRole(u.id, e.target.value)}
                              className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:border-emerald-500 focus:outline-none shadow-2xs"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="TUTOR">TUTOR</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="CSA_OFFICER">CSA OFFICER</option>
                            </select>
                          </div>

                          <button
                            onClick={() => deleteUser(u.id, u.displayName)}
                            title="Delete user account"
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PANEL 3: INCIDENT TRIAGE */}
          {active === "reports" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Incident Triage Center</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Review reported cybersecurity crimes, inspect SHA-256 evidence hashes, and export case briefs.</p>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Incident Categories</option>
                  <option value="SEXTORTION">Sextortion</option>
                  <option value="GROOMING">Grooming</option>
                  <option value="SCAM">Scams & Fraud</option>
                  <option value="BULLYING">Cyberbullying</option>
                  <option value="IMPERSONATION">Impersonation</option>
                </select>
              </div>

              {reports.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-10">No incident reports found for this filter.</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((r) => (
                    <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                            {r.refCode}
                          </span>
                          <span className="text-xs font-bold uppercase text-slate-900">{r.category}</span>
                          <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={r.status}
                            onChange={(e) => updateIncidentStatus(r.id, e.target.value)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                          >
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW</option>
                            <option value="ESCALATED">ESCALATED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="DISMISSED">DISMISSED</option>
                          </select>

                          <button
                            onClick={() => exportPdf(r.id, r.refCode)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs shadow-xs transition"
                          >
                            <FileDown className="w-3.5 h-3.5" /> PDF Brief
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                        "{r.narrative}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 4: TUTOR APPROVALS */}
          {active === "approvals" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900">Pending Tutor Vettings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Accredit verified cyber educators and mentors.</p>
              </div>
              {pendingTutors.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-10">No pending tutor applications.</p>
              ) : (
                <div className="space-y-4">
                  {pendingTutors.map((t) => (
                    <div key={t.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-slate-900">{t.user?.displayName}</h3>
                          <p className="text-xs font-semibold text-emerald-700">{t.headline}</p>
                        </div>
                        <button
                          onClick={() => approveTutor(t.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
                        >
                          VET & APPROVE
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">{t.bio}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 5: ACCREDITED MENTORS */}
          {active === "tutors" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900">Accredited Mentor Roster</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tutors approved to host 1-on-1 mentorship sessions.</p>
              </div>
              {tutors.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-10">No accredited tutors found.</p>
              ) : (
                <div className="space-y-3">
                  {tutors.map((t) => (
                    <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:bg-white transition">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{t.user?.displayName}</p>
                        <p className="text-xs text-slate-500">{t.headline}</p>
                      </div>
                      <button
                        onClick={() => removeTutor(t.id)}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition"
                      >
                        Revoke Vetting
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 6: COURSE MANAGEMENT */}
          {active === "courses" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Course Catalog Oversight</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Review published curriculum and lesson modules.</p>
                </div>
                <Link
                  to="/course-studio"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New Course
                </Link>
              </div>
              {courses.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-10">No courses registered.</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:bg-white transition">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.category} · {c.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/courses/${c.slug}`} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white transition">
                          Preview
                        </Link>
                        <button
                          onClick={() => removeCourse(c.id)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 7: CERTIFICATE REGISTRY */}
          {active === "certificates" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Issued Certificates Registry</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Immutable credential ledger for verified graduates.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search cert ref code..."
                    value={certSearch}
                    onChange={(e) => setCertSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {filteredCerts.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-10">No certificates match your search query.</p>
              ) : (
                <div className="space-y-3">
                  {filteredCerts.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs hover:bg-white transition">
                      <div>
                        <p className="font-bold text-slate-900">{c.user?.displayName}</p>
                        <p className="text-slate-500">{c.course?.title}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 block">
                          {c.certRef}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(c.issuedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 8: ACCOUNT & PROFILE SETTINGS */}
          {active === "settings" && (
            <AccountSettingsView />
          )}

        </main>
      </div>
    </div>
  );
}

function StatTile({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{title}</span>
        <div className={`p-1.5 rounded-xl ${color}`}>{icon}</div>
      </div>
      <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}
