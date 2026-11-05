import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Lock,
  Scale,
  FileText,
  HeartHandshake,
  AlertTriangle,
  PhoneCall,
  Search,
  Printer,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Users,
  Eye,
  Trash2,
  FileCheck,
} from "lucide-react";

export default function LegalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Determine active document from URL pathname
  const initialDoc = useMemo(() => {
    if (location.pathname.includes("/terms")) return "terms";
    if (location.pathname.includes("/cop-policy")) return "cop";
    return "privacy"; // default /privacy
  }, [location.pathname]);

  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("");

  useEffect(() => {
    if (location.pathname.includes("/terms")) setActiveDoc("terms");
    else if (location.pathname.includes("/cop-policy")) setActiveDoc("cop");
    else if (location.pathname.includes("/privacy")) setActiveDoc("privacy");
  }, [location.pathname]);

  function handleSwitchDoc(docKey) {
    setActiveDoc(docKey);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (docKey === "privacy") navigate("/privacy", { replace: true });
    else if (docKey === "terms") navigate("/terms", { replace: true });
    else if (docKey === "cop") navigate("/cop-policy", { replace: true });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Top Banner Header */}
      <section className="bg-[#001E3C] text-white py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden border-b border-slate-800 print:bg-white print:text-slate-900 print:py-4 print:border-none">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-[#001E3C]/95 to-[#002B54]/80 print:hidden" />
        <div className="max-w-5xl mx-auto relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-300 print:hidden">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Legal, Privacy &amp; Governance</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold print:border-slate-300 print:text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 print:text-slate-700" />
                <span>Statutory Compliance · Republic of Ghana</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight print:text-slate-900">
                Legal &amp; Child Safety Charter
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed print:text-slate-600">
                Enforced in accordance with Ghana&apos;s <strong>Data Protection Act, 2012 (Act 843)</strong>, 
                <strong> Cybersecurity Act, 2020 (Act 1038)</strong>, and the 
                <strong> National Child Online Protection (COP) Framework</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 cursor-pointer shadow-xs"
                title="Print or export as PDF"
              >
                <Printer className="w-4 h-4 text-sky-300" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Document Switcher Tabs */}
          <div className="pt-4 flex flex-wrap gap-2 border-t border-slate-800/80 print:hidden">
            <button
              type="button"
              onClick={() => handleSwitchDoc("privacy")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeDoc === "privacy"
                  ? "bg-[#0056D2] text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchDoc("terms")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeDoc === "terms"
                  ? "bg-[#0056D2] text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchDoc("cop")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeDoc === "cop"
                  ? "bg-[#0056D2] text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Child Online Protection (COP) Charter</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Document Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          
          {/* Left Table of Contents Navigator (Sticky on Desktop) */}
          <aside className="hidden lg:block sticky top-20 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-4 print:hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Contents Index
              </span>
              <h3 className="text-xs font-bold text-slate-900">
                {activeDoc === "privacy" && "Privacy Policy Sections"}
                {activeDoc === "terms" && "Terms of Service Sections"}
                {activeDoc === "cop" && "COP Charter Sections"}
              </h3>
            </div>

            <nav className="space-y-1 text-xs">
              {activeDoc === "privacy" && (
                <>
                  <a href="#privacy-intro" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    1. Statutory Authority &amp; Scope
                  </a>
                  <a href="#privacy-data-collected" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    2. Data Collected &amp; Purpose
                  </a>
                  <a href="#privacy-dob" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    3. Date of Birth &amp; Minor Safety
                  </a>
                  <a href="#privacy-encryption" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    4. End-to-End Encryption &amp; Keys
                  </a>
                  <a href="#privacy-incidents" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    5. Anonymous Incident Reporting
                  </a>
                  <a href="#privacy-rights" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    6. User Rights (Act 843 Sec 28)
                  </a>
                  <a href="#privacy-deletion" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    7. Account Deletion &amp; Erasure
                  </a>
                  <a href="#privacy-contact" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    8. Regulatory Contact
                  </a>
                </>
              )}

              {activeDoc === "terms" && (
                <>
                  <a href="#terms-eligibility" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    1. Eligibility &amp; Acceptance
                  </a>
                  <a href="#terms-code-conduct" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    2. Child Online Protection Rules
                  </a>
                  <a href="#terms-mentors" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    3. Tutor &amp; Mentor Obligations
                  </a>
                  <a href="#terms-threat-sim" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    4. Threat Simulator Sandbox
                  </a>
                  <a href="#terms-certificates" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    5. Credentials &amp; Fraud Prevention
                  </a>
                  <a href="#terms-false-reporting" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    6. Incident Reporting Integrity
                  </a>
                  <a href="#terms-emergency" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    7. Emergency Disclaimers
                  </a>
                  <a href="#terms-governing-law" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    8. Governing Law &amp; Courts
                  </a>
                </>
              )}

              {activeDoc === "cop" && (
                <>
                  <a href="#cop-mission" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    1. National Mandate &amp; Vision
                  </a>
                  <a href="#cop-age-tiering" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    2. Age-Tier Separation
                  </a>
                  <a href="#cop-grooming" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    3. Anti-Grooming Heuristics
                  </a>
                  <a href="#cop-vetting" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    4. Mentor CSA Accreditation
                  </a>
                  <a href="#cop-parents" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    5. Parents &amp; Schools Guide
                  </a>
                  <a href="#cop-helpline" className="block px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0056D2] hover:bg-slate-50 font-medium transition">
                    6. Immediate Escalation (Dial 292)
                  </a>
                </>
              )}
            </nav>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-700 leading-snug">
                <span className="font-bold text-[#0056D2] block mb-0.5">Need Legal Guidance?</span>
                Email <span className="font-mono text-slate-900">legal@cyberguard.gov.gh</span> or call <strong className="text-slate-900">Toll-Free 292</strong>.
              </div>
            </div>
          </aside>

          {/* Right Main Legal Prose */}
          <main className="bg-white rounded-2xl p-5 sm:p-10 border border-slate-200/90 shadow-2xs space-y-8 print:border-none print:p-0 print:shadow-none">

            {/* Document Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Effective Date:</span>
                <span>November 5, 2026</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Version 2.4 · Gazette Approved</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* DOCUMENT 1: PRIVACY POLICY                                                */}
            {/* ========================================================================= */}
            {activeDoc === "privacy" && (
              <article className="space-y-8 text-slate-700 leading-relaxed text-sm">
                
                {/* Plain-English Overview Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs sm:text-sm text-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#0056D2]">
                    <Eye className="w-4 h-4" />
                    <span>Summary for Students, Parents &amp; Educators</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    We built CyberGuard Ghana to protect Ghanaian youth online. We <strong>do not sell your personal data</strong>, 
                    we do not run commercial trackers or ad networks, and your <strong>date of birth is used exclusively to allocate the right age-safe curriculum</strong>. 
                    Incident reports are stripped of GPS and camera metadata locally on your device before they reach our servers.
                  </p>
                </div>

                <section id="privacy-intro" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">1</span>
                    Statutory Authority &amp; Governance
                  </h2>
                  <p>
                    CyberGuard Ghana (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;) is operated under the policy guidelines of the 
                    <strong> Cyber Security Authority (CSA)</strong> pursuant to the <strong>Cybersecurity Act, 2020 (Act 1038)</strong> and is registered 
                    as a public-interest data controller under the <strong>Data Protection Act, 2012 (Act 843)</strong> overseen by the 
                    <strong> Data Protection Commission (DPC) of Ghana</strong>.
                  </p>
                  <p>
                    This Privacy Policy explains how we collect, process, safeguard, and delete personal data when students, parents, tutors, 
                    and school administrators interact with our courses, threat response simulators, verified mentor network, and confidential reporting desk.
                  </p>
                </section>

                <section id="privacy-data-collected" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">2</span>
                    Information We Collect &amp; Lawful Basis
                  </h2>
                  <p>
                    Under Section 18 of the Data Protection Act (Act 843), we process personal data strictly where necessary for the performance 
                    of educational services, child safeguarding, and lawful incident triage:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Account Identification:</strong> Full name (or pseudonym for minor accounts), email address, and optional phone number.
                    </li>
                    <li>
                      <strong>Authentication Credentials:</strong> Passwords stored via one-way cryptographic salted hashes (bcrypt/argon2). We cannot read your raw password.
                    </li>
                    <li>
                      <strong>Learning &amp; Certification Records:</strong> Module completions, assessment scores, earned XP, and verifiable cryptographic certificate serial numbers.
                    </li>
                    <li>
                      <strong>Encrypted Communication Metadata:</strong> Public ECDH identity keys and encrypted message payloads for 1-on-1 mentorship interactions.
                    </li>
                  </ul>
                </section>

                <section id="privacy-dob" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">3</span>
                    Date of Birth &amp; Child Online Protection (COP) Tiering
                  </h2>
                  <p>
                    In accordance with the <strong>National Child Online Protection (COP) Policy Framework</strong>, CyberGuard Ghana segregates curriculum 
                    and interaction environments by developmental maturity:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
                      <span className="font-bold text-slate-900 text-xs block">Junior Safety Track (Ages 12–18)</span>
                      <p className="text-xs text-slate-600 leading-snug">
                        Focuses on foundational safety: cyberbullying defense, social media privacy, resisting predator manipulation, and safe gaming. 
                        Direct messages with accredited tutors are monitored via automated safety heuristic alerts.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="font-bold text-slate-900 text-xs block">Young Adult Safety Track (Ages 19+)</span>
                      <p className="text-xs text-slate-600 leading-snug">
                        Focuses on adult financial defense: Mobile Money (MoMo) cash-out phishing, SIM-swap extortion, business email compromise, and workforce digital ethics.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 pt-1">
                    <strong>Privacy Guarantee:</strong> Your exact date of birth is never visible on public certificates, never exposed in mentor directories, 
                    and never disclosed to third parties. It is solely used internally to allocate the correct age track.
                  </p>
                </section>

                <section id="privacy-encryption" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">4</span>
                    End-to-End Cryptography in Mentor Chat
                  </h2>
                  <p>
                    Mentorship conversations utilize client-side Web Crypto API standards (Elliptic Curve Diffie-Hellman P-256 and AES-GCM-256). 
                    Your private keys are generated on your device and stored in local IndexedDB. 
                    Server operators cannot decrypt your messages in transit.
                  </p>
                  <p>
                    <strong>Safety Exception for Child Protection:</strong> If a student triggers the &quot;Report to CSA&quot; emergency action, or if client-side 
                    anti-grooming heuristics detect credible threats of child exploitation, the relevant message transcript is securely submitted to 
                    authorized CSA child protection officers for legal intervention.
                  </p>
                </section>

                <section id="privacy-incidents" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">5</span>
                    Confidential &amp; Anonymous Incident Reporting
                  </h2>
                  <p>
                    In accordance with Sections 49 through 52 of Act 1038, CyberGuard provides a whistleblower incident reporting conduit:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li>
                      <strong>Zero Mandatory Registration:</strong> You do not need to create an account or provide an email to file an incident report.
                    </li>
                    <li>
                      <strong>Client-Side Metadata Stripping:</strong> Uploaded image evidence (PNG, JPG, WEBP) has all camera make, model, exposure, and GPS location tags permanently stripped inside your browser prior to server transmission.
                    </li>
                    <li>
                      <strong>SHA-256 Tamper Evident Hashing:</strong> An immutable cryptographic hash is generated client-side to preserve chain of custody without leaking metadata.
                    </li>
                  </ul>
                </section>

                <section id="privacy-rights" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">6</span>
                    Your Data Subject Rights Under Ghana Act 843
                  </h2>
                  <p>
                    Under Part V of the Data Protection Act, 2012, every user resident in Ghana possesses actionable rights:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-xs">Right to Access (Section 32):</strong> You may inspect all personal records, module scores, and tutor interactions held on the platform.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-xs">Right to Rectification (Section 33):</strong> You may update inaccuracies in your profile, display name, or contact details at any time in Account Settings.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-xs">Right to Erasure / Right to be Forgotten (Section 28):</strong> You have the legal right to request complete destruction of your user profile, learning progress, and personal data.
                      </div>
                    </div>
                  </div>
                </section>

                <section id="privacy-deletion" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">7</span>
                    Automated Account Deletion &amp; Data Erasure Protocol
                  </h2>
                  <p>
                    We provide an automated, permanent self-service deletion workflow accessible under <strong>Account Settings › Delete Account</strong>:
                  </p>
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Permanent Erasure Process</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      Upon confirmation with your account password, your profile, active sessions, and direct mentor conversations are permanently expunged. 
                      Certificates previously issued remain cryptographically verifiable by serial number to preserve institutional integrity, 
                      but are scrubbed of personal identification in active directories.
                    </p>
                  </div>
                </section>

                <section id="privacy-contact" className="space-y-3 border-t border-slate-100 pt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">8</span>
                    Data Protection Officer &amp; Regulatory Contacts
                  </h2>
                  <p>
                    For queries regarding data processing, legal compliance, or supervisory escalation:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block font-bold">CyberGuard Data Protection Office</strong>
                      <p className="text-slate-600">Cyber Security Authority Complex, Accra, Ghana</p>
                      <p className="text-slate-600">Email: <span className="font-mono text-slate-900">dpo@cyberguard.gov.gh</span></p>
                      <p className="text-slate-600">Helpline: <strong className="text-slate-900">Toll-Free 292</strong></p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block font-bold">Data Protection Commission (DPC) Ghana</strong>
                      <p className="text-slate-600">East Legon, Accra, Republic of Ghana</p>
                      <p className="text-slate-600">Website: <span className="font-mono text-slate-900">www.dataprotection.org.gh</span></p>
                      <p className="text-slate-600">Telephone: +233 (0)30 222 2929</p>
                    </div>
                  </div>
                </section>
              </article>
            )}

            {/* ========================================================================= */}
            {/* DOCUMENT 2: TERMS OF SERVICE                                              */}
            {/* ========================================================================= */}
            {activeDoc === "terms" && (
              <article className="space-y-8 text-slate-700 leading-relaxed text-sm">
                
                {/* Summary Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Scale className="w-4 h-4 text-[#0056D2]" />
                    <span>Key Terms Overview</span>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    By accessing or registering on CyberGuard Ghana, you agree to abide by these Terms of Service and Ghana law. 
                    This platform exists for cyber education, threat defense training, and child protection. 
                    Zero tolerance applies to harassment, sextortion, impersonation of officials, or tampering with credential systems.
                  </p>
                </div>

                <section id="terms-eligibility" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">1</span>
                    Eligibility &amp; Acceptance
                  </h2>
                  <p>
                    CyberGuard Ghana is open to Ghanaian basic school students, senior high school pupils, university students, educators, parents, 
                    and accredited cybersecurity professionals. 
                    Users under the age of 18 must use the platform with the knowledge of a parent, guardian, or sponsoring academic institution.
                  </p>
                  <p>
                    By checking &quot;I agree to the Terms of Service&quot; during registration or by submitting an incident report, you enter into a legally 
                    binding agreement governed by the laws of the Republic of Ghana.
                  </p>
                </section>

                <section id="terms-code-conduct" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">2</span>
                    Child Online Protection &amp; Acceptable Use Rules
                  </h2>
                  <p>
                    Pursuant to Sections 62 through 66 of the Cybersecurity Act, 2020 (Act 1038), all users are strictly prohibited from:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Child Grooming &amp; Exploitation:</strong> Soliciting, inducing, or attempting to communicate sexually explicit content with any minor. Such offenses are immediately escalated to the Cyber Security Authority and the Criminal Investigation Department (CID) of the Ghana Police Service.
                    </li>
                    <li>
                      <strong>Cyberbullying &amp; Harassment:</strong> Stalking, menacing, doxxing, or distributing non-consensual imagery.
                    </li>
                    <li>
                      <strong>Mobile Money &amp; Financial Fraud:</strong> Using platform communications to conduct advance fee fraud (&quot;419&quot;), illegal cash-out schemes, or banking scams.
                    </li>
                    <li>
                      <strong>Impersonation:</strong> Falsely claiming to be a CSA Officer, Ghana Police officer, tutor, or school administrator.
                    </li>
                  </ul>
                </section>

                <section id="terms-mentors" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">3</span>
                    Verified Tutor &amp; Mentor Code of Conduct
                  </h2>
                  <p>
                    Mentors registered on CyberGuard Ghana operate as trusted fiduciaries for Ghanaian youth. Mentors must:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li>Maintain an active, verifiable cybersecurity professional credential or academic qualification.</li>
                    <li>Never solicit personal meeting arrangements with students under 18 outside approved school channels.</li>
                    <li>Conduct all mentorship communications exclusively through the platform&apos;s encrypted message channels.</li>
                    <li>Immediately report any signs of child distress, abuse, or online extortion to the CSA emergency queue.</li>
                  </ul>
                </section>

                <section id="terms-threat-sim" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">4</span>
                    Threat Simulator &amp; Sandbox Safety Rules
                  </h2>
                  <p>
                    The Cyber Threat Simulator provides synthetic, sandboxed simulations of SMS phishing (smishing), fake lottery scams, 
                    and fake Mobile Money cash-out alerts. 
                    These scenarios are intended purely for educational threat recognition. 
                    Users may not copy simulator payloads or code snippets to execute live cyber attacks or penetration tests against any external infrastructure.
                  </p>
                </section>

                <section id="terms-certificates" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">5</span>
                    Certification Integrity &amp; Anti-Tampering
                  </h2>
                  <p>
                    Certificates issued by CyberGuard Ghana contain unique reference codes verifiable in the public National Credential Registry. 
                    Altering, forging, or falsely representing completion of an accredited Child Online Protection course constitutes fraud under the 
                    Electronic Transactions Act, 2008 (Act 772). We reserve the right to revoke credentials obtained through illicit means.
                  </p>
                </section>

                <section id="terms-false-reporting" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">6</span>
                    Incident Reporting Integrity (Act 1038 Sec 88)
                  </h2>
                  <p>
                    The anonymous incident desk is an official public safety mechanism. 
                    Under Section 88 of Act 1038, a person who knowingly and willfully makes a false or misleading report to the Cyber Security Authority commits an offense. 
                    Users must submit incident reports in good faith to assist in investigating genuine online threats.
                  </p>
                </section>

                <section id="terms-emergency" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">7</span>
                    Emergency Limitation &amp; First Response Disclaimer
                  </h2>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1 text-xs">
                    <strong className="block font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> ACTIVE LIFE SAFETY WARNING
                    </strong>
                    <p className="leading-relaxed">
                      CyberGuard Ghana is an educational and administrative reporting portal. 
                      If you or someone you know is in <strong>immediate physical danger, active abduction, or self-harm risk</strong>, 
                      do not wait for web portal triage. 
                      Immediately dial <strong>Police Emergency (191 / 112)</strong> or the <strong>CSA National Cyber Threat Hotline (292)</strong>.
                    </p>
                  </div>
                </section>

                <section id="terms-governing-law" className="space-y-3 border-t border-slate-100 pt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">8</span>
                    Governing Law &amp; Jurisdiction
                  </h2>
                  <p>
                    These Terms of Service are construed in accordance with the laws of the Republic of Ghana. 
                    Any disputes arising out of the use of this portal shall be subject to the exclusive jurisdiction of the Courts of Ghana.
                  </p>
                </section>
              </article>
            )}

            {/* ========================================================================= */}
            {/* DOCUMENT 3: CHILD ONLINE PROTECTION (COP) POLICY                          */}
            {/* ========================================================================= */}
            {activeDoc === "cop" && (
              <article className="space-y-8 text-slate-700 leading-relaxed text-sm">
                
                {/* COP Hero Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-[#001E3C] to-slate-950 text-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Ghana National Child Online Protection (COP) Charter</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                    Every Ghanaian Child Has the Right to a Safe Digital World
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Under the 1992 Constitution of Ghana (Article 28) and the Children&apos;s Act, 1998 (Act 560), children must be protected 
                    from harm, exploitation, and abuse. This Charter operationalizes that constitutional guarantee across cyberspace.
                  </p>
                </div>

                <section id="cop-mission" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">1</span>
                    National Mandate &amp; Child Protection Mission
                  </h2>
                  <p>
                    CyberGuard Ghana is engineered from the ground up as a Child-Centric Security Platform. 
                    Our design decisions follow the International Telecommunication Union (ITU) Guidelines for Child Online Protection 
                    and the Cyber Security Authority of Ghana&apos;s National COP Framework.
                  </p>
                </section>

                <section id="cop-age-tiering" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">2</span>
                    Strict Age Separation &amp; Developmental Safeguards
                  </h2>
                  <p>
                    Children aged 12 to 18 are automatically enrolled in the <strong>Junior Track</strong>. 
                    This track features simplified safety analogies, zero exposure to adult cyber-threat jargon, 
                    and restrictions preventing unvetted adult users from initiating unsolicited peer contact.
                  </p>
                </section>

                <section id="cop-grooming" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">3</span>
                    Real-Time Anti-Grooming &amp; Predator Detection
                  </h2>
                  <p>
                    Our messaging infrastructure implements real-time client-side heuristic pattern detection to intercept:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li>Attempts by mentors to transition conversations to private personal platforms (WhatsApp, Snapchat, Telegram, phone calls).</li>
                    <li>Solicitation of private residential locations, school uniforms, or physical meeting venues.</li>
                    <li>Requests for private photographs or secrets kept from parents and guardians.</li>
                  </ul>
                  <p className="text-xs text-slate-500 pt-1">
                    When detected, the learner is presented with an immediate protective prompt: 
                    <em> &quot;Warning: Mentors must never ask you to keep secrets or move off CyberGuard. Would you like to block this user and alert the CSA?&quot;</em>
                  </p>
                </section>

                <section id="cop-vetting" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">4</span>
                    Tutor Background Screening &amp; CSA Accreditation
                  </h2>
                  <p>
                    No adult may interact as a mentor with students on CyberGuard without:
                  </p>
                  <ol className="list-decimal pl-6 space-y-1.5">
                    <li>Verification of Ghana Card / National ID.</li>
                    <li>Criminal history check for offenses involving children.</li>
                    <li>Accreditation in Ghana&apos;s National Child Online Protection protocols.</li>
                    <li>Adherence to the mandatory child abuse reporting standard.</li>
                  </ol>
                </section>

                <section id="cop-parents" className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">5</span>
                    Parent &amp; School Guardian Empowerment
                  </h2>
                  <p>
                    Parents and teachers are vital partners in child online safety. We provide:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 font-bold block">Verifiable Progress Badges</strong>
                      <p className="text-slate-600">
                        Inspect your child&apos;s certificate reference number on our public registry to review which cyber safety assessments they have mastered.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 font-bold block">Direct School Reporting</strong>
                      <p className="text-slate-600">
                        Educational institutions can submit bulk incident reports concerning cyberbullying rings or digital harassment targeting their student body.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="cop-helpline" className="space-y-3 border-t border-slate-100 pt-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">6</span>
                    National Emergency Child Protection Channels
                  </h2>
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-900 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-5 h-5 text-amber-600 shrink-0" />
                      <h4 className="font-bold text-sm text-slate-900">
                        Ghana National Child Protection Helplines
                      </h4>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">CSA Threat Hotline</span>
                        <span className="text-base font-black text-[#0056D2]">Dial 292</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Toll-free 24/7 hotline for cyber harassment &amp; extortion</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Orange Child Helpline</span>
                        <span className="text-base font-black text-amber-700">Dial 116</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Free national helpline for children in distress</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Police National Emergency</span>
                        <span className="text-base font-black text-rose-700">Dial 191 / 112</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Immediate police dispatch for physical safety threats</p>
                      </div>
                    </div>
                  </div>
                </section>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

