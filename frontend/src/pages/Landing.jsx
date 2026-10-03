import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  ShieldAlert,
  Award,
  ChevronDown,
  Search,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
  Lock
} from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "anon-report",
    category: "Reporting & Privacy",
    question: "Is an incident report completely anonymous, and can it be traced to my phone or school?",
    answer:
      "Yes. When you submit a report on CyberGuard, all image metadata (such as EXIF GPS coordinates, camera model, and device timestamps) is scrubbed client-side directly in your browser before upload. Your report is assigned a private cryptographic tracking token (for example, CG-94B2-7K). Unless you choose to provide a phone number for direct officer communication, no personal identifiers, IP addresses, or device fingerprints are logged or stored."
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
      "Do not send money, and do not delete your chat records. Extortionists consistently demand more money after any payment. Take screenshots showing the user's handle, phone number, and any payment accounts they provide. Submit a confidential report under the Sextortion category on this platform. CSA officers collaborate with international platforms to issue emergency takedown notices and coordinate legal protections under Ghana's Cybersecurity Act 2020 (Act 1038)."
  },
  {
    id: "hacked-account",
    category: "Emergency Advice",
    question: "What should I do if my Instagram, TikTok, or WhatsApp account gets hacked?",
    answer:
      "For WhatsApp, re-verify your phone number by requesting a new 6-digit SMS code and enter it to automatically log out the intruder. For Instagram or TikTok, use the 'Need more help?' or account recovery flow using your registered email or phone, and immediately enable Two-Factor Authentication (2FA) using an authenticator app once regained."
  },
  {
    id: "cert-recognition",
    category: "Courses & Certificates",
    question: "Are course completion certificates officially verifiable by employers and universities?",
    answer:
      "Yes. Each certificate issued upon completing a curriculum and passing its assessment contains a unique cryptographic reference hash. Employers, teachers, and admissions officers can verify the authenticity of any certificate at any time using our public verification portal at /verify-certificate."
  },
  {
    id: "mentor-sessions",
    category: "Mentors & Schools",
    question: "Who are the mentors and how do private consultations work?",
    answer:
      "CyberGuard mentors are verified Ghanaian security practitioners, university instructors, and industry analysts whose credentials are confirmed through our onboarding process. Students can schedule one-on-one sessions for academic guidance, career advice, or personalized safety consultations conducted over encrypted channels."
  },
  {
    id: "school-integration",
    category: "Mentors & Schools",
    question: "Can junior and senior high schools integrate CyberGuard into their ICT curriculum?",
    answer:
      "Yes. Junior high and senior high schools can adopt CyberGuard course modules for digital citizenship, ICT laboratory periods, and national cyber safety campaigns. Teachers can also apply for instructor credentials through our Tutor Onboarding portal to author specialized exercises and monitor student progress."
  },
  {
    id: "csa-police-relationship",
    category: "Reporting & Privacy",
    question: "How does CyberGuard coordinate with the Cyber Security Authority (CSA) and the Police?",
    answer:
      "CyberGuard operates in alignment with the Cyber Security Authority under the Cybersecurity Act 2020 (Act 1038) and the National Child Online Protection (COP) framework. Serious incidents involving financial syndicates, sextortion, or organized threats are triaged and routed directly to authorized CSA investigation officers and the Ghana Police Service Cybercrime Unit."
  },
  {
    id: "service-costs",
    category: "Courses & Certificates",
    question: "Is there any cost for reporting an incident or completing the core courses?",
    answer:
      "No. All core learning curriculums, assessment quizzes, certificate generation, and incident reporting tools are completely free to Ghanaian youth and educators as part of national digital defense infrastructure."
  }
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState("anon-report");
  const [faqCategory, setFaqCategory] = useState("All");
  const [faqSearch, setFaqSearch] = useState("");

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

  return (
    <div className="space-y-16 pb-16 bg-paper">
      {/* Executive Hero with High-Visibility Background Image */}
      <section className="bg-slate-950 text-white relative overflow-hidden py-14 sm:py-28 lg:py-32 px-4 sm:px-6 min-h-[500px] sm:min-h-[600px] flex items-center border-b border-slate-800">
        {/* Background Image Layer - High Visibility */}
        <div
          className="absolute inset-0 bg-cover bg-center lg:bg-right scale-100 opacity-75 sm:opacity-85"
          style={{ backgroundImage: "url('/hero-students.png?v=1038')" }}
        />
        {/* Directional Gradients: Left backdrop for text contrast, open on right for clear photo visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 via-45% to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Hero Content Block */}
          <div className="max-w-2xl space-y-5 text-white">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white drop-shadow-xl">
              Ghana's National Youth Cyber Safety Platform.
            </h1>

            <p className="text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed font-medium drop-shadow-md">
              Equipping Ghanaian youth (ages 12–23) with accredited cybersecurity curriculums, verified 1-on-1 mentorship, and confidential zero-knowledge incident reporting.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition hover:scale-[1.01] text-sm sm:text-base w-full sm:w-auto text-center"
              >
                Access Course Catalog
              </Link>
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 border border-red-500/50 bg-red-950/70 hover:bg-red-900/90 text-red-200 font-bold px-6 py-3.5 rounded-xl backdrop-blur-md transition shadow-md text-sm sm:text-base w-full sm:w-auto text-center"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" /> Confidential Report
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section - Institutional Digital Protection Framework */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Four Pillars of Digital Protection</h2>
          <p className="text-sm text-slate-600 font-normal">
            Standardized cybersecurity frameworks designed for Ghanaian schools, students, and institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <PillarCard
            icon={<GraduationCap className="w-6 h-6 text-[#0056D2]" />}
            title="Accredited LMS"
            desc="Structured Coursera-style learning paths with standalone quiz assessments and verified certificates."
            to="/courses"
            cta="Explore Curriculums"
          />
          <PillarCard
            icon={<Users className="w-6 h-6 text-emerald-600" />}
            title="Vetted Mentors"
            desc="Book 1-on-1 consultations with accredited cybersecurity professionals over encrypted video sessions."
            to="/tutors"
            cta="Schedule Mentor"
          />
          <PillarCard
            icon={<ShieldAlert className="w-6 h-6 text-red-600" />}
            title="Confidential Reporting"
            desc="Submit evidence for sextortion, fraud, or harassment with zero metadata recorded — reviewed by CSA officers."
            to="/report"
            cta="Submit Incident"
            accent
          />
          <PillarCard
            icon={<Award className="w-6 h-6 text-amber-600" />}
            title="Tutor Accreditation"
            desc="Apply for official mentor credentials, author courses in our studio, and guide Ghanaian learners."
            to="/tutor-onboarding"
            cta="Apply as Tutor"
          />
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section id="faq" className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-24">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0056D2]">
            <HelpCircle className="w-4 h-4" />
            <span>Answers and guidance</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
            Essential information regarding anonymous reporting, emergency MoMo and sextortion defenses, verifiable certificates, and school onboarding in Ghana.
          </p>
        </div>

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
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg whitespace-nowrap transition border ${
                  faqCategory === cat
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
                  className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-all duration-200 hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {faq.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#0056D2]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100 bg-slate-50/40">
                      <p>{faq.answer}</p>
                    </div>
                  )}
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
                className="text-xs text-[#0056D2] font-bold hover:underline"
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
              Need immediate emergency help?
            </h4>
            <p className="text-xs text-slate-600 font-normal">
              Call the National Cyber Threat Hotline at toll-free <strong className="text-slate-900">292</strong> or report anonymously with zero metadata retention.
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

      {/* Bottom Callout Banner Card with Topic Background Image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#001E3C] border border-blue-900/50 shadow-xl p-6 sm:p-12 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45 scale-105"
            style={{ backgroundImage: "url('/hero-students.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/50" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Ready to Begin Your Cyber Defense Journey?
            </h2>
            <p className="text-white text-xs sm:text-base leading-relaxed font-medium drop-shadow-sm">
              Join thousands of students across Ghana earning accredited certificates, defending against scams, and building a secure digital future.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition hover:scale-[1.01] text-sm w-full sm:w-auto text-center"
              >
                Create Your Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PillarCard({ icon, title, desc, to, cta, accent }) {
  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs hover:border-[#0056D2] hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
      <div className="space-y-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0056D2] transition tracking-tight">{title}</h3>
        <p className="text-slate-600 font-normal text-xs leading-relaxed">{desc}</p>
      </div>

      <Link
        to={to}
        className={`mt-6 inline-block text-xs font-bold relative z-10 transition ${
          accent ? "text-red-600 hover:text-red-700 hover:underline" : "text-[#0056D2] hover:text-[#00419E] hover:underline"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
