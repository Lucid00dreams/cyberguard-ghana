const nodemailer = require("nodemailer");

let lastKnownClientOrigin = null;

const ALLOWED_VERCEL_ORIGIN_REGEX = /^https:\/\/cyberguard-ghana(-[a-z0-9-]+)?\.vercel\.app$/i;

function getConfiguredOrigins() {
  return (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/**
 * Validates whether an origin string is an explicitly trusted CyberGuard frontend origin.
 * Prevents Host/Origin header poisoning and SSRF/credential exfiltration via untrusted origins.
 */
function isTrustedClientOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  const cleaned = origin.trim().replace(/\/$/, "");
  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    return false;
  }

  if (parsed.origin !== cleaned) return false;

  const configured = getConfiguredOrigins();
  if (configured.includes(cleaned)) return true;

  if (ALLOWED_VERCEL_ORIGIN_REGEX.test(cleaned)) return true;

  if (
    process.env.NODE_ENV !== "production" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  ) {
    return true;
  }

  return false;
}

/**
 * Escapes user-supplied strings before interpolating into HTML email bodies.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Record a trusted live frontend origin (e.g. https://cyberguard-ghana.vercel.app)
 * so email links and the HTTPS mail relay resolve accurately even when
 * CLIENT_ORIGIN falls back to localhost.
 */
function setClientOriginHint(origin) {
  if (!isTrustedClientOrigin(origin)) return;
  const cleaned = origin.trim().replace(/\/$/, "");
  if (
    cleaned.startsWith("https://") &&
    !cleaned.includes("localhost") &&
    !cleaned.includes("127.0.0.1")
  ) {
    lastKnownClientOrigin = cleaned;
  }
}

function resolveClientOrigin(explicitOrigin) {
  if (explicitOrigin && isTrustedClientOrigin(explicitOrigin)) {
    const cleaned = explicitOrigin.trim().replace(/\/$/, "");
    setClientOriginHint(cleaned);
    if (!cleaned.includes("localhost") || process.env.NODE_ENV !== "production") {
      return cleaned;
    }
  }

  const envOrigin = getConfiguredOrigins()[0] || "";

  if (envOrigin && !envOrigin.includes("localhost") && !envOrigin.includes("127.0.0.1")) {
    return envOrigin;
  }

  if (lastKnownClientOrigin && isTrustedClientOrigin(lastKnownClientOrigin)) {
    return lastKnownClientOrigin;
  }

  return envOrigin || "https://cyberguard-ghana.vercel.app";
}

// Create reusable SMTP transporter using Gmail / custom SMTP
const smtpUser = (process.env.SMTP_USER || "cyberguardgh@gmail.com").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false", // true for 465, false for other ports
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 12000,
  auth: smtpPass
    ? {
        user: smtpUser,
        pass: smtpPass,
      }
    : undefined,
});

/**
 * Dispatch an email via the Vercel HTTPS Serverless Mail Relay (/api/mail-relay)
 * over port 443 — avoids Render Free Tier outbound blocks on SMTP ports 25/465/587.
 * Strictly validates that relayOrigin is a trusted CyberGuard origin before dispatching.
 */
async function sendViaHttpsRelay({ relayOrigin, to, subject, html, text, headers, fromAddress, replyToAddress }) {
  if (!isTrustedClientOrigin(relayOrigin)) {
    throw new Error("Refusing to dispatch mail relay request to untrusted origin.");
  }

  const relayUrl = `${relayOrigin.replace(/\/$/, "")}/api/mail-relay`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 14000);

  try {
    const resp = await fetch(relayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MAIL_RELAY_SECRET
          ? { "x-mail-relay-secret": process.env.MAIL_RELAY_SECRET }
          : {}),
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        headers,
        from: fromAddress,
        replyTo: replyToAddress,
        smtp: smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data?.ok) {
      throw new Error(data?.error || `HTTPS mail relay returned HTTP ${resp.status}`);
    }

    console.log(`[Mailer] Email dispatched via HTTPS relay to ${to}. Message ID: ${data.messageId}`);
    return { messageId: data.messageId, transport: "https-relay" };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Send a raw email with anti-spam delivery headers and automatic HTTPS relay fallback
 */
async function sendEmail({ to, subject, html, text = "", headers = {}, clientOrigin = undefined }) {
  const fromAddress = process.env.FROM_EMAIL || `"CyberGuard Ghana" <${smtpUser}>`;
  const replyToAddress = process.env.REPLY_TO_EMAIL || smtpUser;

  const mergedHeaders = {
    "X-Priority": "3",
    "X-Auto-Response-Suppress": "OOF, AutoReply",
    "Auto-Submitted": "auto-generated",
    "List-Unsubscribe": `<mailto:${replyToAddress}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    ...headers,
  };

  const mailOptions = {
    from: fromAddress,
    to,
    replyTo: replyToAddress,
    subject,
    text: text || "CyberGuard Ghana Notification",
    html,
    headers: mergedHeaders,
  };

  const resolvedOrigin = resolveClientOrigin(clientOrigin);
  const canUseHttpsRelay =
    isTrustedClientOrigin(resolvedOrigin) &&
    resolvedOrigin.startsWith("https://") &&
    !resolvedOrigin.includes("onrender.com");
  const preferHttpsRelay =
    canUseHttpsRelay &&
    (Boolean(process.env.RENDER) || process.env.NODE_ENV === "production");

  if (preferHttpsRelay) {
    try {
      return await sendViaHttpsRelay({
        relayOrigin: resolvedOrigin,
        to,
        subject,
        html,
        text,
        headers: mergedHeaders,
        fromAddress,
        replyToAddress,
      });
    } catch (relayErr) {
      console.warn(`[Mailer] HTTPS relay attempt failed (${relayErr.message}); trying direct SMTP...`);
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Email dispatched via direct SMTP to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (smtpErr) {
    if (!preferHttpsRelay && canUseHttpsRelay) {
      console.warn(`[Mailer] Direct SMTP failed (${smtpErr.message}); falling back to HTTPS relay...`);
      return sendViaHttpsRelay({
        relayOrigin: resolvedOrigin,
        to,
        subject,
        html,
        text,
        headers: mergedHeaders,
        fromAddress,
        replyToAddress,
      });
    }
    throw smtpErr;
  }
}

/**
 * Send Password Reset Email with responsive Ghanaian COP branding
 */
async function sendPasswordResetEmail(
  toEmail,
  resetToken,
  displayName = "CyberGuard Member",
  options = {}
) {
  const opts = /** @type {any} */ (options);
  const clientOrigin = resolveClientOrigin(opts.clientOrigin);
  const resetLink = `${clientOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeName = escapeHtml(displayName);
  const safeEmail = escapeHtml(toEmail);

  const subject = "Reset Your Password — CyberGuard Ghana";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password — CyberGuard Ghana</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
        .header { background-color: #001E3C; padding: 32px 36px; text-align: center; border-bottom: 4px solid #0056D2; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
        .header p { color: #93c5fd; margin: 6px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 36px; text-align: left; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
        .text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
        .link-fallback { background: #f1f5f9; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all; color: #0056D2; margin-top: 14px; }
        .alert-box { background: #fffbe6; border-left: 4px solid #d97706; padding: 14px; border-radius: 6px; font-size: 12px; color: #92400e; margin: 20px 0; }
        .footer { background-color: #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .footer strong { color: #334155; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>CyberGuard Ghana</h1>
          <p>National Child Online Protection Academy</p>
        </div>

        <div class="content">
          <div class="greeting">Hello ${safeName},</div>
          <p class="text">
            We received a request to reset your password for your <strong>CyberGuard Ghana</strong> student portal account. Click the secure button below to choose a new password:
          </p>

          <div class="btn-container">
            <a href="${resetLink}" class="btn" target="_blank">Reset Password Now</a>
          </div>

          <div class="alert-box">
            <strong>Security Notice:</strong> This password reset link will expire in <strong>15 minutes</strong> for your safety. If you did not request this reset, you can safely ignore this email.
          </div>

          <p class="text">
            If the button above does not work, copy and paste this URL into your browser address bar:
          </p>
          <div class="link-fallback">
            ${resetLink}
          </div>
        </div>

        <div class="footer">
          <p><strong>CyberGuard Ghana • Child Online Protection Academy</strong></p>
          <p>Governed in accordance with the Ghana Cybersecurity Act, 2020 (Act 1038)</p>
          <p style="margin-top: 10px; font-size: 10px;">This automated notification was sent to ${safeEmail}. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${displayName},\n\nWe received a request to reset your password for your CyberGuard Ghana account.\n\nPlease visit the following link to choose a new password:\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.`;

  return sendEmail({ to: toEmail, subject, html, text, clientOrigin });
}

/**
 * Send Welcome Email when a user signs up for the first time
 */
async function sendWelcomeEmail(
  toEmail,
  displayName = "CyberGuard Member",
  options = {}
) {
  const opts = /** @type {any} */ (options);
  const clientOrigin = resolveClientOrigin(opts.clientOrigin);
  const receiveDailyTips = Boolean(opts.receiveDailyTips);
  const dashboardLink = `${clientOrigin}/dashboard`;
  const coursesLink = `${clientOrigin}/courses`;
  const settingsLink = `${clientOrigin}/dashboard?tab=settings`;
  const safeName = escapeHtml(displayName);
  const safeEmail = escapeHtml(toEmail);

  const subject = `Welcome to CyberGuard Ghana, ${displayName}!`;

  const dailyTipsSectionHtml = receiveDailyTips
    ? `
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 800; color: #15803d; margin-bottom: 4px;">
          7:00 AM Daily Cyber Safety Tips: Enabled
        </div>
        <p style="font-size: 12px; color: #14532d; margin: 0; line-height: 1.55;">
          You're subscribed to our morning safety briefing! Every day at <strong>7:00 AM GMT</strong>, we'll send one short, actionable cyber defense tip straight to your inbox.
        </p>
      </div>
    `
    : `
      <div style="background: #f8fafc; border-left: 4px solid #0056D2; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 800; color: #0056D2; margin-bottom: 4px;">
          Want Daily 7:00 AM Cyber Safety Tips?
        </div>
        <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.55;">
          You can opt in anytime under <a href="${settingsLink}" style="color: #0056D2; font-weight: 700; text-decoration: underline;">Account Settings</a> to receive a 60-second cyber defense tip every morning at 7:00 AM GMT.
        </p>
      </div>
    `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CyberGuard Ghana</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
        .header { background-color: #001E3C; padding: 32px 36px; text-align: center; border-bottom: 4px solid #0056D2; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
        .header p { color: #93c5fd; margin: 6px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 36px; text-align: left; }
        .greeting { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .lead-text { font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 16px; }
        .feature-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; }
        .feature-title { font-size: 13px; font-weight: 700; color: #0056D2; margin-bottom: 3px; }
        .feature-desc { font-size: 12px; color: #475569; line-height: 1.5; margin: 0; }
        .btn-container { text-align: center; margin: 26px 0 18px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
        .secondary-link { display: block; text-align: center; font-size: 12px; color: #0056D2; text-decoration: underline; margin-bottom: 18px; font-weight: 600; }
        .hotline-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-top: 20px; }
        .hotline-title { font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 3px; }
        .hotline-desc { font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.45; }
        .footer { background-color: #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
        .footer strong { color: #334155; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>CyberGuard Ghana</h1>
          <p>National Cyber Safety &amp; Digital Defense Academy</p>
        </div>

        <div class="content">
          <div class="greeting">Akwaaba, ${safeName}!</div>
          <p class="lead-text">
            Welcome to <strong>CyberGuard Ghana</strong>! Thank you for signing up—your account is now active and ready.
          </p>
          <p class="lead-text">
            Whether you are learning to spot Mobile Money (MoMo) fraud, locking down your social accounts, or preparing for a career in cybersecurity, everything you need is waiting in your dashboard:
          </p>

          <div class="feature-box">
            <div>
              <div class="feature-title">1. Accredited Cyber Safety Courses &amp; Certificates</div>
              <p class="feature-desc">Complete bite-sized lessons on phishing detection, password hygiene, AI deepfakes, and MoMo protection to earn verifiable certificates.</p>
            </div>
            <div style="margin-top: 14px;">
              <div class="feature-title">2. Vetted 1-on-1 Mentors &amp; Encrypted CyberChat</div>
              <p class="feature-desc">Book live mentorship sessions with accredited cybersecurity practitioners and collaborate safely with end-to-end encryption.</p>
            </div>
            <div style="margin-top: 14px;">
              <div class="feature-title">3. Confidential Incident Reporting</div>
              <p class="feature-desc">Report online harassment, impersonation, or cyber scams confidentially for review under Ghana's Child Online Protection (COP) framework.</p>
            </div>
          </div>

          ${dailyTipsSectionHtml}

          <div class="btn-container">
            <a href="${dashboardLink}" class="btn" target="_blank">Open Your Dashboard</a>
          </div>
          <a href="${coursesLink}" class="secondary-link" target="_blank">Or browse all cyber safety courses &rarr;</a>

          <div class="hotline-box">
            <div class="hotline-title">National Cyber Threat Helpline: Toll-Free 292</div>
            <p class="hotline-desc">
              Need urgent help with cyber fraud or online harassment? Call <strong>292</strong> toll-free anytime or forward suspicious SMS messages to <strong>419</strong>.
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>CyberGuard Ghana • Child Online Protection Academy</strong></p>
          <p>Operated in alignment with the Cyber Security Authority (CSA), Ghana</p>
          <p style="margin-top: 10px; font-size: 10px;">This one-time welcome email was sent to ${safeEmail} because you created an account on CyberGuard Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const dailyTipsText = receiveDailyTips
    ? "7:00 AM Daily Cyber Safety Tips: ENABLED — You will receive a short, actionable cyber safety tip every morning at 7:00 AM GMT."
    : `Want daily 7:00 AM cyber safety tips? Enable them anytime in Account Settings: ${settingsLink}`;

  const text = `Akwaaba, ${displayName}!\n\nWelcome to CyberGuard Ghana! Thank you for signing up — your account is now active and ready.\n\nWhat you can do right away:\n1. Explore accredited courses on Mobile Money (MoMo) security, phishing defense, and social media privacy: ${coursesLink}\n2. Book 1-on-1 sessions with vetted mentors and chat safely on E2EE CyberChat\n3. Report cyber threats confidentially\n\n${dailyTipsText}\n\nOpen your dashboard:\n${dashboardLink}\n\nNational Cyber Threat Helpline: Call toll-free 292 anytime or forward suspicious SMS alerts to 419.\n\nWarm regards,\nThe CyberGuard Ghana Team`;

  return sendEmail({ to: toEmail, subject, html, text, clientOrigin });
}

/**
 * Send Daily 7:00 AM Cyber Safety Tip Email to opted-in users
 */
async function sendDailySafetyTipEmail({
  toEmail,
  displayName = "CyberGuard Member",
  tip,
  dateFormatted,
  unsubscribeUrl = "",
  clientOrigin: explicitOrigin = undefined,
}) {
  const clientOrigin = resolveClientOrigin(explicitOrigin);
  const courseUrl = tip?.courseSlug
    ? `${clientOrigin}/courses/${encodeURIComponent(tip.courseSlug)}`
    : `${clientOrigin}/courses`;
  const settingsUrl = `${clientOrigin}/dashboard?tab=settings`;
  const safeName = escapeHtml(displayName);
  const safeUnsubscribeUrl = unsubscribeUrl ? escapeHtml(unsubscribeUrl) : "";

  const subject = `Daily Cyber Safety Tip: ${tip.title} — CyberGuard Ghana`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(subject)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
        .header { background-color: #001E3C; padding: 28px 36px; text-align: left; border-bottom: 4px solid #0056D2; }
        .header-meta { color: #93c5fd; margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
        .header-date { color: #cbd5e1; margin: 6px 0 0 0; font-size: 12px; }
        .content { padding: 32px 36px; text-align: left; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .category-pill { display: inline-block; background: #eff6ff; color: #0056D2; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; padding: 4px 12px; margin-bottom: 12px; }
        .tip-title { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 1.35; }
        .tip-body { font-size: 14px; line-height: 1.65; color: #334155; margin: 0 0 20px 0; }
        .action-box { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 16px 18px; margin: 22px 0; }
        .action-label { font-size: 12px; font-weight: 800; color: #15803d; margin: 0 0 4px 0; }
        .action-text { font-size: 13px; line-height: 1.55; color: #14532d; margin: 0; }
        .btn-container { text-align: left; margin: 24px 0 18px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 13px; text-decoration: none; padding: 11px 22px; border-radius: 8px; }
        .hotline-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-top: 20px; font-size: 12px; color: #475569; }
        .footer { background-color: #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
        .footer a { color: #0056D2; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <p class="header-meta">CyberGuard Ghana • Morning Safety Briefing</p>
          <h1>7:00 AM Daily Cyber Safety Tip</h1>
          <p class="header-date">${escapeHtml(dateFormatted)}</p>
        </div>

        <div class="content">
          <div class="greeting">Good morning, ${safeName},</div>

          <span class="category-pill">Tip #${escapeHtml(tip.index)} • ${escapeHtml(tip.category)}</span>
          <h2 class="tip-title">${escapeHtml(tip.title)}</h2>
          <p class="tip-body">${escapeHtml(tip.summary)}</p>

          <div class="action-box">
            <p class="action-label">Today's 60-Second Safety Action</p>
            <p class="action-text">${escapeHtml(tip.actionStep)}</p>
          </div>

          <div class="btn-container">
            <a href="${courseUrl}" class="btn" target="_blank">Practice in CyberGuard Academy</a>
          </div>

          <div class="hotline-box">
            <strong>Spotted a scam or cyber threat?</strong> Call the Ghana Cyber Security Authority toll-free helpline on <strong>292</strong> or forward suspicious SMS alerts to <strong>419</strong>.
          </div>
        </div>

        <div class="footer">
          <p><strong>CyberGuard Ghana • Child Online Protection Academy</strong></p>
          <p>You are receiving this 7:00 AM briefing because you opted in to Daily Cyber Safety Tips.</p>
          <p style="margin-top: 8px;">
            <a href="${settingsUrl}" target="_blank">Manage email preferences</a>
            ${safeUnsubscribeUrl ? ` &bull; <a href="${safeUnsubscribeUrl}" target="_blank">Unsubscribe from daily tips</a>` : ""}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Good morning ${displayName},\n\nCyberGuard Ghana — 7:00 AM Daily Cyber Safety Tip (${dateFormatted})\n\n[${tip.category}] ${tip.title}\n\n${tip.summary}\n\nToday's 60-Second Safety Action:\n${tip.actionStep}\n\nPractice on CyberGuard Ghana: ${courseUrl}\n\nManage preferences: ${settingsUrl}${unsubscribeUrl ? `\nUnsubscribe: ${unsubscribeUrl}` : ""}`;

  const extraHeaders = unsubscribeUrl
    ? {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : {};

  return sendEmail({ to: toEmail, subject, html, text, headers: extraHeaders, clientOrigin });
}

/**
 * Send OTP Verification Email during student registration
 */
async function sendOtpVerificationEmail(toEmail, otpCode, options = {}) {
  const opts = /** @type {any} */ (options);
  const clientOrigin = resolveClientOrigin(opts.clientOrigin);
  const safeOtp = escapeHtml(otpCode);
  const safeEmail = escapeHtml(toEmail);
  const subject = `${otpCode} is your CyberGuard verification code`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeOtp} — Verify Your Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
        .header { background-color: #001E3C; padding: 30px 32px; text-align: center; border-bottom: 4px solid #0056D2; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
        .header p { color: #93c5fd; margin: 6px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 36px 32px; text-align: left; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
        .code-box { text-align: center; margin: 28px 0; }
        .code-value { display: inline-block; background-color: #001E3C; color: #38BDF8; font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 16px 28px; border-radius: 12px; border: 2px solid #0056D2; }
        .alert-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #166534; margin: 20px 0; }
        .security-note { font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; }
        .footer { background-color: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>CyberGuard Ghana</h1>
          <p>National Child Online Protection Academy</p>
        </div>

        <div class="content">
          <div class="greeting">Verify Your Email Address</div>
          <p class="text">
            Welcome to <strong>CyberGuard Ghana</strong>. To verify your email and complete your registration, enter this 6-digit security code on the signup screen:
          </p>

          <div class="code-box">
            <div class="code-value">${safeOtp}</div>
          </div>

          <div class="alert-box">
            <strong>Time-Sensitive:</strong> This verification code is valid for <strong>10 minutes</strong>.
          </div>

          <p class="text">
            Once verified, we'll guide you to choose your profile avatar, set up your learning preferences, and automatically allocate your age-appropriate cybersecurity courses.
          </p>

          <div class="security-note">
            <strong>Security Notice:</strong> Never share this 6-digit code with anyone. CyberGuard officers and mentors will never ask for your verification code. If you did not attempt to sign up, you can safely disregard this email.
          </div>
        </div>

        <div class="footer">
          <p><strong>CyberGuard Ghana • Child Online Protection Academy</strong></p>
          <p>Governed in accordance with the Ghana Cybersecurity Act, 2020 (Act 1038)</p>
          <p style="margin-top: 10px; font-size: 10px;">Sent to ${safeEmail}. This is an automated security dispatch.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `CyberGuard Ghana Email Verification Code: ${otpCode}\n\nYour 6-digit verification code is: ${otpCode}\n\nEnter this code on the registration page to verify your email. This code will expire in 10 minutes.\n\nNever share this code with anyone.\nCyberGuard Ghana • National Child Online Protection`;

  return sendEmail({ to: toEmail, subject, html, text, clientOrigin });
}

module.exports = {
  transporter,
  escapeHtml,
  isTrustedClientOrigin,
  setClientOriginHint,
  resolveClientOrigin,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOtpVerificationEmail,
  sendDailySafetyTipEmail,
};
