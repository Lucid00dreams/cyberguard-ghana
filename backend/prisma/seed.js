const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  console.log("Seeding CyberGuard Ghana database with high-quality natural language courses...");

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  // Core Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@cyberguard.gh" },
    update: {},
    create: {
      email: "admin@cyberguard.gh",
      passwordHash,
      displayName: "Admin Account",
      role: "ADMIN",
      ageBand: "YOUNG_ADULT",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    },
  });

  await prisma.user.upsert({
    where: { email: "csa-officer@cyberguard.gh" },
    update: {},
    create: {
      email: "csa-officer@cyberguard.gh",
      passwordHash,
      displayName: "Kwame Mensah (CSA)",
      role: "CSA_OFFICER",
      ageBand: "YOUNG_ADULT",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    },
  });

  const tutorUser = await prisma.user.upsert({
    where: { email: "tutor@cyberguard.gh" },
    update: {},
    create: {
      email: "tutor@cyberguard.gh",
      passwordHash,
      displayName: "Ama Boateng",
      role: "TUTOR",
      ageBand: "YOUNG_ADULT",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
    },
  });

  await prisma.tutorProfile.upsert({
    where: { userId: tutorUser.id },
    update: {},
    create: {
      userId: tutorUser.id,
      headline: "Senior Cybersecurity Analyst & Youth Digital Safety Mentor",
      bio: "5+ years securing fintech infrastructure across Accra & Kumasi. Specializes in youth digital safety, anti-fraud defense, and emergency incident intervention.",
      specialties: ["Phishing awareness", "Password hygiene", "Mobile money security", "Cyberbullying intervention", "Sextortion legal reporting"],
      vetted: true,
      hourlyRateGHS: 0,
    },
  });

  // Clear existing course structure for clean re-seeding
  await prisma.quizAttempt.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.course.deleteMany({});

  // Helper function to seed a course
  async function createDetailedCourse({ title, slug, description, ageBand, category, coverImageUrl, modulesData }) {
    const course = await prisma.course.create({
      data: { title, slug, description, ageBand, category, isPublished: true, authorId: admin.id, coverImageUrl },
    });

    for (let mIdx = 0; mIdx < modulesData.length; mIdx++) {
      const mData = modulesData[mIdx];
      const module = await prisma.module.create({
        data: { title: mData.title, order: mIdx + 1, courseId: course.id },
      });

      for (let lIdx = 0; lIdx < mData.lessons.length; lIdx++) {
        const lData = mData.lessons[lIdx];
        const lesson = await prisma.lesson.create({
          data: {
            title: lData.title,
            type: lData.type || "TEXT",
            order: lIdx + 1,
            moduleId: module.id,
            textContent: lData.textContent || null,
          },
        });

        if (lData.type === "QUIZ" && lData.quiz) {
          const quiz = await prisma.quiz.create({
            data: { lessonId: lesson.id, passMarkPct: lData.quiz.passMarkPct || 70 },
          });

          for (let qIdx = 0; qIdx < lData.quiz.questions.length; qIdx++) {
            const q = lData.quiz.questions[qIdx];
            await prisma.quizQuestion.create({
              data: {
                quizId: quiz.id,
                prompt: q.prompt,
                options: q.options,
                correctIndex: q.correctIndex,
                order: qIdx + 1,
              },
            });
          }
        }
      }
    }
    return course;
  }

  // COURSE 1: Spot the Scam: Mobile Money Fraud 101
  await createDetailedCourse({
    title: "Spot the Scam: Mobile Money Fraud 101",
    slug: "spot-the-scam",
    description: "Master the art of recognizing MoMo scams, fake airtime promos, high-pressure impersonators, and SMS phishing targeting Ghanaian youth.",
    ageBand: "JUNIOR",
    category: "Fraud Awareness",
    coverImageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    modulesData: [
      {
        title: "Module 1: Social Engineering & MoMo Attacks",
        lessons: [
          {
            title: "Lesson 1: Understanding Social Engineering Tactics",
            type: "TEXT",
            textContent:
              "Understanding Social Engineering Tactics in Ghana\n\n" +
              "Social engineering relies on psychological manipulation rather than technical hacking alone. Instead of trying to breach a secured bank server directly, fraudsters manipulate human emotions such as panic, urgency, trust, or excitement.\n\n" +
              "Common Tactics Used by Fraudsters:\n" +
              "1. Artificial Urgency: Fraudsters will state that your account is about to be suspended within minutes unless you verify your PIN immediately.\n" +
              "2. Fake Promotions & Giveaways: Fraudsters claim you have won free airtime or cash prizes in an official-sounding telecommunications anniversary promo.\n" +
              "3. Authority Impersonation: Fraudsters pretend to be official customer service representatives, bank officers, or law enforcement officers.\n\n" +
              "Golden Rule of Defense:\n" +
              "No legitimate bank, mobile network operator, or government official will ever ask you for your 4-digit secret PIN or One-Time Password (OTP) over a phone call, SMS, or social media chat.",
          },
          {
            title: "Lesson 2: Deconstructing the Wrong Transfer Reversal Scam",
            type: "TEXT",
            textContent:
              "Deconstructing the Wrong Transfer Reversal Scam\n\n" +
              "How the Scheme Operates:\n" +
              "First, you receive a fake SMS formatted to resemble a genuine mobile money alert claiming that funds have been deposited into your account.\n" +
              "Shortly after, a distressed caller phones you claiming they sent money intended for a sick family member by mistake.\n" +
              "They press you to quickly enter your secret PIN or approve an incoming authorization popup to return the money.\n\n" +
              "Standard Verification Protocol:\n" +
              "Never enter your PIN or approve prompt requests during an active incoming phone call.\n" +
              "Check your actual mobile account balance independently using your official telecom USSD code.\n" +
              "Politely direct the caller to phone official customer service to initiate a standard reversal request.\n" +
              "Report the fraudulent sender number directly to official telecom shortcodes such as 419.",
          },
        ],
      },
      {
        title: "Module 2: Academic Scams & End Examination",
        lessons: [
          {
            title: "Lesson 3: Identifying Academic & Examination Scams",
            type: "TEXT",
            textContent:
              "Protecting Students from Academic & Examination Scams\n\n" +
              "During examination seasons, fraudsters target students and parents with deceptive promises on messaging channels.\n\n" +
              "Common Academic Scams Include:\n" +
              "Promises to upgrade examination grades in official databases for a cash fee.\n" +
              "Fake school placement assistance claiming guaranteed admission for a payment.\n" +
              "Unverified scholarship grants requiring upfront processing fees.\n\n" +
              "Key Fact to Remember:\n" +
              "Official examination databases cannot be modified by external third parties. Any individual demanding mobile money payment to upgrade grades is committing fraud.",
          },
          {
            title: "Lesson 4: Incident Response & Legal Reporting Protocols",
            type: "TEXT",
            textContent:
              "Incident Response & Emergency Action Protocols\n\n" +
              "If you suspect your mobile money account has been targeted or compromised:\n" +
              "Change your secret PIN immediately via your official telecom USSD code.\n" +
              "Contact customer support directly on 100 to request an immediate hold on fraudulent transfers.\n" +
              "Forward suspicious scam messages to official shortcode 419.\n" +
              "File an anonymous incident report on the CyberGuard Ghana portal to notify accredited Cyber Security Authority officers under Act 1038.",
          },
          {
            title: "Lesson 5: End-of-Course Comprehensive Assessment",
            type: "QUIZ",
            quiz: {
              passMarkPct: 70,
              questions: [
                {
                  prompt: "Someone calls claiming to be customer support and asks for your secret PIN to unblock your account. What is the correct response?",
                  options: [
                    "Provide the PIN right away",
                    "Hang up, never share your PIN, and report the number",
                    "Ask them to call back later",
                    "Share your PIN over WhatsApp",
                  ],
                  correctIndex: 1,
                },
                {
                  prompt: "A caller claims they transferred money to your account by mistake and asks for an instant refund. You should:",
                  options: [
                    "Send money back immediately",
                    "Independently check your balance and direct them to official customer support",
                    "Give them your PIN",
                    "Ignore telecom safety guidelines",
                  ],
                  correctIndex: 1,
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // COURSE 2: Social Media Privacy & Cyberbullying Protection
  await createDetailedCourse({
    title: "Social Media Privacy & Cyberbullying Protection",
    slug: "social-media-privacy",
    description: "Learn how to lock down Instagram, TikTok, and WhatsApp settings, stop digital blackmail, and report online abuse under Ghana's Cybersecurity Act 2020.",
    ageBand: "JUNIOR",
    category: "Privacy & Protection",
    coverImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    modulesData: [
      {
        title: "Module 1: Digital Footprint & Location Privacy",
        lessons: [
          {
            title: "Lesson 1: Understanding Digital Footprints & EXIF Metadata",
            type: "TEXT",
            textContent:
              "Understanding Digital Footprints & Embedded Photo Metadata\n\n" +
              "Whenever you capture and share a photograph using a mobile device, metadata known as EXIF data is automatically generated. This embedded information can include exact GPS location coordinates, device manufacturer, timestamp, and camera parameters.\n\n" +
              "The Risks of Unchecked Sharing:\n" +
              "Posting unedited photographs taken inside your residential home, school, or routine locations enables unknown individuals to identify your physical coordinates.\n\n" +
              "Recommended Safety Measures:\n" +
              "Disable location services for camera applications when not needed.\n" +
              "Utilize privacy-aware platforms or evidence tools that strip metadata prior to public uploads.",
          },
          {
            title: "Lesson 2: Securing Social Media & Messaging Applications",
            type: "TEXT",
            textContent:
              "Securing Social Media & Messaging Applications\n\n" +
              "Essential Privacy Configuration Checklist:\n" +
              "1. Enable Two-Factor Authentication on messaging accounts to require a secondary security PIN.\n" +
              "2. Restrict Profile Metadata visibility (such as Last Seen and Profile Picture) to verified contacts only.\n" +
              "3. Adjust group invitation settings so strangers cannot add you to public groups without your consent.\n" +
              "4. Set personal social network accounts to private status to prevent unknown users from saving or downloading your media content.",
          },
        ],
      },
      {
        title: "Module 2: Sextortion Defense & Legal Rights",
        lessons: [
          {
            title: "Lesson 3: Responding to Online Blackmail & Sextortion",
            type: "TEXT",
            textContent:
              "Responding to Online Blackmail & Extortion Schemes\n\n" +
              "Extortionists rely on psychological panic, fear, and secrecy to manipulate targets into sending money or sensitive images.\n\n" +
              "Core Response Guidelines:\n" +
              "Do Not Pay: Yielding to financial demands will not end extortion; demands will escalate.\n" +
              "Preserve Evidence: Capture clear screenshots of all account handles, phone numbers, and message strings.\n" +
              "Block Perpetrators: Block the perpetrator on all communication channels immediately.\n" +
              "Access Assistance: Submit a confidential report on CyberGuard Ghana for officer assistance under Act 1038.",
          },
          {
            title: "Lesson 4: Legal Protections Under Ghana's Cybersecurity Act 2020",
            type: "TEXT",
            textContent:
              "Legal Protections Under Ghana's Cybersecurity Act 2020 (Act 1038)\n\n" +
              "Under Sections 66 through 69 of Act 1038:\n" +
              "The non-consensual distribution of intimate images is classified as a severe criminal offense carrying custodial sentences of 5 to 10 years imprisonment.\n" +
              "Cyberbullying, severe online harassment, and digital stalking targeting minors are strictly prosecuted.\n" +
              "Victims are entitled to full protection and support under the National Child Online Protection (COP) Framework.",
          },
          {
            title: "Lesson 5: End-of-Course Comprehensive Assessment",
            type: "QUIZ",
            quiz: {
              passMarkPct: 70,
              questions: [
                {
                  prompt: "If an individual online threatens to share sensitive photos unless money is sent, what is the correct immediate action?",
                  options: [
                    "Pay the money right away",
                    "Capture screenshots as evidence, do not pay, block the individual, and report to CyberGuard/CSA",
                    "Delete all your social media apps without saving evidence",
                    "Send additional photos",
                  ],
                  correctIndex: 1,
                },
                {
                  prompt: "What embedded metadata in mobile photos can reveal exact location coordinates?",
                  options: ["Audio tracks", "EXIF GPS location metadata", "HTML files", "App permissions"],
                  correctIndex: 1,
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // COURSE 3: AI Safety, Deepfakes & Voice Cloning
  await createDetailedCourse({
    title: "AI Safety, Deepfakes & Voice Cloning Defense",
    slug: "ai-safety-deepfakes",
    description: "Learn how generative AI audio clones and deepfake videos work, and how to protect yourself and family against synthetic identity fraud.",
    ageBand: "YOUNG_ADULT",
    category: "AI & Future Tech",
    coverImageUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
    modulesData: [
      {
        title: "Module 1: Generative AI Threat Landscape",
        lessons: [
          {
            title: "Lesson 1: Introduction to Generative AI & Voice Synthetic Media",
            type: "TEXT",
            textContent:
              "Introduction to Generative AI & Voice Synthetic Media\n\n" +
              "Modern Artificial Intelligence algorithms can synthesize human speech and generate realistic voice clones using short audio samples extracted from public video clips or phone calls.\n\n" +
              "How Voice Cloning is Misused:\n" +
              "Fraudsters place emergency calls to relatives using a synthesized voice, claiming that a family member has been involved in an accident or emergency and requesting an immediate financial transfer.",
          },
          {
            title: "Lesson 2: Spotting Visual Artifacts & Audio Anomalies",
            type: "TEXT",
            textContent:
              "Spotting Visual Artifacts & Audio Anomalies\n\n" +
              "Indicators of Synthetic Media:\n" +
              "Irregular Eye Blinking: Synthetic video faces often display unnatural or inconsistent blinking patterns.\n" +
              "Unnatural Speech Cadence: Synthetic audio may lack natural breathing pauses, inflection, or ambient acoustic room resonance.\n" +
              "Lip-Sync & Lighting Discrepancies: Facial shadows and lip movements may blur during rapid speech motion.",
          },
        ],
      },
      {
        title: "Module 2: Verification Protocols & End Examination",
        lessons: [
          {
            title: "Lesson 3: Establishing Secret Family Code Words",
            type: "TEXT",
            textContent:
              "Establishing Secret Family Code Words\n\n" +
              "Preventative Family Safety Protocol:\n" +
              "Establish a confidential phrase or code word known only to your family members.\n\n" +
              "If you receive an urgent call claiming a relative requires immediate funds due to an emergency, request the secret code word before taking any action or initiating financial transfers.",
          },
          {
            title: "Lesson 4: AI Safety Hygiene & Verification Standards",
            type: "TEXT",
            textContent:
              "AI Safety Hygiene & Media Verification Standards\n\n" +
              "Responsible Usage Guidelines:\n" +
              "Avoid uploading personal or sensitive photographs to unverified third-party AI image generators.\n" +
              "Cross-check sensational or unverified broadcast videos against accredited news outlets prior to sharing online.",
          },
          {
            title: "Lesson 5: End-of-Course Comprehensive Assessment",
            type: "QUIZ",
            quiz: {
              passMarkPct: 70,
              questions: [
                {
                  prompt: "You receive an urgent call sounding like a relative asking for an immediate money transfer. What is the safest step?",
                  options: [
                    "Send money immediately",
                    "Request your secret family code word or call their known primary phone number directly",
                    "Post on social media",
                    "Give them your bank credentials",
                  ],
                  correctIndex: 1,
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // COURSE 4: Strong Passwords, Passphrases & 2FA Masterclass
  await createDetailedCourse({
    title: "Strong Passwords, Passphrases & 2FA Masterclass",
    slug: "strong-passwords",
    description: "Build unbreakable digital fortresses using passphrases, open-source password managers, and multi-factor authentication.",
    ageBand: "JUNIOR",
    category: "Account Security",
    coverImageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80",
    modulesData: [
      {
        title: "Module 1: Password Cracking Mechanics",
        lessons: [
          {
            title: "Lesson 1: Why Short & Predictable Passwords Fail",
            type: "TEXT",
            textContent:
              "Why Short & Predictable Passwords Fail\n\n" +
              "Automated cracking software can test millions of password combinations per second using dictionary lists of frequently used words and predictable number patterns.\n\n" +
              "Predictable Patterns to Avoid:\n" +
              "Single words, names of sports teams, or educational institutions.\n" +
              "Simple character substitutions such as replacing 'a' with '@'.\n" +
              "Dates of birth, personal phone numbers, or sequential numbers.",
          },
          {
            title: "Lesson 2: The Power of 4-Random-Word Passphrases",
            type: "TEXT",
            textContent:
              "The Power of 4-Random-Word Passphrases\n\n" +
              "The Passphrase Strategy:\n" +
              "Instead of complex short passwords that are difficult to remember, combine four random words into a single passphrase.\n\n" +
              "Example: mango-kente-trotro-castle\n\n" +
              "This format provides high cryptographic entropy, making automated guessing extremely difficult while remaining straightforward for users to recall.",
          },
        ],
      },
      {
        title: "Module 2: Multi-Factor Authentication & Examination",
        lessons: [
          {
            title: "Lesson 3: Implementing Two-Factor Authentication (2FA)",
            type: "TEXT",
            textContent:
              "Implementing Two-Factor Authentication (2FA)\n\n" +
              "What Two-Factor Authentication Accomplishes:\n" +
              "2FA requires two independent factors to grant account access:\n" +
              "1. Knowledge Factor: Your secret passphrase.\n" +
              "2. Possession Factor: A dynamic code generated by an authenticator application or SMS OTP.\n\n" +
              "Even if a password is breached, unauthorized access is prevented without the secondary physical factor.",
          },
          {
            title: "Lesson 4: Password Manager Hygiene & Secure Storage",
            type: "TEXT",
            textContent:
              "Password Manager Hygiene & Secure Storage\n\n" +
              "Using Dedicated Password Managers:\n" +
              "Employ reputable password management software to create and store unique, complex passwords for every individual service you use.",
          },
          {
            title: "Lesson 5: End-of-Course Comprehensive Assessment",
            type: "QUIZ",
            quiz: {
              passMarkPct: 70,
              questions: [
                {
                  prompt: "Which format provides a strong and memorable account credential?",
                  options: [
                    "123456",
                    "A 4-random-word passphrase like 'mango-kente-trotro-castle'",
                    "Your birth date",
                    "The word 'password'",
                  ],
                  correctIndex: 1,
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // COURSE 5: Phishing Detective: Inspecting Links
  await createDetailedCourse({
    title: "Phishing Detective: Inspecting Links & Typosquatting",
    slug: "phishing-detective",
    description: "Develop keen eyes for suspicious email headers, typosquatting domain names, and deceptive web portals.",
    ageBand: "YOUNG_ADULT",
    category: "Threat Detection",
    coverImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    modulesData: [
      {
        title: "Module 1: URL Inspection Skills",
        lessons: [
          {
            title: "Lesson 1: Deconstructing Domain Names & Web Addresses",
            type: "TEXT",
            textContent:
              "Deconstructing Domain Names & Web Addresses\n\n" +
              "Understanding Web URL Anatomy:\n" +
              "The primary destination domain is positioned directly before the primary domain extension (.com, .org, or .gov.gh).\n\n" +
              "Comparing Legitimate vs Deceptive Links:\n" +
              "Legitimate Domain: https://csa.gov.gh\n" +
              "Deceptive Link: https://csa-portal-verify.top",
          },
          {
            title: "Lesson 2: Identifying Typosquatting & Visual Spoofing",
            type: "TEXT",
            textContent:
              "Identifying Typosquatting & Visual Spoofing\n\n" +
              "Common Character Substitution Techniques:\n" +
              "Replacing similar characters (such as substituting 'r' and 'n' together to resemble 'm').\n" +
              "Replacing letters with numbers (such as using zero '0' in place of 'o').",
          },
        ],
      },
      {
        title: "Module 2: Inspection Protocols & End Examination",
        lessons: [
          {
            title: "Lesson 3: Inspecting Email Headers & Sender Authenticity",
            type: "TEXT",
            textContent:
              "Inspecting Email Headers & Sender Authenticity\n\n" +
              "Verification Steps:\n" +
              "Always review the exact domain address following the '@' symbol in incoming email headers to confirm sender legitimacy.",
          },
          {
            title: "Lesson 4: Safe Browsing & Link Verification Protocols",
            type: "TEXT",
            textContent:
              "Safe Browsing & Link Verification Protocols\n\n" +
              "Best Practices:\n" +
              "Hover over links to review full web addresses before clicking.\n" +
              "Use secure threat simulators to evaluate unknown links safely.",
          },
          {
            title: "Lesson 5: End-of-Course Comprehensive Assessment",
            type: "QUIZ",
            quiz: {
              passMarkPct: 70,
              questions: [
                {
                  prompt: "Which domain structure represents an official government domain for Ghana's Cyber Security Authority?",
                  options: [
                    "csa-verify-login.xyz",
                    "csa.gov.gh",
                    "csa-ghana.top",
                    "free-csa-bonus.info",
                  ],
                  correctIndex: 1,
                },
              ],
            },
          },
        ],
      },
    ],
  });

  // COURSE 6: Online Gaming Safety & Digital Reputation
  await createDetailedCourse({
    title: "Online Gaming Safety & Digital Reputation",
    slug: "online-gaming-safety",
    description: "Protect your gaming accounts, avoid in-game item scams, and build a positive digital brand for career growth.",
    ageBand: "JUNIOR",
    category: "Digital Citizenship",
    coverImageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    modulesData: [
      {
        title: "Module 1: Gaming Account Security & Item Scams",
        lessons: [
          {
            title: "Lesson 1: Recognizing In-Game Currency & Account Fraud",
            type: "TEXT",
            textContent:
              "Recognizing In-Game Currency & Account Fraud\n\n" +
              "Common Gaming Scams:\n" +
              "Deceptive promotions offering free in-game currency or items in exchange for account credentials or authorization tokens.",
          },
          {
            title: "Lesson 2: Protecting Personal Identifiers in Game Lobbies",
            type: "TEXT",
            textContent:
              "Protecting Personal Identifiers in Game Lobbies\n\n" +
              "Privacy Guidelines for Online Lobbies:\n" +
              "Avoid disclosing your real name, phone number, or school name in public gaming channels.",
          },
        ],
      },
      {
        title: "Module 2: Digital Reputation & End Examination",
        lessons: [
          {
            title: "Lesson 3: Managing Online Harassment & Toxic Conduct",
            type: "TEXT",
            textContent:
              "Managing Online Harassment & Toxic Conduct\n\n" +
              "Handling Disruptive Behavior:\n" +
              "Utilize built-in mute, block, and report functionality to handle toxic conduct in online lobbies.",
          },
          {
            title: "Lesson 4: Building a Positive Digital Reputation",
            type: "TEXT",
            textContent:
              "Building a Positive Digital Reputation\n\n" +
              "Long-Term Digital Footprint:\n" +
              "Maintain a constructive digital footprint by showcasing achievements, verified safety credentials, and community participation.",
          },
          {
            title: "Lesson 5: End-of-Course Comprehensive Assessment",
            type: "QUIZ",
            quiz: {
              passMarkPct: 70,
              questions: [
                {
                  prompt: "What is the recommended method to address toxic harassment in an online game?",
                  options: [
                    "Respond with abusive language",
                    "Use built-in Mute, Block, and Report functions",
                    "Share personal contact info",
                    "Share account passwords",
                  ],
                  correctIndex: 1,
                },
              ],
            },
          },
        ],
      },
    ],
  });

  console.log("Database successfully seeded with clean, high-quality, non-markdown natural language courses!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
