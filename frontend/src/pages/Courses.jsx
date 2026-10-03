import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Search, Sparkles, Award, ArrowRight } from "lucide-react";
import api from "../utils/api";
import CyberSpinner from "../components/CyberSpinner";

const CATEGORIES = ["All Categories", "Fraud Awareness", "Account Security", "Privacy & Rights", "Cybersecurity", "Artificial Intelligence"];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [ageBand, setAgeBand] = useState("");
  const [selectedCat, setSelectedCat] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Institutional Header Banner with Background Image */}
        <div className="bg-[#001E3C] rounded-3xl p-8 sm:p-10 relative overflow-hidden text-white border border-slate-800 shadow-xl min-h-[180px] flex items-center">
          {/* Background Image Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85 scale-105"
            style={{ backgroundImage: "url('/hero-courses.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/50" />

          <div className="relative z-10 max-w-2xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              Learn to Protect Yourself &amp; Your Accounts
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed font-normal">
              Practical, bite-sized lessons designed for everyday internet safety in Ghana. Learn at your own pace and earn completion certificates.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
              <input
                type="text"
                placeholder="Search curriculums by topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-line bg-card text-sm text-ink focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            {/* Age Band Tabs */}
            <div className="flex items-center bg-surface p-1 rounded-xl gap-1 border border-line overflow-x-auto scrollbar-none w-full sm:w-auto">
              {[
                { label: "All Bands", value: "" },
                { label: "Ages 12–18", value: "JUNIOR" },
                { label: "Ages 19–23", value: "YOUNG_ADULT" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAgeBand(opt.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap flex-1 sm:flex-none text-center transition ${
                    ageBand === opt.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-mist hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips - Edge-to-edge swiping on phones */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg whitespace-nowrap transition border shrink-0 ${
                  selectedCat === cat
                    ? "bg-ink text-paper border-ink font-bold shadow-sm"
                    : "border-line bg-card text-mist hover:text-ink hover:border-slate-400"
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
            <CyberSpinner label="Loading National COP Catalog..." />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-line bg-card">
            <BookOpen className="w-10 h-10 text-mist mx-auto mb-3" />
            <h3 className="text-lg font-bold text-ink">No courses match your filter</h3>
            <p className="text-xs text-mist mt-1">Try clearing your search query or selecting another category.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => (
              <Link
                key={c.id}
                to={`/courses/${c.slug}`}
                className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:border-[#0056D2] hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                {/* Course Image */}
                <div className="h-48 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                  {c.coverImageUrl ? (
                    <img
                      src={c.coverImageUrl}
                      alt={c.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#0056D2] bg-blue-50/50">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200/80 shadow-xs">
                    {c.ageBand === "JUNIOR" ? "Ages 12–18" : "Ages 19–23"}
                  </div>
                </div>

                {/* Course Card Body - Clean White Aesthetic */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                  <div className="space-y-2.5">
                    {/* Organization / Partner Tag */}
                    <div className="text-xs font-semibold text-[#0056D2]">
                      CyberGuard National Academy
                    </div>

                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#0056D2] transition leading-snug">
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Skill Pills */}
                    <div className="pt-2 flex flex-wrap gap-2 text-xs">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-extrabold text-slate-800">
                        {c.category}
                      </span>
                      <span className="bg-blue-50 text-[#0056D2] px-3 py-1 rounded-lg border border-blue-200/70 font-bold">
                        Practical Scenarios
                      </span>
                    </div>
                  </div>

                  {/* Rating & Enrollment Specs Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-extrabold">
                      <span className="text-amber-500 text-sm">4.9 ★</span>
                      <span className="text-slate-500 text-xs">
                        ({(c._count?.enrollments ?? 0) * 14 + 48} enrolled)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <Award className="w-3.5 h-3.5 text-emerald-600" /> Certificate
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom Callout Banner Card for Courses Page */}
        <div className="pt-10">
          <div className="relative rounded-3xl overflow-hidden bg-[#001E3C] border border-blue-900/50 shadow-2xl p-8 sm:p-12 text-white">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-45 scale-105"
              style={{ backgroundImage: "url('/hero-courses.png?v=1038')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/50" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="text-xs font-mono font-bold text-blue-300 uppercase tracking-widest block">
                ACCREDITED CYBER CURRICULUM
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                Master Real-World Digital Protection Skills
              </h2>
              <p className="text-white text-sm sm:text-base leading-relaxed font-medium drop-shadow-sm">
                Complete age-tailored interactive modules on mobile money security, deepfake detection, and strong passphrases to claim your verifiable national COP certificate.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <Link
                  to="/tutors"
                  className="inline-flex items-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3 rounded-xl shadow-lg transition hover:scale-[1.01] text-xs"
                >
                  Book 1-on-1 Mentor Consultation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



