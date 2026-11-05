import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Search, Award, ArrowRight, Layers } from "lucide-react";
import api from "../utils/api";
import CyberSpinner from "../components/CyberSpinner";

const CATEGORIES = [
  "All Categories",
  "Fraud Awareness",
  "Account Security",
  "Privacy & Rights",
  "Cybersecurity",
  "Artificial Intelligence",
];

const EASE_OUT = [0.22, 1, 0.36, 1];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [ageBand, setAgeBand] = useState("");
  const [selectedCat, setSelectedCat] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (ageBand) params.ageBand = ageBand;
    if (selectedCat !== "All Categories") params.category = selectedCat;

    api
      .get("/courses", { params })
      .then((res) => setCourses(res.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [ageBand, selectedCat]);

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="bg-[#001E3C] rounded-2xl p-7 sm:p-10 relative overflow-hidden text-white border border-slate-800 shadow-lg min-h-[176px] flex items-center"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 scale-105"
            style={{ backgroundImage: "url('/hero-courses.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/50" />

          <div className="relative z-10 max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Learn to Protect Yourself &amp; Your Accounts
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed font-normal">
              Practical, self-paced lessons built for everyday internet safety in Ghana. Complete modules and assessments to earn verifiable certificates.
            </p>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0056D2] shadow-2xs"
              />
            </div>

            <div className="flex items-center bg-white p-1 rounded-xl gap-1 border border-slate-200 overflow-x-auto scrollbar-none w-full sm:w-auto">
              {[
                { label: "All Ages", value: "" },
                { label: "Ages 12–18", value: "JUNIOR" },
                { label: "Ages 19–23", value: "YOUNG_ADULT" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAgeBand(opt.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap flex-1 sm:flex-none text-center transition cursor-pointer ${ageBand === opt.value
                      ? "bg-[#0056D2] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg whitespace-nowrap transition border shrink-0 cursor-pointer ${selectedCat === cat
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <CyberSpinner label="Loading courses..." />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl p-12 text-center border border-slate-200 bg-white space-y-2">
            <BookOpen className="w-9 h-9 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No courses match your filter</h3>
            <p className="text-xs text-slate-500">
              Try clearing your search query or choosing another category.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c, idx) => {
              const moduleCount = c._count?.modules ?? 0;
              const enrollmentCount = c._count?.enrollments ?? 0;

              return (
                <motion.div
                  key={c.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.36,
                    delay: Math.min(idx * 0.04, 0.24),
                    ease: EASE_OUT,
                  }}
                  whileHover={prefersReducedMotion ? undefined : { y: -3, transition: { duration: 0.18 } }}
                  className="h-full"
                >
                  <Link
                    to={`/courses/${c.slug}`}
                    className="h-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:border-[#0056D2] hover:shadow-md transition-colors duration-200 group flex flex-col"
                  >
                    <div className="h-44 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                      {c.coverImageUrl ? (
                        <img
                          src={c.coverImageUrl}
                          alt={c.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#0056D2] bg-blue-50/50">
                          <BookOpen className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 border border-slate-200/80 shadow-2xs">
                        {c.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-[#0056D2]">
                          {c.category}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0056D2] transition leading-snug">
                          {c.title}
                        </h3>

                        <p className="text-xs text-slate-600 font-normal line-clamp-3 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {moduleCount > 0 ? `${moduleCount} ${moduleCount === 1 ? "module" : "modules"}` : "Self-paced"}
                            {enrollmentCount > 0 ? ` · ${enrollmentCount} enrolled` : " · Free"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          <Award className="w-3 h-3 text-emerald-600" /> Certificate
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom Mentor Banner */}
        <div className="pt-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="relative rounded-2xl overflow-hidden bg-[#001E3C] border border-blue-900/50 shadow-lg p-7 sm:p-10 text-white"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
              style={{ backgroundImage: "url('/hero-courses.png?v=1038')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/50" />

            <div className="relative z-10 max-w-2xl space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Want 1-on-1 Guidance From a Mentor?
              </h2>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
                Book a live consultation with a vetted Ghanaian cybersecurity practitioner for coursework help, career advice, or personal account security.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <Link
                  to="/tutors"
                  className="inline-flex items-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition hover:-translate-y-0.5 text-xs"
                >
                  Browse Vetted Mentors <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
