const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

/**
 * System Instruction for Google Gemini AI grounding CyberGod in CyberGuard Ghana
 */
const CYBERGOD_SYSTEM_INSTRUCTION = `You are CyberGod 🤖, the intelligent, friendly, and expert AI Cybersecurity Guardian for CyberGuard Ghana (cyberguard.gh).
Your mission is to protect, educate, and empower Ghanaian students, teens, young adults, parents, and educators under the Ghana Cybersecurity Act, 2020 (Act 1038).

CRITICAL CONVERSATIONAL & NATURAL LANGUAGE INSTRUCTIONS:
1. UNDERSTAND NATURAL LANGUAGE & INTENT:
   - Speak naturally, warmly, and conversationally like an empathetic human mentor, not a robotic manual.
   - For simple greetings, pleasantries, or casual messages (e.g. "hello", "hi", "hey", "good morning", "how are you", "what's up"): Reply briefly and warmly in 1 to 2 sentences (e.g., "Hello! 👋 Great to see you. How can I help you stay safe online or explore CyberGuard today?").
   - NEVER output long essays, lists of features, or unsolicited platform overviews for simple greetings.
   - Proportional responses: Match the depth of the user's prompt. If they ask a quick question, provide a concise answer. Only provide step-by-step guides or bullet points when specifically asked for details, help, or explanations.

2. CORE PLATFORM KNOWLEDGE (Use when relevant to the user's query):
   - Courses & Certificates: Junior (12–18) and Young Adult (19–23) tracks. Students complete 100% of lessons and pass quizzes to unlock official Act 1038 accredited A4 Landscape Certificates (exportable as high-res PDF or PNG).
   - Phishing & MoMo Defense: Phishing simulator for SMS/email/WhatsApp. 4 Golden Rules of MoMo: Never share 4-digit PIN; never manually reverse accidental transfers (let telco handle it); ignore fee-upfront promos; test suspicious links in simulator.
   - Confidential Incident Reporting: Zero-knowledge reporting portal for blackmail, sextortion, cyberbullying, or fraud. SHA-256 cryptographic hashing of evidence with zero IP tracking. Reviewed directly by Cyber Security Authority (CSA) officers.
   - 24/7 Emergency Contacts: CSA Hotline 292 (Call/SMS), CSA WhatsApp 050 184 0000, Police Cyber Emergency 992.
   - 1-on-1 Mentorship: Free private video consultations with vetted Ghanaian cyber tutors and professionals.
   - Ghana Cybersecurity Act, 2020 (Act 1038): Framework for Child Online Protection (COP) and prosecution of digital offenses.

3. TONE & FORMATTING:
   - Friendly, protective, culturally relevant to Ghana, and easy to read.
   - When answering complex technical or safety questions, use clear Markdown formatting (bullet points, bold text). Keep paragraphs digestible.`;

/**
 * Deterministic Fallback Knowledge Base (Active if Gemini key is missing or quota is reached)
 */
function getDeterministicFallback(prompt, user) {
  const query = prompt.toLowerCase().trim();
  const cleanQuery = query.replace(/[!?.,;]/g, "");

  // Natural language greetings
  const greetings = ["hi", "hello", "hey", "good day", "good morning", "good afternoon", "good evening", "yo", "sup", "greetings"];
  if (greetings.includes(cleanQuery) || cleanQuery.startsWith("hello") || cleanQuery.startsWith("hi ") || cleanQuery.startsWith("hey ")) {
    return `Hello ${user?.displayName || "there"}! 👋 Great to connect with you. How can I help you with your online safety or the CyberGuard platform today?`;
  }

  if (query.includes("how are you") || query.includes("how r u")) {
    return `I'm doing great and standing guard 24/7, ${user?.displayName || "friend"}! 🛡️ How can I assist you today?`;
  }

  if (query.includes("certificate") || query.includes("cert") || query.includes("diploma")) {
    return `### 📜 CyberGuard Accredited Certificates

To earn your official **CyberGuard Ghana Landscape Certificate**:
1. **Enroll in a Course**: Select an age-banded curriculum (Junior: Ages 12–18 or Young Adult: Ages 19–23).
2. **Complete 100% Progress**: Go through all interactive video and text modules.
3. **Pass the Quiz Challenge**: Achieve the required passing score on the module quiz.

Once completed, your **A4 Landscape Certificate** automatically unlocks on both the Course page and your **Dashboard** (exportable as PDF or PNG).`;
  }

  if (query.includes("momo") || query.includes("mobile money") || query.includes("mtn") || query.includes("telecel") || query.includes("at money") || query.includes("scam") || query.includes("pin")) {
    return `### 🛡️ Mobile Money (MoMo) Anti-Fraud Protocol

MoMo fraud is one of the most common threats in Ghana. Here are **CyberGod's 4 Golden Rules**:

1. **Never Share Your PIN**: Neither MTN, Telecel, AT, nor CyberGuard will EVER ask for your 4-digit PIN.
2. **Beware Fake Cash Reversals**: If someone calls claiming an accidental transfer, **do not send it back**. Tell them to contact their telecom service center.
3. **Ignore Promos Asking for Money**: Legitimate lottery or reward promos never require you to send airtime or cash first.
4. **Use Our Phishing Simulator**: Test suspicious messages in the **Phishing Simulator** tab to assess danger.`;
  }

  if (query.includes("report") || query.includes("sextortion") || query.includes("blackmail") || query.includes("bully") || query.includes("harass") || query.includes("csa")) {
    return `### 🚨 Emergency Incident & Confidential Reporting

If you or someone you know is experiencing **sextortion, cyberbullying, or online blackmail**:

1. **Zero-Knowledge Evidence Hashing**: Submit a report on our **Confidential Report** page. Uploaded evidence is hashed with SHA-256 with zero identity tracking.
2. **Direct CSA Officer Review**: Incident reports are reviewed directly by accredited **Cyber Security Authority (CSA)** officers under Act 1038.
3. **Emergency Contacts**:
   - **CSA Hotline**: 292 (Call or SMS)
   - **CSA WhatsApp**: 050 184 0000
   - **Police Cyber Emergency**: 992

*You are safe here — we treat every report with absolute confidentiality.*`;
  }

  if (query.includes("tutor") || query.includes("mentor") || query.includes("consult") || query.includes("book")) {
    return `### 👨‍💻 Vetted 1-on-1 Cybersecurity Mentors

CyberGuard Ghana provides free 1-on-1 video consultations with verified cybersecurity professionals:
- **Browse Mentors**: Click **Mentors** in the top navigation bar.
- **Filter by Specialty**: Choose experts in Phishing Defense, MoMo Fraud, Sextortion Intervention, or Career Guidance.
- **Book a Session**: Pick a free available slot to join an encrypted private video room.`;
  }

  if (query.includes("act 1038") || query.includes("law") || query.includes("legal") || query.includes("authority")) {
    return `### ⚖️ Ghana Cybersecurity Act, 2020 (Act 1038)

CyberGuard Ghana operates in accordance with **Act 1038**:
- **Child Online Protection (COP)**: Mandates national frameworks to protect minors and youth from digital harms.
- **Cybercrime Offenses**: Criminalizes unauthorized access, online blackmail, identity theft, and non-consensual image sharing.
- **Evidence Integrity**: Supports cryptographic evidence hashing for lawful investigation.`;
  }

  if (query.includes("password") || query.includes("login") || query.includes("auth") || query.includes("2fa") || query.includes("mfa")) {
    return `### 🔐 Password & 2FA Best Practices

1. **Use Strong Passphrases**: 12+ characters combining upper, lowercase, numbers, and symbols.
2. **Enable 2FA**: Activate two-factor authentication on WhatsApp, Instagram, Gmail, and banking apps.
3. **Never Reuse Passwords**: Keep distinct passwords for critical services.`;
  }

  if (query.includes("who are you") || query.includes("what can you do") || query.includes("cybergod")) {
    return `I am **CyberGod** 🤖, your AI Cybersecurity Guardian for CyberGuard Ghana!

I can help you with:
- 📚 Navigating courses & earning accredited certificates
- 🛡️ Spotting MoMo scams, phishing SMS, and fake calls
- 🚨 Submitting confidential incident reports to CSA
- 👨‍💻 Booking free 1-on-1 sessions with cyber mentors

What would you like to explore today?`;
  }

  return `Thanks for reaching out! I'm here to help with any cyber safety questions, MoMo fraud advice, or exploring the CyberGuard Ghana platform. What specific topic would you like assistance with?`;
}

// Global cached client instance
let cachedGenAI = null;
let lastUsedApiKey = null;

function getGenAIClient(apiKey) {
  if (!cachedGenAI || lastUsedApiKey !== apiKey) {
    cachedGenAI = new GoogleGenerativeAI(apiKey);
    lastUsedApiKey = apiKey;
  }
  return cachedGenAI;
}

/**
 * Primary AI Generator with Google Gemini & Automatic Local Fallback
 * Prioritizes ultra-fast 'gemini-3.5-flash-lite' (<1s latency)
 */
async function generateCyberGodResponse(prompt, user, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() && apiKey.trim() !== "your_gemini_api_key_here") {
    // Ultra-fast model first (gemini-3.5-flash-lite responds in ~700ms), fallback to 3.1-flash-lite or 3.5-flash
    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
    const genAI = getGenAIClient(apiKey.trim());

    // Build conversation history for Gemini chat (roles must alternate: user, model...)
    const cleanHistory = [];
    const recentHistory = history.slice(-6);

    for (const msg of recentHistory) {
      if (!msg.content || !msg.content.trim()) continue;
      const role = msg.sender === "cybergod" ? "model" : "user";

      if (cleanHistory.length === 0 && role !== "user") {
        continue; // First history turn in Gemini must be from 'user'
      }

      if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === role) {
        cleanHistory[cleanHistory.length - 1].parts[0].text += `\n${msg.content.trim()}`;
      } else {
        cleanHistory.push({
          role,
          parts: [{ text: msg.content.trim() }],
        });
      }
    }

    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
      cleanHistory.pop();
    }

    const userName = user?.displayName ? ` (talking with ${user.displayName})` : "";
    const systemPromptWithUser = `${CYBERGOD_SYSTEM_INSTRUCTION}${userName ? `\nUser Name: ${user.displayName}` : ""}`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPromptWithUser,
        });

        const chat = model.startChat({
          history: cleanHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        });

        const result = await chat.sendMessage(prompt.trim());
        const text = result?.response?.text();

        if (text && text.trim()) {
          return text.trim();
        }
      } catch (apiErr) {
        console.warn(`⚠️ Gemini model [${modelName}] warning:`, apiErr?.message || apiErr);
      }
    }
  }

  // Graceful fallback to deterministic local knowledge base
  return getDeterministicFallback(prompt, user);
}

// GET: List all chat sessions for the logged in user
router.get("/sessions", requireAuth, async (req, res, next) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// POST: Create a new chat session
router.post("/sessions", requireAuth, async (req, res, next) => {
  try {
    const { title } = req.body;
    const session = await prisma.chatSession.create({
      data: {
        userId: req.user.id,
        title: title || "New CyberGod Session",
        messages: {
          create: {
            sender: "cybergod",
            content: `Greetings ${req.user.displayName || "Guardian"}! I am **CyberGod** 🤖, your AI Cybersecurity Guardian. Ask me anything about cyber safety, MoMo scam defense, course certificates, or platform guidance!`,
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

// GET: Fetch a single chat session with all messages
router.get("/sessions/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sessionId, userId: req.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Chat session not found." });
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
});

// DELETE: Delete a chat session
router.delete("/sessions/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    await prisma.chatSession.delete({ where: { id: session.id } });
    res.json({ success: true, message: "Chat session deleted." });
  } catch (err) {
    next(err);
  }
});

// POST: Send message to CyberGod in a session
router.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: req.user.id },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: req.user.id,
          title: message.trim().substring(0, 35) + (message.length > 35 ? "…" : ""),
        },
      });
    } else if (session.title === "New CyberGod Session") {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { title: message.trim().substring(0, 35) + (message.length > 35 ? "…" : "") },
      });
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: "user",
        content: message.trim(),
      },
    });

    // Fetch message history for context
    const history = await prisma.chatMessage.findMany({
      where: { chatSessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Generate CyberGod AI response (via Gemini or fallback)
    const botResponseText = await generateCyberGodResponse(message, req.user, history);

    // Save CyberGod AI response
    const botMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: "cybergod",
        content: botResponseText,
      },
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    res.json({
      sessionId: session.id,
      userMessage,
      botMessage,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
