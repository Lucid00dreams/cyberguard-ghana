import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Video, Star, ArrowRight } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberSpinner from "../components/CyberSpinner";
import UserAvatar from "../components/UserAvatar";

export default function Tutors() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [booked, setBooked] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/tutors")
      .then((res) => setTutors(res.data))
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
  }, []);

  async function bookSlot(slotId) {
    const { data } = await api.post(`/tutors/availability/${slotId}/book`);
    setBooked(data);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-paper">
        <CyberSpinner size="lg" label="Loading Accredited Mentors..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Clean Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1.5 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Accredited Mentors</span>
              <span className="text-emerald-300">/</span>
              <span>1-on-1 Consultations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cyber Mentors & Tutors
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Connect with verified Ghanaian specialists for career advice, technical guidance, and defense mentorship.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {tutors.length} Mentors Available
            </span>
          </div>
        </div>

        {booked && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-medium flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-950">Session confirmed successfully!</p>
              <p className="mt-0.5 text-emerald-700">Join your encrypted meeting at the scheduled time.</p>
            </div>
            <a
              href={booked.jitsiUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0"
            >
              <Video className="w-3.5 h-3.5" /> Join Room
            </a>
          </div>
        )}

        {tutors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-2">
            <p className="font-bold text-sm text-slate-800">No mentors available at the moment</p>
            <p className="text-xs text-slate-500">Check back soon or apply to become a mentor from your dashboard.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {tutors.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={t.user}
                        name={t.user?.displayName}
                        size="lg"
                        rounded="rounded-xl"
                      />
                      <div>
                        <h3 className="font-black text-base text-slate-900 leading-tight">{t.user?.displayName}</h3>
                        <p className="text-xs text-blue-700 font-bold mt-0.5">{t.headline}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                      GH₵ {Number(t.hourlyRateGHS).toFixed(2)}/hr
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{t.bio || t.headline}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Available Slots</span>
                    {!user && <span className="text-[10px] text-amber-700 font-medium">Log in to book</span>}
                  </div>

                  {t.availability.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No open slots this week.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {t.availability.slice(0, 3).map((slot) => (
                        <button
                          key={slot.id}
                          disabled={!user}
                          onClick={() => bookSlot(slot.id)}
                          className="text-xs font-bold flex items-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-700 rounded-xl px-3 py-1.5 transition disabled:opacity-50"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

