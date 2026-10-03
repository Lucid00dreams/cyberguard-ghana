import { useEffect, useState, useRef } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  ShieldAlert,
  Sun,
  Moon,
  BookOpen,
  Users,
  LayoutDashboard,
  Compass,
  Menu,
  X,
  Sparkles,
  PhoneCall,
  Zap,
  Award,
  Search,
  SlidersHorizontal,
  Lock,
  Store,
  ChevronDown,
  LogOut,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import CyberSpinner from "../components/CyberSpinner";
import UserAvatar from "../components/UserAvatar";
import SessionTimeoutModal from "../components/SessionTimeoutModal";
import CyberGodChatbot from "../components/CyberGodChatbot";
import CyberGuardLogo from "../components/CyberGuardLogo";

const navLinkClass = ({ isActive }) =>
  `relative text-xs font-semibold whitespace-nowrap transition-colors px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${isActive
    ? "text-[#0056D2] bg-blue-50/90 font-bold"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
  }`;

export default function MainLayout() {
  const { user, logout, sessionTimedOut, dismissSessionTimeoutModal } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userDropdownRef = useRef(null);

  const handleLoginAgain = () => {
    dismissSessionTimeoutModal();
    navigate("/login", { state: { from: location, intercepted: true } });
  };

  useEffect(() => {
    // Show custom CyberSpinner loading screen on route changes
    setRouteLoading(true);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    const timer = setTimeout(() => {
      setRouteLoading(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isDashboardRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/dashboard");

  return (
    <div className={`min-h-screen flex flex-col w-full max-w-full overflow-x-hidden ${isAdminRoute ? "bg-[#062319]" : "bg-[#F8FAFC]"}`}>
      <SessionTimeoutModal
        isOpen={sessionTimedOut}
        onClose={dismissSessionTimeoutModal}
        onLogin={handleLoginAgain}
      />
      {routeLoading && (
        <CyberSpinner fullScreen label="Loading CyberGuard Ghana..." />
      )}
      {!isDashboardRoute && (
        <>
          {/* Top National Incident Helpline Notice Bar */}
          <div className="bg-[#0A1A33] text-slate-200 text-[10px] sm:text-[11px] py-1 px-3 sm:px-4 border-b border-slate-800 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-medium text-slate-300 truncate">
                  <span className="hidden sm:inline">National Cyber Threat </span>Helpline:
                </span>
                <span className="text-amber-400 font-bold whitespace-nowrap">Toll-Free 292</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
                <span>Child Online Protection</span>
                <Link to="/report" className="text-rose-400 hover:text-rose-300 font-medium transition">
                  Confidential Report
                </Link>
              </div>
            </div>
          </div>

          <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
              {/* Clean Single-Line Logo */}
              <Link to="/" className="flex items-center group shrink-0">
                <CyberGuardLogo variant="compact" size="sm" interactive />
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/courses" className={navLinkClass}>
                  <BookOpen className="w-3.5 h-3.5" /> Courses
                </NavLink>
                <NavLink to="/extensions" className={navLinkClass}>
                  <Store className="w-3.5 h-3.5 text-[#0056D2]" /> Extensions
                </NavLink>
                <NavLink to="/tutors" className={navLinkClass}>
                  <Users className="w-3.5 h-3.5" /> Mentors
                </NavLink>
                {user && (
                  <NavLink to="/cyberchat" className={navLinkClass}>
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">CyberChat</span>
                    {unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                    )}
                  </NavLink>
                )}
                {user && (user.role === "ADMIN" || user.role === "TUTOR") && (
                  <NavLink to="/course-studio" className={navLinkClass}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Studio
                  </NavLink>
                )}
                {user && (user.role === "ADMIN" || user.role === "CSA_OFFICER") && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <Compass className="w-3.5 h-3.5 text-indigo-600" /> Portal
                  </NavLink>
                )}
                <NavLink
                  to="/report"
                  className={({ isActive }) =>
                    `text-xs font-bold whitespace-nowrap px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${isActive
                      ? "bg-red-50 text-red-700 font-bold"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50/70"
                    }`
                  }
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Report
                </NavLink>
              </nav>

              {/* Right Side User Profile Area */}
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <UserAvatar user={user} size="sm" rounded="rounded-lg" />
                      <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[90px] truncate text-left">
                        {user.displayName}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {/* Clean User Dropdown Popover */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                          <UserAvatar user={user} size="md" rounded="rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email || user.phoneNumber}</p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-[#0056D2] border border-blue-200/60">
                              {user.role}
                            </span>
                          </div>
                        </div>

                        <div className="py-1">
                          <Link
                            to={user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "/admin" : "/dashboard"}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            <span>{user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "Command Center" : "Student Dashboard"}</span>
                          </Link>

                          <Link
                            to={user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "/admin?tab=settings" : "/dashboard?tab=settings"}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                            <span>Account Settings</span>
                          </Link>

                          {(user.role === "ADMIN" || user.role === "TUTOR") && (
                            <Link
                              to="/course-studio"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                            >
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>Course Studio</span>
                            </Link>
                          )}

                          {(user.role === "ADMIN" || user.role === "CSA_OFFICER") && (
                            <Link
                              to="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                            >
                              <Compass className="w-4 h-4 text-indigo-600" />
                              <span>CSA Portal</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Link
                      to="/login"
                      className="text-xs font-semibold text-slate-700 hover:text-[#0056D2] px-3 py-1.5 rounded-lg transition hover:bg-slate-100"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="text-xs font-bold bg-[#0056D2] hover:bg-[#00419E] text-white px-3.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      Join Free
                    </Link>
                  </div>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                  className="md:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
                </button>
              </div>
            </div>

            {/* Premium Touch-Optimized Mobile Navigation Drawer */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
                {/* Logged-out quick auth CTA bar on mobile */}
                {!user && (
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 px-3 rounded-xl bg-[#0056D2] text-xs font-bold text-white hover:bg-[#00419E] shadow-xs transition"
                    >
                      Join Free
                    </Link>
                  </div>
                )}

                {/* Logged in User Bar */}
                {user && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                    <UserAvatar user={user} size="md" rounded="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{user.role}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <NavLink
                    to="/courses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                  >
                    <BookOpen className="w-4 h-4 text-[#0056D2]" />
                    <span>Courses & Curriculums</span>
                  </NavLink>
                  <NavLink
                    to="/extensions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                  >
                    <Store className="w-4 h-4 text-[#0056D2]" />
                    <span>Extensions Store</span>
                  </NavLink>
                  <NavLink
                    to="/tutors"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Find a Mentor</span>
                  </NavLink>
                  {user && (
                    <NavLink
                      to="/cyberchat"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                    >
                      <span className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span>CyberChat (E2EE)</span>
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  )}
                  <NavLink
                    to="/report"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-100 transition"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Confidential Incident Report</span>
                  </NavLink>
                </div>

                {user && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <NavLink
                      to={user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "/admin" : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      <span>{user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "Command Center" : "Student Dashboard"}</span>
                    </NavLink>
                    <NavLink
                      to={user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "/admin?tab=settings" : "/dashboard?tab=settings"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                      <span>Account Settings</span>
                    </NavLink>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}

                {/* Emergency 292 Helpline Card inside Mobile Menu */}
                <div className="pt-2">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-900">Emergency Helpline</p>
                        <p className="text-[11px] text-amber-800">Toll-Free Dial 292</p>
                      </div>
                    </div>
                    <a
                      href="tel:292"
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition"
                    >
                      Call
                    </a>
                  </div>
                </div>
              </div>
            )}
          </header>
        </>
      )}

      <main className={`flex-1 relative z-10 ${!isDashboardRoute ? "pb-16 md:pb-0" : ""}`}>
        <Outlet />
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      {!isDashboardRoute && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-2 py-1 flex items-center justify-around h-14"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? "text-[#0056D2] font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/courses"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? "text-[#0056D2] font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">Courses</span>
          </NavLink>

          <NavLink
            to="/report"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? "text-rose-600 font-bold" : "text-rose-500 hover:text-rose-700"
              }`
            }
          >
            <div className="relative">
              <ShieldAlert className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
            </div>
            <span className="text-[10px] font-bold mt-0.5">Report</span>
          </NavLink>

          <NavLink
            to="/tutors"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? "text-[#0056D2] font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">Mentors</span>
          </NavLink>

          {user ? (
            <NavLink
              to={user.role === "ADMIN" || user.role === "CSA_OFFICER" ? "/admin" : "/dashboard"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                  isActive ? "text-[#0056D2] font-bold" : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">Portal</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                  isActive ? "text-[#0056D2] font-bold" : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">Sign In</span>
            </NavLink>
          )}
        </nav>
      )}

      {!isDashboardRoute && (
        <footer className="border-t-2 border-[#0056D2] bg-[#0B1528] text-slate-200 shadow-2xl relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Link to="/" className="inline-block group">
                <CyberGuardLogo variant="full" size="md" theme="dark" interactive />
              </Link>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm font-normal">
                A national cyber safety platform providing practical digital defense courses, verified mentor guidance, and confidential incident reporting for Ghanaian students, parents, and schools.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Cyber Security Authority (CSA) Framework · Ghana</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Quick Navigation
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/courses" className="text-slate-300 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5">
                    <span className="text-[#38BDF8]">›</span> Courses & Safety Modules
                  </Link>
                </li>
                <li>
                  <Link to="/extensions" className="text-slate-300 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5">
                    <span className="text-[#38BDF8]">›</span> Browser Extension Store
                  </Link>
                </li>
                <li>
                  <Link to="/tutors" className="text-slate-300 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5">
                    <span className="text-[#38BDF8]">›</span> Find an Accredited Mentor
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="text-slate-300 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5 text-rose-300 hover:text-rose-200 font-semibold">
                    <span className="text-rose-400">›</span> Anonymous Incident Reporting
                  </Link>
                </li>
                <li>
                  <Link to="/tutor-onboarding" className="text-slate-300 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5">
                    <span className="text-[#38BDF8]">›</span> Become a Cybersecurity Tutor
                  </Link>
                </li>
                <li>
                  <a href="/#faq" className="text-slate-300 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5">
                    <span className="text-[#38BDF8]">›</span> Frequently Asked Questions (FAQ)
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Emergency Hotline & Support
              </h4>
              <div className="text-amber-200 font-bold bg-amber-400/10 p-3.5 rounded-xl border border-amber-400/30 flex items-start gap-2.5 shadow-xs">
                <PhoneCall className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-300 font-black tracking-wide">
                    Toll-Free Emergency: Dial 292
                  </p>
                  <p className="text-[11px] text-amber-200/80 font-normal mt-0.5 leading-snug">
                    Ghana National Cyber Threat Hotline for immediate assistance with harassment or cyber fraud.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Incident reports submitted on this portal are processed confidentially by authorized Cyber Security Authority (CSA) officers.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-400 font-mono">
            © {new Date().getFullYear()} CyberGuard Ghana. Built for National Child Online Protection (COP). All rights reserved.
          </div>
        </footer>
      )}

      {/* CyberGod AI Floating Chatbot */}
      <CyberGodChatbot />
    </div>
  );
}

