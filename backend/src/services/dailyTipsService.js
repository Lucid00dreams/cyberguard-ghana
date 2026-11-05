const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { sendDailySafetyTipEmail, resolveClientOrigin } = require("../utils/mailer");

const DEFAULT_TIMEZONE = process.env.DAILY_TIPS_TIMEZONE || "Africa/Accra";

/**
 * Curated 31-day rotation of practical CyberGuard Ghana safety tips
 * tailored for Ghanaian students, educators, parents, and young professionals.
 */
const DAILY_CYBER_TIPS = [
  {
    index: 1,
    category: "Mobile Money Security",
    title: "Never Approve an Unexpected MoMo USSD Prompt",
    summary:
      "Fraudsters can trigger a cash-out approval prompt to pop up on your phone right while calling you in a panic. Entering your 4-digit MoMo PIN on an unexpected popup authorizes money leaving your wallet.",
    actionStep:
      "Press Cancel immediately on any MoMo prompt you did not initiate yourself, hang up on urgent callers, and dial your official telecom USSD code independently to check your real balance.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 2,
    category: "WhatsApp & Social Privacy",
    title: "Lock Your WhatsApp with Two-Step Verification",
    summary:
      "SIM-swap and OTP-forwarding attacks hijack WhatsApp accounts when scammers trick victims into reading back a 6-digit registration code.",
    actionStep:
      "Open WhatsApp → Settings → Account → Two-step verification, and set a private 6-digit PIN that is completely different from your MoMo PIN.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 3,
    category: "Phishing Defense",
    title: "Inspect the Real Domain Before Entering Any Password",
    summary:
      "Fake login pages mimic government portals, banks, and scholarship forms using lookalike URLs such as 'csa-portal-gh.top' instead of official '.gov.gh' domains.",
    actionStep:
      "Read the domain name right before the first single forward slash (/). If it is unfamiliar or misspelled, close the tab and navigate manually via a trusted bookmark.",
    courseSlug: "phishing-detective",
  },
  {
    index: 4,
    category: "Account Security",
    title: "Upgrade Weak Passwords to 4-Word Passphrases",
    summary:
      "Short passwords using birthdays, phone numbers, or names can be guessed by automated cracking tools in seconds. Four random words strung together are vastly stronger and easier to remember.",
    actionStep:
      "Update your primary email password today using a memorable 4-word passphrase (for example, 'mango-kente-lagoon-lantern') that you do not reuse anywhere else.",
    courseSlug: "strong-passwords",
  },
  {
    index: 5,
    category: "Mobile Money Security",
    title: "Spot the 'Wrong Transfer' Reversal Trap",
    summary:
      "Scammers send a fake SMS from a personal mobile number pretending you received funds, then call begging for an urgent refund for a hospital emergency.",
    actionStep:
      "Check the sender ID of any deposit SMS and verify your actual wallet balance via official USSD. Direct genuine mistaken senders to call official telecom support on 100 for a reversal.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 6,
    category: "AI & Deepfake Awareness",
    title: "Create a Family Emergency Code Word Against Voice Clones",
    summary:
      "Modern AI tools can clone a relative's voice from a 10-second social media clip and place a convincing distress call asking for urgent Mobile Money.",
    actionStep:
      "Agree offline with your parents or siblings on a private code word to ask for before ever sending emergency money based on a phone call or voice note.",
    courseSlug: "ai-safety-deepfakes",
  },
  {
    index: 7,
    category: "Privacy & Protection",
    title: "Strip Location Clues Before Posting Photos Publicly",
    summary:
      "Photos taken at home, school, or hostels often reveal uniforms, street signs, or embedded GPS EXIF metadata that strangers can use to track your daily routine.",
    actionStep:
      "Turn off camera GPS location tagging in your phone settings and avoid posting real-time location stories until after you have left the venue.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 8,
    category: "Fraud Awareness",
    title: "Ignore Paid Exam-Upgrade and Admission Promises",
    summary:
      "Every exam season, Telegram and WhatsApp groups claim they can alter WASSCE grades or guarantee university placement for an upfront MoMo fee. Official databases cannot be edited by outsiders.",
    actionStep:
      "Block and report any account selling exam leaks or grade upgrades, and verify admissions strictly through official institutional portals.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 9,
    category: "Account Security",
    title: "Audit Devices Currently Logged Into Your Accounts",
    summary:
      "Shared school lab computers, cybercafés, or borrowed phones may still hold active sessions to your Google, Instagram, or WhatsApp Web accounts.",
    actionStep:
      "Check 'Linked Devices' in WhatsApp and 'Manage Devices' in your Google Account today, and sign out of any browser or device you no longer use.",
    courseSlug: "strong-passwords",
  },
  {
    index: 10,
    category: "Child Online Protection",
    title: "Never Pay Blackmailers — Preserve Evidence and Call 292",
    summary:
      "Online extortionists rely on fear and secrecy. Paying money never deletes files; it signals to the attacker to demand even more.",
    actionStep:
      "If threatened online, stop replying, take clear screenshots of usernames and numbers, block the account, and report confidentially via CyberGuard Ghana or toll-free on 292.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 11,
    category: "Phishing Defense",
    title: "Treat 'Account Suspended in 30 Minutes' Alerts as Red Flags",
    summary:
      "Manufactured panic is the #1 weapon in SMS and email phishing. Legitimate banks and telecom operators do not ask you to click shortened links to keep your account open.",
    actionStep:
      "Forward suspicious scam SMS messages to shortcode 419 and verify account status only inside the official app or customer care line.",
    courseSlug: "phishing-detective",
  },
  {
    index: 12,
    category: "Digital Citizenship",
    title: "Keep Personal Identifiers Out of Public Gaming Lobbies",
    summary:
      "Sharing your full name, school, phone number, or login tokens in gaming chats exposes you to account theft, harassment, and social engineering.",
    actionStep:
      "Use a neutral handle in public games and never click links promising free in-game currency, skins, or tournament rewards.",
    courseSlug: "online-gaming-safety",
  },
  {
    index: 13,
    category: "Device Hygiene",
    title: "Install Updates Promptly to Close Security Holes",
    summary:
      "Delayed phone and browser updates often contain critical patches for vulnerabilities that malicious websites actively exploit.",
    actionStep:
      "Open your phone and browser settings today and turn on automatic security updates over Wi-Fi.",
    courseSlug: "strong-passwords",
  },
  {
    index: 14,
    category: "Fraud Awareness",
    title: "Beware of Upfront 'Processing Fees' for Scholarships & Jobs",
    summary:
      "Genuine employers and accredited scholarship boards do not ask applicants to send MoMo fees for forms, medicals, or interview slots.",
    actionStep:
      "Verify recruitment notices on the organization's official website before submitting personal documents or ID numbers.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 15,
    category: "Privacy & Protection",
    title: "Protect Photos of Your Ghana Card and Student ID",
    summary:
      "Sending unredacted photos of national ID cards to unverified WhatsApp vendors or online forms fuels SIM registration fraud and identity impersonation.",
    actionStep:
      "Delete old ID card photos sitting in your chat media history and share identity documents only over verified institutional portals.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 16,
    category: "Account Security",
    title: "Prefer Authenticator Apps Over SMS Codes Where Possible",
    summary:
      "Authenticator apps generate offline 6-digit codes on your device that cannot be intercepted if your phone loses signal or suffers a SIM swap.",
    actionStep:
      "Enable an authenticator app (such as Google Authenticator or Ente Auth) on your primary email and social accounts.",
    courseSlug: "strong-passwords",
  },
  {
    index: 17,
    category: "Network Safety",
    title: "Avoid Sensitive Banking on Open Public Wi-Fi",
    summary:
      "Unencrypted public Wi-Fi hotspots can be spoofed with 'Evil Twin' names at cafés, campuses, or transport terminals to snoop on traffic.",
    actionStep:
      "Switch to mobile data before logging into financial accounts, and disable 'Auto-Join Open Networks' in your Wi-Fi settings.",
    courseSlug: "phishing-detective",
  },
  {
    index: 18,
    category: "Device Hygiene",
    title: "Never Sideload 'Cracked' or Modded APK Apps",
    summary:
      "Unofficial modded apps downloaded from Telegram channels or random links frequently bundle spyware that reads SMS OTPs and clipboard passwords.",
    actionStep:
      "Install apps exclusively from Google Play or the Apple App Store, and keep 'Install Unknown Apps' turned off.",
    courseSlug: "strong-passwords",
  },
  {
    index: 19,
    category: "Social Media Privacy",
    title: "Restrict Who Can Add You to WhatsApp & Telegram Groups",
    summary:
      "Scam investment rings and fake giveaways mass-add phone numbers into groups to harvest profiles and push fraudulent links.",
    actionStep:
      "Go to WhatsApp → Settings → Privacy → Groups, and change 'Who can add me to groups' from 'Everyone' to 'My Contacts'.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 20,
    category: "Fraud Awareness",
    title: "Verify Online Vendors Before Paying Delivery Deposits",
    summary:
      "Clone Instagram and TikTok shops steal product videos, demand 'commitment or delivery fees' via MoMo, and immediately block buyers.",
    actionStep:
      "Insist on payment-on-delivery in safe public locations for unfamiliar sellers, and reverse-search suspicious product photos.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 21,
    category: "Phishing Defense",
    title: "Preview QR Code Destinations Before Tapping Open",
    summary:
      "Attackers paste fraudulent QR stickers ('quishing') over legitimate posters to route scanners to credential-harvesting sites.",
    actionStep:
      "Read the full domain preview shown by your camera scanner before opening any QR link, and never enter passwords after scanning a public flyer.",
    courseSlug: "phishing-detective",
  },
  {
    index: 22,
    category: "Browser Safety",
    title: "Remove Unused Browser Extensions",
    summary:
      "Browser extensions with 'Read and change all your data on websites' permissions can silently capture session cookies and form inputs.",
    actionStep:
      "Open your browser's Extensions page today and uninstall any extension you do not recognize or actively rely on.",
    courseSlug: "phishing-detective",
  },
  {
    index: 23,
    category: "Data Resilience",
    title: "Follow the 3-2-1 Backup Rule for Schoolwork & Projects",
    summary:
      "Phone theft, hardware failure, or ransomware can wipe months of assignments and certificates in an instant if stored in only one place.",
    actionStep:
      "Back up your critical school folders to an encrypted cloud drive or external USB drive today.",
    courseSlug: "strong-passwords",
  },
  {
    index: 24,
    category: "AI & Deepfake Awareness",
    title: "Verify Sensational Videos Before Forwarding",
    summary:
      "Deepfake celebrity endorsements and manipulated news clips are widely used to promote fake crypto platforms and miracle giveaways.",
    actionStep:
      "Pause before forwarding viral giveaway clips; verify claims on accredited news outlets or official verified portals.",
    courseSlug: "ai-safety-deepfakes",
  },
  {
    index: 25,
    category: "Account Security",
    title: "Your Email Recovery Address Is Your Master Key",
    summary:
      "Every other account sends password reset links to your primary email. If your email lacks 2FA, every linked account can be reset by an intruder.",
    actionStep:
      "Confirm today that your primary email has 2FA enabled and an up-to-date recovery phone number.",
    courseSlug: "strong-passwords",
  },
  {
    index: 26,
    category: "Fraud Awareness",
    title: "Walk Away From 'Double Your Money in 24 Hours' Schemes",
    summary:
      "Ponzi and task-reward schemes pay tiny initial payouts to win trust before locking victims out once they deposit larger amounts.",
    actionStep:
      "Remember the rule: guaranteed high daily returns do not exist. Leave and report any group promising instant multiplication of funds.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 27,
    category: "Privacy & Protection",
    title: "Review App Permissions on Your Smartphone",
    summary:
      "A calculator, flashlight, or wallpaper app has no legitimate reason to access your contacts, microphone, or SMS inbox.",
    actionStep:
      "Open Settings → Privacy → Permission Manager on your phone and revoke Microphone, Contacts, and Location access from apps that don't need them.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 28,
    category: "Phishing Defense",
    title: "Check the Actual Sender Email Address, Not Just the Display Name",
    summary:
      "Anyone can set their email display name to 'Bank Support' or 'University Registrar' while sending from a free personal address.",
    actionStep:
      "Tap the sender's name at the top of unexpected emails to expand and verify the exact address after the '@' symbol.",
    courseSlug: "phishing-detective",
  },
  {
    index: 29,
    category: "Encrypted Communication",
    title: "Verify Safety Fingerprints for Sensitive Conversations",
    summary:
      "End-to-end encryption protects messages in transit, and safety fingerprints confirm nobody is impersonating your contact's key.",
    actionStep:
      "When chatting on CyberChat or Signal about sensitive matters, compare safety emojis or key fingerprints with your contact.",
    courseSlug: "social-media-privacy",
  },
  {
    index: 30,
    category: "Mobile Money Security",
    title: "Shield Your Keypad and Never Share Your MoMo PIN",
    summary:
      "Shoulder-surfing at busy kiosks and sharing PINs with agents to 'help type faster' are leading causes of unauthorized wallet withdrawals.",
    actionStep:
      "Always type your MoMo PIN yourself while shielding your screen, and change your PIN immediately if anyone else may have seen it.",
    courseSlug: "spot-the-scam",
  },
  {
    index: 31,
    category: "Digital Citizenship",
    title: "Run a Monthly Search on Your Own Name",
    summary:
      "Knowing what appears publicly when someone searches your name or handle helps you spot impersonation accounts or overshared personal details early.",
    actionStep:
      "Search your full name and username in an incognito browser tab today, and tighten privacy settings on any old public posts you find.",
    courseSlug: "online-gaming-safety",
  },
];

/**
 * Compute current calendar date & time components in Africa/Accra (GMT)
 */
function getZonedTimeParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  // Intl hour12:false can occasionally return "24" at midnight in some ICU builds
  const rawHour = parseInt(map.hour, 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = parseInt(map.minute, 10);

  const dateStr = `${map.year}-${map.month}-${map.day}`;

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const startOfYearUtc = Date.UTC(year, 0, 0);
  const currentUtc = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((currentUtc - startOfYearUtc) / (1000 * 60 * 60 * 24));

  return { dateStr, formattedDate, year, month, day, hour, minute, dayOfYear, timeZone };
}

/**
 * Deterministic daily tip selector based on day of year
 */
function getTipForDate(date = new Date()) {
  const { dayOfYear } = getZonedTimeParts(date);
  const idx = Math.abs(dayOfYear - 1) % DAILY_CYBER_TIPS.length;
  return DAILY_CYBER_TIPS[idx];
}

/**
 * Signed token for one-click email unsubscribe
 */
function createUnsubscribeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, purpose: "unsubscribe_daily_tips" },
    process.env.JWT_SECRET,
    { expiresIn: "90d" }
  );
}

function verifyUnsubscribeToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload || payload.purpose !== "unsubscribe_daily_tips" || !payload.id) {
    throw new Error("Invalid unsubscribe token.");
  }
  return payload;
}

function buildUnsubscribeUrl(user) {
  const resolvedFrontendOrigin = resolveClientOrigin();
  const apiPublicBase =
    process.env.PUBLIC_API_URL ||
    (resolvedFrontendOrigin && !resolvedFrontendOrigin.includes("localhost")
      ? resolvedFrontendOrigin
      : process.env.RENDER
      ? "https://cyberguard-ghana.onrender.com"
      : `http://localhost:${process.env.PORT || 4000}`);
  const token = createUnsubscribeToken(user);
  return `${apiPublicBase.replace(/\/$/, "")}/api/daily-tips/unsubscribe?token=${encodeURIComponent(token)}`;
}

let isDispatching = false;
let schedulerInterval = null;

/**
 * Dispatch the daily cyber safety tip to all opted-in users and log every email sent.
 * @param {Object} options
 * @param {"SCHEDULED_7AM" | "MANUAL_ADMIN"} options.triggerType
 * @param {boolean} options.force - When true, allows manual admin re-dispatch even if today's scheduled run already completed.
 */
async function dispatchDailySafetyTips({ triggerType = "SCHEDULED_7AM", force = false } = {}) {
  if (isDispatching) {
    return { skipped: true, reason: "A daily tips dispatch is already in progress." };
  }

  isDispatching = true;
  try {
    const now = new Date();
    const { dateStr, formattedDate } = getZonedTimeParts(now);

    if (!force && triggerType === "SCHEDULED_7AM") {
      const existingScheduled = await prisma.dailyTipDispatch.findFirst({
        where: {
          dispatchDate: dateStr,
          triggerType: "SCHEDULED_7AM",
        },
      });
      if (existingScheduled) {
        return {
          skipped: true,
          reason: `Scheduled 7:00 AM dispatch already completed for ${dateStr}.`,
          dispatchId: existingScheduled.id,
        };
      }
    }

    const tip = getTipForDate(now);
    const subject = `Daily Cyber Safety Tip: ${tip.title} — CyberGuard Ghana`;

    const subscribers = await prisma.user.findMany({
      where: { receiveDailyTips: true },
      select: { id: true, email: true, displayName: true },
      orderBy: { createdAt: "asc" },
    });

    const dispatchRecord = await prisma.dailyTipDispatch.create({
      data: {
        dispatchDate: dateStr,
        triggerType,
        tipIndex: tip.index,
        tipCategory: tip.category,
        tipTitle: tip.title,
        tipSummary: `${tip.summary} Action: ${tip.actionStep}`,
        subject,
        totalSubscribers: subscribers.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscribers) {
      if (!sub.email) continue;

      // Extra per-recipient idempotency guard for scheduled runs
      if (!force && triggerType === "SCHEDULED_7AM") {
        const alreadySentToday = await prisma.dailyTipEmailLog.findFirst({
          where: {
            dispatchDate: dateStr,
            recipientEmail: sub.email,
            status: "SENT",
            dispatch: { triggerType: "SCHEDULED_7AM" },
          },
        });
        if (alreadySentToday) continue;
      }

      const unsubscribeUrl = buildUnsubscribeUrl(sub);

      try {
        const info = await sendDailySafetyTipEmail({
          toEmail: sub.email,
          displayName: sub.displayName || "CyberGuard Member",
          tip,
          dateFormatted: formattedDate,
          unsubscribeUrl,
        });

        sentCount += 1;

        await prisma.dailyTipEmailLog.create({
          data: {
            dispatchId: dispatchRecord.id,
            dispatchDate: dateStr,
            userId: sub.id,
            recipientEmail: sub.email,
            recipientName: sub.displayName || "CyberGuard Member",
            tipTitle: tip.title,
            subject,
            status: "SENT",
            messageId: info?.messageId || null,
          },
        });
      } catch (mailErr) {
        failedCount += 1;
        console.error(`[DailyTips] Failed sending tip to ${sub.email}:`, mailErr.message);

        await prisma.dailyTipEmailLog.create({
          data: {
            dispatchId: dispatchRecord.id,
            dispatchDate: dateStr,
            userId: sub.id,
            recipientEmail: sub.email,
            recipientName: sub.displayName || "CyberGuard Member",
            tipTitle: tip.title,
            subject,
            status: "FAILED",
            errorMessage: mailErr.message || "SMTP delivery error",
          },
        });
      }
    }

    const updatedDispatch = await prisma.dailyTipDispatch.update({
      where: { id: dispatchRecord.id },
      data: {
        sentCount,
        failedCount,
        completedAt: new Date(),
      },
      include: {
        logs: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    console.log(
      `[DailyTips] Dispatch (${triggerType}) for ${dateStr} complete: ${sentCount} sent, ${failedCount} failed out of ${subscribers.length} subscribers.`
    );

    return {
      skipped: false,
      dispatch: updatedDispatch,
    };
  } finally {
    isDispatching = false;
  }
}

/**
 * Starts the automated background scheduler that dispatches cyber safety tips
 * every morning at 07:00 AM (Africa/Accra GMT).
 * Includes a 07:00–07:59 AM catch-up window in case the server restarts right at 7:00 AM.
 */
function startDailyTipsScheduler() {
  if (schedulerInterval) return;

  console.log(`[DailyTips] Automated 07:00 AM daily cyber safety tip scheduler active (Timezone: ${DEFAULT_TIMEZONE})`);

  const checkAndRun = async () => {
    try {
      const { hour } = getZonedTimeParts(new Date());
      if (hour === 7) {
        await dispatchDailySafetyTips({ triggerType: "SCHEDULED_7AM", force: false });
      }
    } catch (err) {
      console.error("[DailyTips] Scheduler check error:", err.message);
    }
  };

  // Run an initial check shortly after boot (catches 07:00-07:59 AM cold starts)
  setTimeout(checkAndRun, 5000);

  // Check every 30 seconds so 07:00 AM triggers right on the minute
  schedulerInterval = setInterval(checkAndRun, 30 * 1000);
  if (typeof schedulerInterval.unref === "function") {
    schedulerInterval.unref();
  }
}

module.exports = {
  DAILY_CYBER_TIPS,
  DEFAULT_TIMEZONE,
  getZonedTimeParts,
  getTipForDate,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  dispatchDailySafetyTips,
  startDailyTipsScheduler,
};
