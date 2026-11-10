import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  GraduationCap,
  Users,
  ShieldAlert,
  Award,
  ChevronDown,
  Search,
  HelpCircle,
  PhoneCall,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "anon-report",
    category: "Reporting & Privacy",
    question: "Is an incident report completely anonymous, and can it be traced to my phone or school?",
    answer:
      "Yes. When you submit a report on CyberGuard, image metadata (such as EXIF GPS coordinates, camera model, and device timestamps) is scrubbed directly in your browser before upload. Your report receives a private tracking token (for example, CG-94B2-7K). Unless you choose to share a phone number for officer follow-up, no personal identifiers are stored."
  },
  {
    id: "momo-fraud-action",
    category: "Emergency Advice",
    question: "What should I do immediately if I accidentally sent money to a fraudster or shared my MoMo PIN?",
    answer:
      "Act immediately in three steps: First, change your Mobile Money PIN through your official telecom menu (*170# for MTN, *110# for Telecel, *110# for AT). Second, call telecom customer service on 100 or visit the nearest service center with your Ghana Card to request an urgent transaction freeze. Third, submit a report here or call the toll-free 292 helpline so the recipient wallet can be flagged to the Cyber Security Authority."
  },
  {
    id: "blackmail-sextortion",
    category: "Emergency Advice",
    question: "Someone is threatening to share private photos of me unless I pay them. How can CyberGuard help?",
    answer:
      "Do not send money, and do not delete your chat records. Extortionists consistently demand more money after any payment. Take screenshots showing the user's handle, phone number, and any payment accounts they provide. Submit a confidential report under the Sextortion category on this platform. CSA officers work with platforms to issue emergency takedown notices and coordinate protections under Ghana's Cybersecurity Act 2020 (Act 1038)."
  },
  {
    id: "hacked-account",
    category: "Emergency Advice",
    question: "What should I do if my Instagram, TikTok, or WhatsApp account gets hacked?",
    answer:
      "For WhatsApp, re-verify your phone number by requesting a new 6-digit SMS code and enter it to automatically log out the intruder. For Instagram or TikTok, use the official account recovery flow with your registered email or phone, and immediately enable Two-Factor Authentication (2FA) using an authenticator app once recovered."
  },
  {
    id: "cert-recognition",
    category: "Courses & Certificates",
    question: "Are course completion certificates verifiable by employers and schools?",
    answer:
      "Yes. Each certificate issued upon completing a course and passing its assessment includes a unique verification code. Teachers, employers, and admissions teams can check any certificate anytime at /verify-certificate."
  },
  {
    id: "mentor-sessions",
    category: "Mentors & Schools",
    question: "Who are the mentors and how do 1-on-1 consultations work?",
    answer:
      "CyberGuard mentors are vetted Ghanaian security practitioners, university instructors, and analysts whose credentials are reviewed during onboarding. Students can book 1-on-1 video sessions for study help, career advice, or practical digital safety guidance."
  },
  {
    id: "school-integration",
    category: "Mentors & Schools",
    question: "Can junior and senior high schools use CyberGuard in ICT classes?",
    answer:
      "Yes. Junior and senior high schools can use CyberGuard modules during ICT lab periods, digital citizenship lessons, and school safety clubs. Teachers can also apply through Tutor Onboarding to create lessons and guide students."
  },
  {
    id: "csa-police-relationship",
    category: "Reporting & Privacy",
    question: "How does CyberGuard coordinate with the Cyber Security Authority (CSA) and the Police?",
    answer:
      "CyberGuard aligns with Ghana's Cybersecurity Act 2020 (Act 1038) and the National Child Online Protection (COP) framework. Serious incidents involving fraud rings, sextortion, or direct threats are triaged by authorized CSA officers and escalated where required."
  },
  {
    id: "service-costs",
    category: "Courses & Certificates",
    question: "Is there any cost for reporting an incident or taking the courses?",
    answer:
      "No. All core courses, quizzes, completion certificates, and confidential incident reporting tools are free for students, parents, and educators across Ghana."
  }
];

const EASE_OUT = [0.22, 1, 0.36, 1];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState("anon-report");
  const [faqCategory, setFaqCategory] = useState("All");
  const [faqSearch, setFaqSearch] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const categories = ["All", "Reporting & Privacy", "Emergency Advice", "Courses & Certificates", "Mentors & Schools"];

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = faqCategory === "All" || item.category === faqCategory;
    const matchesSearch =
      faqSearch.trim() === "" ||
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay, ease: EASE_OUT },
      };

  return (
    <div className="space-y-16 pb-16 bg-[#F8FAFC]">
      {/* Hero with Background Image */}
      <section className="bg-slate-950 text-white relative overflow-hidden py-14 sm:py-28 lg:py-32 px-4 sm:px-6 min-h-[500px] sm:min-h-[600px] flex items-center border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center lg:bg-right scale-100 opacity-75 sm:opacity-85"
          style={{ backgroundImage: "url('/hero-students.png?v=1038')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 via-45% to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-2xl space-y-5 text-white">
            <motion.h1
              {...fadeUp(0)}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white drop-shadow-xl"
            >
              Ghana's National Youth Cyber Safety Platform.
            </motion.h1>

            <motion.p
              {...fadeUp(0.08)}
              className="text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed font-medium drop-shadow-md"
            >
              Equipping Ghanaian youth (ages 12–23) with practical cyber safety courses, vetted 1-on-1 mentors, and confidential incident reporting.
            </motion.p>

            <motion.div
              {...fadeUp(0.16)}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 w-full sm:w-auto"
            >
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto text-center"
              >
                Explore Courses
              </Link>
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 border border-red-500/50 bg-red-950/70 hover:bg-red-900/90 text-red-200 font-bold px-6 py-3.5 rounded-xl backdrop-blur-md transition hover:-translate-y-0.5 shadow-md text-sm sm:text-base w-full sm:w-auto text-center"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" /> Confidential Report
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="text-center max-w-2xl mx-auto space-y-2"
        >
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">How CyberGuard Protects You</h2>
          <p className="text-sm text-slate-600 font-normal">
            Practical training, mentorship, and direct incident support built for Ghanaian students, parents, and schools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <PillarCard
            index={0}
            reducedMotion={prefersReducedMotion}
            icon={<GraduationCap className="w-6 h-6 text-[#0056D2]" />}
            title="Safety Courses"
            desc="Step-by-step lessons on Mobile Money fraud, phishing links, and account security with verifiable certificates."
            to="/courses"
            cta="Browse Courses"
          />
          <PillarCard
            index={1}
            reducedMotion={prefersReducedMotion}
            icon={<Users className="w-6 h-6 text-emerald-600" />}
            title="Vetted Mentors"
            desc="Book 1-on-1 consultations with verified Ghanaian cybersecurity practitioners over private video sessions."
            to="/tutors"
            cta="Find a Mentor"
          />
          <PillarCard
            index={2}
            reducedMotion={prefersReducedMotion}
            icon={<ShieldAlert className="w-6 h-6 text-red-600" />}
            title="Confidential Reporting"
            desc="Report sextortion, MoMo scams, or online harassment safely with automatic photo metadata scrubbing."
            to="/report"
            cta="Report an Incident"
            accent
          />
          <PillarCard
            index={3}
            reducedMotion={prefersReducedMotion}
            icon={<Award className="w-6 h-6 text-amber-600" />}
            title="Become a Mentor"
            desc="Apply for instructor credentials, publish lessons in Course Studio, and guide students across Ghana."
            to="/tutor-onboarding"
            cta="Apply as Mentor"
          />
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section id="faq" className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-24">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0056D2]">
            <HelpCircle className="w-4 h-4" />
            <span>Answers and guidance</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
            Clear answers on anonymous reporting, emergency Mobile Money and sextortion steps, verifiable certificates, and school use in Ghana.
          </p>
        </motion.div>

        {/* Search and Category Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search questions (e.g. MoMo, anonymous, sextortion, certificate, school)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0056D2] shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFaqCategory(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg whitespace-nowrap transition border cursor-pointer ${faqCategory === cat
                    ? "bg-[#0056D2] text-white border-[#0056D2] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Items */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-colors duration-150 hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/60 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {faq.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0056D2]" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100 bg-slate-50/40">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center border border-slate-200 rounded-xl bg-white space-y-2">
              <p className="text-sm font-semibold text-slate-700">No questions matched your search.</p>
              <button
                type="button"
                onClick={() => {
                  setFaqSearch("");
                  setFaqCategory("All");
                }}
                className="text-xs text-[#0056D2] font-bold hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Contact Helpline Callout Card */}
        <div className="border border-blue-100 rounded-2xl p-5 sm:p-6 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#0056D2]" />
              Need urgent help right now?
            </h4>
            <p className="text-xs text-slate-600 font-normal">
              Call the National Cyber Threat Helpline toll-free on <strong className="text-slate-900">292</strong> or submit a confidential report online.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Link
              to="/tutors"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 rounded-xl hover:bg-white transition bg-white text-center"
            >
              Ask a Mentor
            </Link>
            <Link
              to="/report"
              className="text-xs font-bold bg-[#0056D2] hover:bg-[#00419E] text-white px-4 py-2.5 rounded-xl transition shadow-xs text-center"
            >
              Report Incident
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Callout Banner Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#001E3C] border border-blue-900/50 shadow-xl p-6 sm:p-12 text-white"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45 scale-105"
            style={{ backgroundImage: "url('/hero-students.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/50" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Start Learning Digital Safety Today
            </h2>
            <p className="text-slate-100 text-xs sm:text-base leading-relaxed font-medium drop-shadow-sm">
              Create a free account to track your lessons, earn verifiable certificates, and receive daily cyber safety tips.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition hover:-translate-y-0.5 text-sm w-full sm:w-auto text-center"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function PillarCard({ icon, title, desc, to, cta, accent = false, index = 0, reducedMotion = false }) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: EASE_OUT }}
      whileHover={reducedMotion ? undefined : { y: -3, transition: { duration: 0.18 } }}
      className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs hover:border-[#0056D2] hover:shadow-md transition-colors duration-200 flex flex-col justify-between group relative overflow-hidden"
    >
      <div className="space-y-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0056D2] transition tracking-tight">{title}</h3>
        <p className="text-slate-600 font-normal text-xs leading-relaxed">{desc}</p>
      </div>

      <Link
        to={to}
        className={`mt-6 inline-block text-xs font-bold relative z-10 transition ${accent ? "text-red-600 hover:text-red-700 hover:underline" : "text-[#0056D2] hover:text-[#00419E] hover:underline"
          }`}
      >
        {cta} &rarr;
      </Link>
    </motion.div>
  );
}
