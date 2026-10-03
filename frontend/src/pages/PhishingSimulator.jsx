import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, Zap, RefreshCw, 
  Smartphone, Lock, Globe, Mail, Shield, CheckCircle2, XCircle, Award, 
  HelpCircle, RotateCcw, Sparkles, ChevronRight, Trophy, Eye, Flame, LogIn, UserPlus
} from "lucide-react";

// 10 Comprehensive Cybersecurity Threat Scenarios
const THREAT_SCENARIOS = [
  {
    id: 1,
    domain: "Mobile Money (MoMo) Security",
    title: "The Urgent Cash-Out Reversal SMS",
    artifactType: "SMS MESSAGE",
    artifactSender: "0244998811 (Personal Phone Number)",
    artifactContent: "Y'ello! You have received GHC 1,200.00 from KWAME ASANTE. Current Balance: GHC 1,840.50. Ref: Payment for Laptop.",
    redFlagHighlights: [
      "Sent from personal number '0244998811' instead of official 'MTN MoMo' shortcode.",
      "Fake credit SMS designed to trick victim into sending real money OUT.",
      "Caller uses high-pressure emotional tactic immediately after SMS arrives."
    ],
    situation: "10 seconds after receiving this SMS, a caller phones you crying hysterically, saying they accidentally sent their sick child's hospital deposit to your number. They beg you to dial *170# and transfer GHC 1,200 back to them immediately.",
    options: [
      {
        id: "A",
        text: "Immediately dial *170# and transfer the GHC 1,200 back to help the crying parent.",
        isCorrect: false,
        feedback: "DANGEROUS: Sending money manually based on an SMS transfers real money OUT of your wallet. The caller never actually deposited money."
      },
      {
        id: "B",
        text: "Do not send money. Check your real balance directly via *170# or your official MoMo app. If no funds arrived, instruct the caller to report to official telecom Customer Care (100) for authenticated reversal.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Real deposits come ONLY from official shortcodes. Telecom customer care handles legitimate reversals under CSA rules."
      },
      {
        id: "C",
        text: "Send half the money (GHC 600) as a goodwill gesture while you verify the transaction later.",
        isCorrect: false,
        feedback: "INCORRECT: Partial transfers still result in financial loss to cyber fraudsters."
      },
      {
        id: "D",
        text: "Reply to the SMS text message asking for a copy of their Ghana Card before sending the money.",
        isCorrect: false,
        feedback: "INCORRECT: Fraudsters use stolen photos of Ghana Cards as fake proof. Never transfer funds based on SMS text."
      }
    ],
    explanation: {
      correctWhy: "Official deposit notifications come ONLY from telecom shortcodes ('MTN MoMo' or 'Telecel Cash'), NEVER from personal 10-digit mobile numbers! Scammers send fake SMS notifications from personal lines to trick victims into transferring real money OUT of their wallet.",
      protocol: "1. Dial *170# or open official telecom app directly to check your true wallet balance.\n2. Never manually transfer money back to callers claiming mistaken deposits.\n3. Instruct callers to call official Telecom Customer Care (MTN 100 / Telecel 100) who perform authenticated reversals under Cybersecurity Authority (CSA) protocols."
    }
  },
  {
    id: 2,
    domain: "Account Security & WhatsApp Protection",
    title: "The WhatsApp 6-Digit Registration Code Trap",
    artifactType: "WHATSAPP MESSAGE",
    artifactSender: "Kofi Mensah (Church Member Contact)",
    artifactContent: "Hey! I'm trying to log into the church committee portal and accidentally selected your number for verification. An SMS with a 6-digit code was sent to you. Please send it to me quickly so I can finish logging in!",
    redFlagHighlights: [
      "Demands 6-digit WhatsApp registration code sent to your phone.",
      "Uses compromised account of trusted friend to build false trust.",
      "High urgency request to prevent victim from thinking critically."
    ],
    situation: "You simultaneously receive a real SMS message containing a 6-digit WhatsApp registration code.",
    options: [
      {
        id: "A",
        text: "Read the 6-digit code from your SMS and send it directly to your church member on WhatsApp.",
        isCorrect: false,
        feedback: "DANGEROUS: Sending that 6-digit code instantly grants the hacker full control of your WhatsApp account."
      },
      {
        id: "B",
        text: "NEVER share the 6-digit WhatsApp registration code under any circumstances. Call your friend directly on a regular phone call to inform them their WhatsApp account has been hijacked.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Registration codes are secret security credentials. Never share them with anyone."
      },
      {
        id: "C",
        text: "Forward the SMS message directly to their phone number.",
        isCorrect: false,
        feedback: "INCORRECT: Forwarding the SMS hands over the exact authorization code to the attacker."
      },
      {
        id: "D",
        text: "Post the code in the church WhatsApp group so everyone can verify it.",
        isCorrect: false,
        feedback: "INCORRECT: Exposing registration codes publicly guarantees account hijack."
      }
    ],
    explanation: {
      correctWhy: "The 6-digit code is YOUR WhatsApp account registration verification code! Hackers take over existing accounts and message all contacts pretending to be trusted friends. Handing over that code gives the hacker complete control of your WhatsApp account immediately.",
      protocol: "1. Treat all 6-digit SMS verification codes as secret PINs—never share them with anyone, including friends or family.\n2. Call your friend via standard cellular call to alert them that their account was hijacked.\n3. Enable 2-Step Verification on your WhatsApp app (Settings -> Account -> Two-step verification)."
    }
  },
  {
    id: 3,
    domain: "Web & Email Phishing Inspection",
    title: "University Student Portal Password Expiration",
    artifactType: "EMAIL PAYLOAD",
    artifactSender: "IT Helpdesk <support@ug-edu-portal-gh.net>",
    artifactContent: "URGENT: Your University student portal account will be deactivated in 12 hours due to mandatory system upgrades. Re-verify your password and Ghana Card at http://ug-edu-portal-gh.net/reverify to avoid course deregistration.",
    redFlagHighlights: [
      "Spoofed domain 'ug-edu-portal-gh.net' is not official university domain '@ug.edu.gh'.",
      "Artificial 12-hour deadline designed to induce panic.",
      "Unencrypted HTTP URL demanding student credentials and Ghana Card ID."
    ],
    situation: "You are preparing for end-of-semester examinations when this email arrives in your inbox.",
    options: [
      {
        id: "A",
        text: "Click the link immediately and log in to ensure your exam index number isn't cancelled.",
        isCorrect: false,
        feedback: "DANGEROUS: Clicking embedded email links leads to fake credential harvesting forms."
      },
      {
        id: "B",
        text: "Reply to the email asking the sender to confirm if they are real IT staff.",
        isCorrect: false,
        feedback: "INCORRECT: Replying confirms your email is active to cybercriminals."
      },
      {
        id: "C",
        text: "Ignore the email link. Open a fresh browser tab, type your official university portal web address directly, log in there, and report the phishing link to campus IT.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Always navigate directly to official domain names by typing the URL yourself."
      },
      {
        id: "D",
        text: "Forward the email to all your classmates so they can re-verify their accounts too.",
        isCorrect: false,
        feedback: "INCORRECT: Spreading phishing links increases risk to your entire campus network."
      }
    ],
    explanation: {
      correctWhy: "Look closely at the email domain: 'ug-edu-portal-gh.net' is an illicit domain registered by cybercriminals! Official university communications use official domain names like '@ug.edu.gh' or '@knust.edu.gh'. Attackers create artificial deadlines (12 hours) to induce panic decision-making.",
      protocol: "1. Never click login links embedded inside emails or SMS messages.\n2. Always open a fresh browser tab and manually type official website addresses into the address bar.\n3. Verify HTTPS SSL security certificates and inspect domain endings before entering student credentials."
    }
  },
  {
    id: 4,
    domain: "Hardware & Device Security",
    title: "Public Kiosk 'Juice Jacking' USB Charge Trap",
    artifactType: "HARDWARE SCREEN PROMPT",
    artifactSender: "Public Airport Charging Station",
    artifactContent: "Prompt on your phone screen: 'Trust this computer and allow access to device storage, photos, & data?'",
    redFlagHighlights: [
      "Public USB port requesting full device storage & data permission.",
      "USB charging cables carry both power lines and data transfer lines.",
      "Tapping 'Trust' allows hidden microcontrollers to extract stored photos and passwords."
    ],
    situation: "Your smartphone battery is at 2% while waiting at Kotoka International Airport. You plug your phone into a free public USB charging kiosk cord. This prompt immediately appears.",
    options: [
      {
        id: "A",
        text: "Tap 'Trust / Allow' because it is required for the charger to deliver high-speed fast charging.",
        isCorrect: false,
        feedback: "DANGEROUS: Tapping Trust grants the public kiosk full access to download malware or copy your private files."
      },
      {
        id: "B",
        text: "Tap 'Don't Trust / Deny', or unplug the phone immediately. Use your own wall adapter or a data-blocker adapter connected to an AC wall socket.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Protect your device by denying data access or using an AC power block / USB data blocker."
      },
      {
        id: "C",
        text: "Tap 'Trust' but immediately turn off Wi-Fi and Bluetooth.",
        isCorrect: false,
        feedback: "INCORRECT: Turning off Wi-Fi does not stop data extraction over the connected USB cable."
      },
      {
        id: "D",
        text: "Leave the phone plugged in and walk away to buy a drink.",
        isCorrect: false,
        feedback: "INCORRECT: Leaving unattended devices plugged in creates extreme physical and data theft risk."
      }
    ],
    explanation: {
      correctWhy: "This is a 'Juice Jacking' attack! Public USB charging ports carry both power AND data lines. Malicious charging stations hide microcontrollers that stealthily download malware, siphon private photos, or extract saved browser passwords when you tap 'Trust'.",
      protocol: "1. Never tap 'Trust Computer' on public charging stations.\n2. Carry your own AC power adapter block to plug into wall electrical sockets.\n3. Use a physical USB Data Blocker ('USB Condom') that physically disconnects the data transfer pins while allowing power to flow."
    }
  },
  {
    id: 5,
    domain: "Network & Wi-Fi Security",
    title: "Public Wi-Fi Man-in-the-Middle (MitM) Eavesdropping",
    artifactType: "BROWSER POPUP WARNING",
    artifactSender: "FREE_CAFE_WIFI_FAST Network",
    artifactContent: "Warning: 'The security certificate of this website cannot be verified. Attackers may be trying to steal your information. Proceed anyway?'",
    redFlagHighlights: [
      "SSL/TLS Certificate validation failure on open Wi-Fi network.",
      "An attacker on the same network is intercepting encrypted traffic.",
      "Proceeding sends passwords in plain text to eavesdropper."
    ],
    situation: "You connect to an open, unencrypted public Wi-Fi network at an Accra coffee shop to log into your bank or student portal. This browser warning pops up.",
    options: [
      {
        id: "A",
        text: "Click 'Proceed / Accept Security Warning' so you can finish your bank transaction quickly.",
        isCorrect: false,
        feedback: "DANGEROUS: Bypassing SSL warnings hands your unencrypted passwords directly to network eavesdroppers."
      },
      {
        id: "B",
        text: "Immediately disconnect from the open public Wi-Fi network. Switch to your cellular mobile data (4G/5G) or enable a trusted VPN before accessing sensitive accounts.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Disconnect from compromised networks immediately and use encrypted cellular data or VPN."
      },
      {
        id: "C",
        text: "Refresh the browser page 3 times until the warning goes away, then enter your password.",
        isCorrect: false,
        feedback: "INCORRECT: Refreshing does not remove an active Man-in-the-Middle packet interceptor."
      },
      {
        id: "D",
        text: "Switch to Incognito / Private browsing mode and proceed with your transaction.",
        isCorrect: false,
        feedback: "INCORRECT: Incognito mode only prevents local history saving—it does NOT encrypt network traffic."
      }
    ],
    explanation: {
      correctWhy: "SSL/TLS certificate warnings on public Wi-Fi indicate an active Man-in-the-Middle (MitM) attack! An attacker on the same network is intercepting your connection to inspect plain-text passwords and session tokens. Incognito mode does NOT encrypt network traffic.",
      protocol: "1. Disconnect from unencrypted public Wi-Fi immediately upon seeing SSL warnings.\n2. Use cellular data (4G/5G) or an encrypted Virtual Private Network (VPN) for sensitive transactions.\n3. Never bypass browser SSL/TLS certificate warnings."
    }
  },
  {
    id: 6,
    domain: "Cyber Extortion & Digital Rights (Act 1038)",
    title: "Social Media Sextortion & Blackmail Threat",
    artifactType: "INSTAGRAM DIRECT MESSAGE",
    artifactSender: "@anon_user991",
    artifactContent: "I have recorded webcam footage of you during our private call. I have your full contacts list and school principal's email. Pay GHC 2,000 via MoMo to 0559876543 in 4 hours or I release the video online to everyone.",
    redFlagHighlights: [
      "Short 4-hour countdown panic tactic.",
      "Demands monetary ransom via unverified MoMo number.",
      "Ghanaian Cybersecurity Act 2020 (Act 1038) classifies digital extortion as a severe felony."
    ],
    situation: "A stranger on social media enticed you into a private call and is now attempting cyber extortion.",
    options: [
      {
        id: "A",
        text: "Pay GHC 500 immediately as a down payment and beg them not to post the video.",
        isCorrect: false,
        feedback: "DANGEROUS: Paying extortionists flags you as a paying target and leads to higher ransom demands."
      },
      {
        id: "B",
        text: "DO NOT pay money, DO NOT delete chat history. Take clear screenshots of the threat, block the account, set social profiles to private, and file a report with the Cybersecurity Authority (CSA Hotline 292).",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Preserve evidence, refuse payment, and report immediately to CSA Ghana authorities."
      },
      {
        id: "C",
        text: "Deactivate all your social media accounts immediately without saving evidence.",
        isCorrect: false,
        feedback: "INCORRECT: Deleting evidence prevents law enforcement from tracing the attacker's phone number."
      },
      {
        id: "D",
        text: "Pay the full GHC 2,000 and hope they delete the video as promised.",
        isCorrect: false,
        feedback: "INCORRECT: Extortionists almost never delete videos after receiving money."
      }
    ],
    explanation: {
      correctWhy: "Paying cyber extortionists NEVER works—it identifies you as a paying victim and triggers demands for even more money! Under Ghana's Cybersecurity Act 2020 (Act 1038), digital extortion and non-consensual image sharing are major criminal offenses carrying heavy prison sentences.",
      protocol: "1. Never transfer money to cyber blackmailers.\n2. Save full screenshots of chat messages, phone numbers, and profile handles as evidence.\n3. Report immediately to the CSA Ghana Cybercrime Hotline (Call 292 / WhatsApp 0501840000) for official digital trace and legal action."
    }
  },
  {
    id: 7,
    domain: "E-Commerce & Social Media Store Fraud",
    title: "Instagram Fake Store & MoMo Pre-Payment Scam",
    artifactType: "INSTAGRAM POST & DM",
    artifactSender: "@Accra_Sneaker_Store_GH",
    artifactContent: "FLASH SALE! Original Nike Air Jordan sneakers for GHC 250 (Regular GHC 1,200). Full upfront MoMo payment required to personal number 0541234567 before delivery. Limited stock!",
    redFlagHighlights: [
      "Unrealistic 80% discount price trigger.",
      "Demands full upfront MoMo transfer to a personal 10-digit number.",
      "Refuses Pay-on-Delivery or physical store verification."
    ],
    situation: "You find an Instagram vendor offering an 80% discount. They refuse cash-on-delivery and demand upfront transfer to a personal MoMo line.",
    options: [
      {
        id: "A",
        text: "Transfer the GHC 250 immediately to their MoMo number to lock in the 80% discount.",
        isCorrect: false,
        feedback: "DANGEROUS: Sending upfront MoMo payments to personal numbers on social media leads to instant blocking."
      },
      {
        id: "B",
        text: "Decline upfront transfer to a personal MoMo account. Verify if the business has a physical store location, offers Pay-on-Delivery, or uses an accredited escrow payment system.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Protect your funds by using Pay-on-Delivery or verified escrow systems."
      },
      {
        id: "C",
        text: "Send GHC 125 upfront as a deposit and pay the remaining GHC 125 after delivery.",
        isCorrect: false,
        feedback: "INCORRECT: Partial upfront deposits are still stolen by social media fraudsters."
      },
      {
        id: "D",
        text: "Ask them to send a photo of their Ghana Card as proof of identity before sending money.",
        isCorrect: false,
        feedback: "INCORRECT: Fraudsters frequently post stolen photos of innocent citizens' Ghana Cards as fake proof."
      }
    ],
    explanation: {
      correctWhy: "Unsolicited 80% discounts demanding upfront MoMo transfers to personal numbers are 99% fraudulent! Scammers frequently post stolen photos of Ghana Cards (belonging to innocent victims) as fake 'proof'. Once money is sent, the scammer blocks your number.",
      protocol: "1. Avoid making upfront MoMo payments to unverified individual social media accounts.\n2. Prefer Pay-on-Delivery or physical store visits for online purchases.\n3. Verify seller business registration and customer reviews across independent platforms."
    }
  },
  {
    id: 8,
    domain: "Business Email Compromise (BEC)",
    title: "Spoofed CEO Urgent Wire Transfer Request",
    artifactType: "CORPORATE EMAIL",
    artifactSender: "CEO-Director <director-ceo-firm@exec-mail-gh.net>",
    artifactContent: "URGENT: I am in an emergency investor board meeting. Wire GHC 15,000 immediately to vendor account 002919812 for urgent equipment release. Do not call my phone as I cannot take calls.",
    redFlagHighlights: [
      "Spoofed domain 'exec-mail-gh.net' is not company's true domain name.",
      "Explicit directive 'do not call my phone' specifically engineered to prevent verbal check.",
      "Demands high-value GHC 15,000 wire transfer without secondary approval."
    ],
    situation: "You work as an assistant or accountant for a local company and receive this email during work hours.",
    options: [
      {
        id: "A",
        text: "Process the GHC 15,000 wire transfer immediately to avoid disobeying executive orders.",
        isCorrect: false,
        feedback: "DANGEROUS: Wiring funds based solely on email instructions results in massive corporate loss."
      },
      {
        id: "B",
        text: "Pause the transfer. Verify the request by calling the CEO directly on their known phone number or speaking in person, regardless of email instructions not to call.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Enforce two-factor out-of-band verbal confirmation for all financial transactions."
      },
      {
        id: "C",
        text: "Reply to the email asking if GHC 10,000 is sufficient for now.",
        isCorrect: false,
        feedback: "INCORRECT: Replying to a spoofed email connects you back to the hacker."
      },
      {
        id: "D",
        text: "Forward the email to a colleague and ask them to process the transfer for you.",
        isCorrect: false,
        feedback: "INCORRECT: Passing along unverified transfer instructions spreads executive fraud inside your company."
      }
    ],
    explanation: {
      correctWhy: "This is a Business Email Compromise (BEC) attack! Look at the email address: 'exec-mail-gh.net' is a domain spoofed by attackers. Cybercriminals specifically write 'do not call my phone' to prevent verbal verification.",
      protocol: "1. Always enforce two-factor out-of-band verification (phone call or in-person confirmation) for financial transfer requests.\n2. Inspect full email headers and domain endings rather than trusting display names.\n3. Report spoofed domain communications to company IT security."
    }
  },
  {
    id: 9,
    domain: "Physical Security & USB Baiting",
    title: "The Dropped USB Drive in a Lecture Hall",
    artifactType: "PHYSICAL HARDWARE ARTIFACT",
    artifactSender: "Unlabelled 64GB USB Flash Drive",
    artifactContent: "Sticker on USB Drive reads: '2026 WASSCE Elective Maths Marking Scheme & Leak Answers - CONFIDENTIAL'",
    redFlagHighlights: [
      "Baiting label designed to exploit human curiosity.",
      "Unverified USB hardware device of unknown origin.",
      "Inserting USB automatically triggers pre-configured Rubber Ducky malware payloads."
    ],
    situation: "Walking into your university lecture room, you find this unlabelled 64GB USB drive lying on a desk.",
    options: [
      {
        id: "A",
        text: "Plug the USB drive into your personal laptop immediately to view the stored files.",
        isCorrect: false,
        feedback: "DANGEROUS: Plugging unknown USB drives auto-executes hidden Trojan keyloggers and backdoor scripts."
      },
      {
        id: "B",
        text: "Plug the USB drive into a school library computer to test it safely.",
        isCorrect: false,
        feedback: "INCORRECT: Infecting campus library computers compromises the entire institutional network."
      },
      {
        id: "C",
        text: "DO NOT plug the USB drive into any computer. Hand it over to university security or campus IT staff.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Never insert unknown storage hardware. Hand it over to IT security."
      },
      {
        id: "D",
        text: "Format the USB drive immediately using your laptop so you can use it for personal storage.",
        isCorrect: false,
        feedback: "INCORRECT: USB hardware scripts execute BEFORE OS formatting dialogs appear."
      }
    ],
    explanation: {
      correctWhy: "This is a 'USB Flash Drive Baiting' attack! Attackers intentionally drop USB drives pre-loaded with automated Rubber Ducky scripts or Trojan malware in public places. Plugging the drive into ANY computer automatically executes malicious code that grants remote backdoor access within seconds, before you can even click format!",
      protocol: "1. Never insert unknown or untrusted USB drives into personal or workplace computers.\n2. Hand found storage devices directly to security or IT administrators.\n3. Disable AutoRun / AutoPlay settings on operating systems."
    }
  },
  {
    id: 10,
    domain: "Identity & Passphrase Security",
    title: "Password Reuse & Credential Stuffing Alert",
    artifactType: "SECURITY NOTIFICATION",
    artifactSender: "Security Operations Center",
    artifactContent: "Notice: 'A data breach occurred on GamingPortal.com leaking passwords. An unauthorized login attempt was detected on your account.'",
    redFlagHighlights: [
      "Same password 'Kofi1234!' used across Gmail, Banks, and Student Portal.",
      "Leaked password lists are automatically tested against all major websites by botnets.",
      "Password reuse compromises all accounts simultaneously when one site breaches."
    ],
    situation: "You use the same password ('Kofi1234!') across your social media, student portal, Gmail, and financial apps. You receive notice that a small gaming site you joined 3 years ago was breached.",
    options: [
      {
        id: "A",
        text: "Ignore the alert because you don't use that gaming website anymore.",
        isCorrect: false,
        feedback: "DANGEROUS: Hackers take leaked credentials and attempt automated logins on your bank and Gmail accounts."
      },
      {
        id: "B",
        text: "Change your password ONLY on the gaming website that was breached.",
        isCorrect: false,
        feedback: "INCORRECT: Leaving identical passwords on your Gmail and Bank accounts keeps them exposed."
      },
      {
        id: "C",
        text: "Immediately update your passwords on all critical accounts (Gmail, Student Portal, Financial Apps) to unique passphrases and enable 2-Factor Authentication (2FA) everywhere.",
        isCorrect: true,
        feedback: "CORRECT PROTOCOL: Protect accounts by using unique passphrases and enabling 2FA across all platforms."
      },
      {
        id: "D",
        text: "Change your password on Gmail to 'Kofi1235!' by incrementing the last digit.",
        isCorrect: false,
        feedback: "INCORRECT: Automated botnets test minor single-digit password variations within seconds."
      }
    ],
    explanation: {
      correctWhy: "When a website suffers a breach, hackers take the leaked email/password pairs and run automated scripts to test them across thousands of major services (Facebook, Gmail, Banks) in a 'Credential Stuffing' attack. Reusing passwords puts all your accounts at risk simultaneously!",
      protocol: "1. Use strong, unique passphrases (e.g. 4 random words like 'bank-coffee-[#001E3C]-shield') for every account.\n2. Use a trusted Password Manager to generate and store random complex passwords.\n3. Enable 2-Factor Authentication (2FA) using Authenticator apps across all accounts."
    }
  }
];

export default function PhishingSimulator() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showArtifactInspector, setShowArtifactInspector] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const scenario = THREAT_SCENARIOS[currentIdx];

  // Save completed score to localStorage for logged in user
  useEffect(() => {
    if (isCompleted && user) {
      const resultObj = {
        userId: user.id || user.email,
        userName: user.name || "Student Defender",
        score,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem("cg_threat_sim_score", JSON.stringify(resultObj));
    }
  }, [isCompleted, user, score]);

  function handleSelectOption(optionId) {
    if (selectedOption !== null) return; // lock selection once picked

    const chosen = scenario.options.find(o => o.id === optionId);
    setSelectedOption(optionId);

    const isCorrect = chosen.isCorrect;
    if (isCorrect) {
      const bonusMultiplier = streak >= 2 ? 15 : 10;
      setScore(prev => prev + bonusMultiplier);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setUserAnswers(prev => [
      ...prev,
      {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        selectedOption: optionId,
        isCorrect,
        explanation: scenario.explanation
      }
    ]);
  }

  function handleNextScenario() {
    if (currentIdx + 1 < THREAT_SCENARIOS.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowArtifactInspector(false);
    } else {
      setIsCompleted(true);
    }
  }

  function handleRestartSimulator() {
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowArtifactInspector(false);
    setScore(0);
    setStreak(0);
    setUserAnswers([]);
    setIsCompleted(false);
  }

  // IF USER IS NOT SIGNED IN: Show Required Authentication Locked Portal
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl space-y-8 text-center">
          
          <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <Lock className="w-10 h-10 text-[#0056D2]" />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-extrabold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Authentication Required
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Access Threat Simulator
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium max-w-lg mx-auto">
              Please sign in or create a free account to enter the 10-Scenario Interactive Threat Simulator, record your defense scores, and earn accredited certificates.
            </p>
          </div>

          {/* Interactive Feature Teaser List */}
          <div className="grid sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Zap className="w-5 h-5 text-amber-500" />
              <h4 className="font-extrabold text-slate-900 text-xs">10 Real Scenarios</h4>
              <p className="text-[11px] text-slate-500">MoMo scams, BEC, Wi-Fi eavesdropping & sextortion.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Eye className="w-5 h-5 text-[#0056D2]" />
              <h4 className="font-extrabold text-slate-900 text-xs">Red Flag Inspector</h4>
              <p className="text-[11px] text-slate-500">Interactive live artifact inspection triggers.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <h4 className="font-extrabold text-slate-900 text-xs">COP Accreditation</h4>
              <p className="text-[11px] text-slate-500">Earn verifiable scores attached to your profile.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              state={{ from: "/phishing-simulator", intercepted: true }}
              className="w-full sm:w-auto bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-xs"
            >
              <LogIn className="w-4 h-4" /> Sign In to Your Account
            </Link>

            <Link
              to="/register"
              state={{ from: "/phishing-simulator", intercepted: true }}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" /> Create Free Account
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // IF USER IS AUTHENTICATED: Display Full Interactive Threat Response Simulator
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-[#001E3C] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800 flex items-center min-h-[180px]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85 scale-105"
            style={{ backgroundImage: "url('/hero-threat.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/50" />

          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/70 border border-blue-400/40 text-blue-300 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" /> Welcome Defender, {user.name || user.email}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Interactive Cyber <span className="text-blue-400">Response Simulator</span>
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
              Analyze incoming scam payloads, trigger live red flag inspections, and execute official Ghanaian defense protocols.
            </p>
          </div>
        </div>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Progress & Stats Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056D2] font-black text-sm flex items-center justify-center border border-blue-100">
                  {currentIdx + 1}/10
                </span>
                <div>
                  <span className="text-[10px] font-mono font-extrabold uppercase text-[#0056D2] tracking-wider block">
                    CURRENT THREAT DOMAIN
                  </span>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">{scenario.domain}</h3>
                </div>
              </div>

              {/* Score & Streak Stats */}
              <div className="flex items-center gap-6">
                {streak >= 2 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-black animate-bounce">
                    <Flame className="w-4 h-4 text-amber-600 fill-amber-500" /> {streak}x STREAK BONUS!
                  </div>
                )}
                <div className="text-right">
                  <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400 block">DEFENSE SCORE</span>
                  <span className="font-mono font-black text-lg text-slate-900">{score} PTS</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#0056D2] transition-all duration-500 rounded-full"
                style={{ width: `${((currentIdx + 1) / THREAT_SCENARIOS.length) * 100}%` }}
              />
            </div>

            {/* Main Scenario Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
              
              {/* Scenario Title & Interactive Artifact */}
              <div className="space-y-4 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black uppercase bg-blue-100 text-[#0056D2] px-3 py-1 rounded-md">
                    SCENARIO #{scenario.id} — {scenario.artifactType}
                  </span>

                  {/* Interactive Red Flag Toggle Button */}
                  <button
                    onClick={() => setShowArtifactInspector(!showArtifactInspector)}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0056D2] hover:text-[#00419E] bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showArtifactInspector ? "Hide Red Flag Analysis" : "Inspect Red Flags"}
                  </button>
                </div>

                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {scenario.title}
                </h2>
                
                {/* Suspicious Artifact Card */}
                <div className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 text-[11px]">
                    <span>SENDER / SOURCE: <strong className="text-amber-400">{scenario.artifactSender}</strong></span>
                    <span className="text-red-400 font-extrabold">INCOMING PAYLOAD</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans text-sm pt-1">
                    "{scenario.artifactContent}"
                  </p>

                  {/* Interactive Red Flag Overlay */}
                  {showArtifactInspector && (
                    <div className="pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                      <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest block flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> DETECTED ARTIFACT RED FLAGS:
                      </span>
                      <ul className="space-y-1.5 font-sans text-xs text-slate-300">
                        {scenario.redFlagHighlights.map((flag, idx) => (
                          <li key={idx} className="bg-red-950/60 border border-red-500/40 p-2.5 rounded-xl text-red-200 flex items-start gap-2">
                            <span className="text-red-400 font-bold">•</span> {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Situation Context */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                  <strong className="text-[#0056D2]">SITUATION CONTEXT: </strong>
                  {scenario.situation}
                </div>
              </div>

              {/* Interactive Multiple Choice Options */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#0056D2]" /> What is the correct response protocol?
                </h3>

                <div className="grid gap-3">
                  {scenario.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isAnswered = selectedOption !== null;

                    let btnStyle = "border-slate-200 bg-white hover:border-[#0056D2] hover:bg-blue-50/50 text-slate-800";
                    if (isAnswered) {
                      if (opt.isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-md scale-[1.01]";
                      } else if (isSelected && !opt.isCorrect) {
                        btnStyle = "border-red-500 bg-red-50 text-red-900 font-bold shadow-md";
                      } else {
                        btnStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <div key={opt.id} className="space-y-1">
                        <button
                          onClick={() => handleSelectOption(opt.id)}
                          disabled={isAnswered}
                          className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${btnStyle}`}
                        >
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isAnswered && opt.isCorrect
                              ? "bg-emerald-600 text-white"
                              : isAnswered && isSelected && !opt.isCorrect
                              ? "bg-red-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {opt.id}
                          </span>
                          <span className="leading-relaxed pt-0.5">{opt.text}</span>
                        </button>

                        {/* Interactive Option Specific Feedback */}
                        {isAnswered && (isSelected || opt.isCorrect) && (
                          <div className={`ml-10 p-2.5 rounded-xl text-xs font-medium leading-relaxed ${
                            opt.isCorrect ? "bg-emerald-100/70 text-emerald-900" : "bg-red-100/70 text-red-900"
                          }`}>
                            💡 <strong>{opt.isCorrect ? "Protocol Analysis" : "Why this choice fails"}:</strong> {opt.feedback}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instant Protocol & Execution Panel */}
              {selectedOption !== null && (
                <div className="space-y-6 pt-4 border-t border-slate-100 animate-fadeIn">
                  {/* Verdict Banner */}
                  <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                    scenario.options.find(o => o.id === selectedOption).isCorrect
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}>
                    {scenario.options.find(o => o.id === selectedOption).isCorrect ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-black text-base">
                        {scenario.options.find(o => o.id === selectedOption).isCorrect
                          ? `EXCELLENT DECISION! (${streak >= 2 ? "+15 PTS STREAK BONUS" : "+10 PTS"})`
                          : "INCORRECT RESPONSE — SECURITY RISK IDENTIFIED"}
                      </h4>
                      <p className="text-xs leading-relaxed font-medium">
                        {scenario.explanation.correctWhy}
                      </p>
                    </div>
                  </div>

                  {/* Required Protocol Steps */}
                  <div className="p-6 rounded-2xl bg-[#001E3C] text-white space-y-3">
                    <h4 className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> WHAT MUST BE DONE & HOW TO EXECUTE IT:
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line">
                      {scenario.explanation.protocol}
                    </p>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextScenario}
                      className="bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition flex items-center gap-2 text-xs sm:text-sm"
                    >
                      {currentIdx + 1 < THREAT_SCENARIOS.length ? (
                        <>Proceed to Next Threat Scenario <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>View Final Performance Report <Trophy className="w-4 h-4 text-amber-300" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* Final Score Summary & Certificate Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl space-y-8 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
              <Trophy className="w-10 h-10 text-amber-500" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-xs font-mono font-extrabold text-[#0056D2] uppercase tracking-widest block">
                THREAT DEFENSE CERTIFICATION
              </span>
              <h2 className="text-3xl font-black text-slate-900">
                {user.name || "Student Defender"}'s Score
              </h2>
              <div className="text-5xl font-black font-mono text-[#0056D2] pt-2">
                {score} <span className="text-xl text-slate-400 font-sans">PTS</span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm font-medium pt-2 leading-relaxed">
                {score >= 100
                  ? "EXPERT CYBER COMMANDER! Perfect streak execution across all 10 Ghanaian cybersecurity domains."
                  : score >= 70
                  ? "STRONG CYBER DEFENDER! Verified capability across mobile money, web phishing, and account protection."
                  : "SECURITY TRAINEE. Review execution protocols and retry the simulator to claim your verified certificate badge."}
              </p>
            </div>

            {/* Performance Grade Badge Card */}
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-[#001E3C] text-white space-y-3 border border-slate-800 text-left">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">CYBERGUARD GHANA ACCREDITATION</span>
                <span className="text-slate-400">VERIFIED USER</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <div>
                  <h4 className="font-extrabold text-sm">{user.name || user.email}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">National COP Defense Assessment</p>
                </div>
                <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-mono ${
                  score >= 100 ? "bg-emerald-500 text-white" : score >= 70 ? "bg-blue-600 text-white" : "bg-amber-600 text-white"
                }`}>
                  {score >= 100 ? "GRADE A+ (COMMANDER)" : score >= 70 ? "GRADE B (DEFENDER)" : "GRADE C (TRAINEE)"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleRestartSimulator}
                className="bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition flex items-center gap-2 text-xs"
              >
                <RotateCcw className="w-4 h-4" /> Restart Threat Simulator
              </button>

              <Link
                to="/courses"
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition flex items-center gap-2 text-xs"
              >
                <Award className="w-4 h-4 text-amber-400" /> Explore Accredited LMS Courses
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
