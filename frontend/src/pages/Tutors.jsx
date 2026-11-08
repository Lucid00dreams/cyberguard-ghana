import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Video, Users, AlertCircle, MessageSquare, Search } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "../components/CyberSpinner";
import UserAvatar from "../components/UserAvatar";

const EASE_OUT = [0.16, 1, 0.3, 1];

export default function Tutors() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [tutors, setTutors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [booked, setBooked] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/tutors")
      .then((res) => setTutors(res.data || []))
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
  }, []);

  async function bookSlot(slotId) {
    setBookingError("");
    try {
      const { data } = await api.post(`/tutors/availability/${slotId}/book`);
      setBooked(data);
    } catch (err) {
      setBookingError(
        err.response?.data?.error || "Could not book that slot. It may no longer be available."
      );
    }
  }

  const filteredTutors = tutors.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const nameMatch = (t.user?.displayName || "").toLowerCase().includes(q);
    const headlineMatch = (t.headline || "").toLowerCase().includes(q);
    const bioMatch = (t.bio || "").toLowerCase().includes(q);
    const specMatch = (t.specialties || []).some((s) => s.toLowerCase().includes(q));
    return nameMatch || headlineMatch || bioMatch || specMatch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-14 sm:pb-16">
      {/* Full-Bleed Quarter-Page Hero */}
      <section className="bg-slate-950 text-white relative overflow-hidden py-12 sm:py-16 px-4 sm:px-6 min-h-[26vh] sm:min-h-[28vh] flex items-center border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-[center_35%] opacity-85"
          style={{ backgroundImage: "url('/hero-mentors.png?v=1038')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 via-45% to-slate-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/35" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="max-w-2xl space-y-2.5"
          >
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Cybersecurity Mentors &amp; Tutors
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
              Book private 1-on-1 guidance sessions with vetted practitioners for career questions, study help, or scam recovery advice.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 space-y-6">
        {/* Search & Count Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search mentors by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0056D2] shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#0056D2]" />
              <span>
                {filteredTutors.length} {filteredTutors.length === 1 ? "Mentor" : "Mentors"} Available
              </span>
            </span>
          </div>
        </div>

        {bookingError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{bookingError}</span>
          </div>
        )}

        {booked && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-950">Session booked</p>
              <p className="mt-0.5 text-emerald-700">
                Your meeting link has also been saved under the Mentorship tab in your dashboard.
              </p>
            </div>
            <a
              href={booked.jitsiUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Open Video Room</span>
            </a>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <CyberSpinner size="lg" label="Loading mentors..." />
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-1" />
            <p className="font-bold text-sm text-slate-800">
              {searchTerm ? "No mentors match your search" : "No mentors listed yet"}
            </p>
            <p className="text-xs text-slate-500">
              {searchTerm
                ? "Try clearing your search filter to see all available cybersecurity mentors."
                : "Check back soon or apply to become a verified tutor if you teach cybersecurity in Ghana."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0 w-full">
            {filteredTutors.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={t.user}
                        name={t.user?.displayName}
                        size="lg"
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-slate-900 leading-tight truncate">
                          {t.user?.displayName}
                        </h3>
                        <p className="text-xs text-[#0056D2] font-semibold mt-0.5 truncate">
                          {t.headline}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0 self-start">
                      GH₵ {Number(t.hourlyRateGHS).toFixed(2)}/hr
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {t.bio || t.headline}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(t.specialties || []).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Available slots</span>
                    {user && t.user?.id && t.user.id !== user.id ? (
                      <Link
                        to={`/cyberchat?mentor=${encodeURIComponent(t.user.id)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>Message mentor</span>
                      </Link>
                    ) : !user ? (
                      <Link
                        to="/login"
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                      >
                        Sign in to book or message
                      </Link>
                    ) : null}
                  </div>

                  {!t.availability || t.availability.length === 0 ? (
                    <p className="text-xs text-slate-400">No open slots this week.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {t.availability.slice(0, 3).map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!user}
                          onClick={() => bookSlot(slot.id)}
                          className="text-xs font-semibold flex items-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-[#0056D2] hover:text-white hover:border-[#0056D2] text-slate-700 rounded-xl px-3 py-1.5 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>
                            {new Date(slot.startsAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
