const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

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
 * so email links resolve accurately even when CLIENT_ORIGIN falls back to localhost.
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

// SMTP credentials — strips spaces from Google App Passwords automatically
const smtpUser = (process.env.SMTP_USER || "cyberguardgh@gmail.com").trim();
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false", // true for 465, false for 587
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: smtpPass
    ? {
        user: smtpUser,
        pass: smtpPass,
      }
    : undefined,
});

/**
 * Resolves the path to the official CyberGuard Ghana logo for Content-ID (CID) inline attachment.
 * This guarantees the logo renders in Gmail, Outlook, Apple Mail, and Thunderbird without
 * triggering "External images blocked" warnings.
 */
function getLogoAttachment() {
  const candidatePaths = [
    path.join(__dirname, "../public/logo.png"),
    path.join(__dirname, "../public/logo-mark.png"),
    path.join(__dirname, "../../frontend/public/logo.png"),
    path.join(process.cwd(), "public/logo.png"),
    path.join(process.cwd(), "backend/public/logo.png"),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        return {
          filename: "cyberguard-logo.png",
          path: candidate,
          cid: "cyberguard-logo",
          contentDisposition: "inline",
        };
      }
    } catch {
      // Continue search
    }
  }
  return null;
}

/**
 * Renders the official responsive CyberGuard Ghana email header lockup.
 * Features:
 * - High-DPI CyberGuard Shield Emblem (via CID inline attachment + fallback)
 * - Authority Typography ("CYBERGUARD GHANA" with Ghanaian Cyan Accent)
 * - Subtitle lockup (e.g. National Child Online Protection Framework)
 */
function renderEmailHeader({ subtitle = "National Child Online Protection (COP) Framework", clientOrigin = "" }) {
  const safeSubtitle = escapeHtml(subtitle);
  const homeUrl = clientOrigin || resolveClientOrigin();

  return `
    <!-- HEADER SECTION -->
    <div style="background-color: #001E3C; background: linear-gradient(180deg, #0A192F 0%, #001E3C 100%); padding: 28px 24px 24px 24px; text-align: center; border-bottom: 4px solid #0056D2;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; text-align: center;" align="center">
        <tr>
          <td align="center" style="padding-bottom: 12px;">
            <a href="${homeUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="cid:cyberguard-logo" alt="CyberGuard Ghana" width="76" height="76" style="display: block; width: 76px; height: 76px; border: 0; outline: none; margin: 0 auto; border-radius: 14px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);" />
            </a>
          </td>
        </tr>
        <tr>
          <td align="center">
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; color: #FFFFFF; display: block; line-height: 1.25; margin: 0;">
              CYBERGUARD <span style="color: #00C4FF;">GHANA</span>
            </span>
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #93C5FD; display: block; margin-top: 5px;">
              ${safeSubtitle}
            </span>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Renders the CAN-SPAM, GDPR, and Ghana Cybersecurity Act 2020 compliant footer.
 * Includes clear physical entity identification, why the email was received,
 * account preference controls, and the national toll-free emergency helpline.
 */
function renderEmailFooter({ clientOrigin, safeEmail = "", unsubscribeUrl = "", reason = "" }) {
  const homeUrl = clientOrigin || resolveClientOrigin();
  const settingsUrl = `${homeUrl}/dashboard?tab=settings`;
  const defaultReason = safeEmail
    ? `This email was sent to ${safeEmail} as part of your registered CyberGuard Ghana security account.`
    : "This email was sent as part of your registered CyberGuard Ghana security account.";
  const displayReason = reason || defaultReason;

  return `
    <!-- FOOTER SECTION -->
    <div style="background-color: #F8FAFC; padding: 26px 32px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #1E293B; font-size: 12px; letter-spacing: 0.2px;">
        CyberGuard Ghana &bull; National Child Online Protection (COP) Framework
      </p>
      <p style="margin: 0 0 8px 0; color: #475569; font-size: 11px;">
        Accra, Ghana &bull; Operated in alignment with the Cyber Security Authority (CSA), Ghana &bull; Cybersecurity Act, 2020 (Act 1038)
      </p>
      <p style="margin: 0 0 10px 0; color: #64748B; font-size: 11px; line-height: 1.5;">
        ${displayReason}
      </p>
      <p style="margin: 0; font-size: 11px; padding-top: 4px; border-top: 1px solid #E2E8F0;">
        <a href="${settingsUrl}" target="_blank" style="color: #0056D2; font-weight: 600; text-decoration: underline;">Manage Preferences</a>
        &nbsp;&bull;&nbsp;
        <a href="tel:292" style="color: #D97706; font-weight: 700; text-decoration: none;">Toll-Free Helpline: Dial 292</a>
        ${
          unsubscribeUrl
            ? `&nbsp;&bull;&nbsp;<a href="${unsubscribeUrl}" target="_blank" style="color: #64748B; text-decoration: underline;">Unsubscribe from daily tips</a>`
            : ""
        }
      </p>
    </div>
  `;
}

/**
 * Dispatch an email via the Vercel HTTPS Serverless Mail Relay (/api/mail-relay)
 * over port 443 — avoids outbound SMTP port blocks on serverless and Render free tiers.
 */
async function sendViaHttpsRelay({
  relayOrigin,
  to,
  subject,
  html,
  text,
  headers,
  fromAddress,
  replyToAddress,
  attachments,
}) {
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
 * Primary email dispatcher with strict Anti-Spam protection:
 * 1. SPF & DKIM Envelope alignment with Google Mail servers
 * 2. RFC 5322 Message-ID & RFC 2822 Date compliance
 * 3. MIME Multipart/Alternative pairing (HTML + rich Text)
 * 4. Content-ID (CID) inline logo embedding for 100% immediate visual branding
 * 5. One-Click Unsubscribe (RFC 8058) headers for bulk dispatches
 */
async function sendEmail({
  to,
  subject,
  html,
  text = "",
  headers = {},
  attachments = [],
  clientOrigin = undefined,
}) {
  // Use clean authenticated sender so Google SPF and DKIM pass without header mismatch
  const cleanFromAddress = `"CyberGuard Ghana" <${smtpUser}>`;
  const replyToAddress = process.env.REPLY_TO_EMAIL || smtpUser;
  const senderDomain = smtpUser.includes("@") ? smtpUser.split("@")[1] : "gmail.com";
  const uniqueMessageId = `<cyberguard.${crypto.randomBytes(12).toString("hex")}.${Date.now()}@${senderDomain}>`;

  // Attach official logo for CID inline rendering
  const logoAttachment = getLogoAttachment();
  const finalAttachments = [];
  if (logoAttachment) {
    finalAttachments.push(logoAttachment);
  }
  if (Array.isArray(attachments)) {
    finalAttachments.push(...attachments);
  }

  // Anti-spam delivery headers compliant with Gmail & Yahoo 2024+ sender requirements
  const mergedHeaders = {
    "Date": new Date().toUTCString(),
    "Message-ID": uniqueMessageId,
    "MIME-Version": "1.0",
    "X-Mailer": "CyberGuard Ghana Notification Engine 1.0 (Act 1038)",
    "X-Entity-Ref-ID": crypto.randomUUID(),
    "X-Auto-Response-Suppress": "OOF, AutoReply",
    "Auto-Submitted": "auto-generated",
    "Reply-To": replyToAddress,
    ...headers,
  };

  const mailOptions = {
    from: cleanFromAddress,
    to,
    envelope: {
      from: smtpUser,
      to: Array.isArray(to) ? to : [to],
    },
    replyTo: replyToAddress,
    subject,
    text: text || "CyberGuard Ghana Security Notification",
    html,
    headers: mergedHeaders,
    attachments: finalAttachments,
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
        fromAddress: cleanFromAddress,
        replyToAddress,
        attachments: finalAttachments,
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
        fromAddress: cleanFromAddress,
        replyToAddress,
        attachments: finalAttachments,
      });
    }
    throw smtpErr;
  }
}

/**
 * Send Password Reset Email with official CyberGuard logo & anti-spam security headers
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
  const preheader = "Secure link to reset your CyberGuard Ghana password. Expires in 15 minutes.";

  const headerHtml = renderEmailHeader({
    subtitle: "Account Security & Access Recovery",
    clientOrigin,
  });

  const footerHtml = renderEmailFooter({
    clientOrigin,
    safeEmail,
    reason: `This security notification was sent to ${safeEmail} because a password reset was requested for your account.`,
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
      <title>${escapeHtml(subject)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .content { padding: 36px 32px; text-align: left; }
        .greeting { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 14px; }
        .text { font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 86, 210, 0.25); }
        .link-fallback { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-family: 'SF Mono', Consolas, monospace; font-size: 11px; word-break: break-all; color: #0056D2; margin-top: 14px; line-height: 1.5; }
        .alert-box { background: #fffbe6; border-left: 4px solid #d97706; padding: 14px 16px; border-radius: 8px; font-size: 12px; color: #92400e; margin: 24px 0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <!-- Hidden Preheader -->
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
        ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>

      <div class="wrapper">
        ${headerHtml}

        <div class="content">
          <div class="greeting">Hello ${safeName},</div>
          <p class="text">
            We received a request to reset your password for your <strong>CyberGuard Ghana</strong> student portal account. Click the secure button below to choose a new password:
          </p>

          <div class="btn-container">
            <a href="${resetLink}" class="btn" target="_blank">Reset Password Now</a>
          </div>

          <div class="alert-box">
            <strong>Security Notice:</strong> This password reset link will expire in <strong>15 minutes</strong> for your safety. If you did not request this reset, you can safely ignore this email—your account remains protected.
          </div>

          <p class="text" style="font-size: 12px; color: #64748b; margin-top: 24px;">
            If the button above does not open, copy and paste this secure link directly into your browser:
          </p>
          <div class="link-fallback">
            ${resetLink}
          </div>
        </div>

        ${footerHtml}
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${displayName},\n\nWe received a request to reset your password for your CyberGuard Ghana account.\n\nPlease visit the following secure link to choose a new password:\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request a password reset, please disregard this message.\n\nCyberGuard Ghana • National Child Online Protection Framework\nAccra, Ghana • Helpline: 292`;

  const securityHeaders = {
    "X-Priority": "1",
    "Priority": "Urgent",
    "Importance": "high",
  };

  return sendEmail({ to: toEmail, subject, html, text, headers: securityHeaders, clientOrigin });
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
  const preheader = "Akwaaba! Your CyberGuard account is ready. Explore safety courses, vetted mentors, and daily defense tips.";

  const headerHtml = renderEmailHeader({
    subtitle: "National Cyber Safety & Digital Defense Academy",
    clientOrigin,
  });

  const dailyTipsSectionHtml = receiveDailyTips
    ? `
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 10px; padding: 16px 18px; margin: 22px 0;">
        <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 4px;">
          Daily Cyber Safety Tips: Active
        </div>
        <p style="font-size: 12px; color: #14532d; margin: 0; line-height: 1.55;">
          You're subscribed to our safety briefing! We'll send one short, actionable cyber defense tip straight to your inbox every day.
        </p>
      </div>
    `
    : `
      <div style="background: #f8fafc; border-left: 4px solid #0056D2; border-radius: 10px; padding: 16px 18px; margin: 22px 0;">
        <div style="font-size: 13px; font-weight: 800; color: #0056D2; margin-bottom: 4px;">
          Want Daily Cyber Safety Tips?
        </div>
        <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.55;">
          You can opt in anytime under <a href="${settingsLink}" style="color: #0056D2; font-weight: 700; text-decoration: underline;">Account Settings</a> to receive a 60-second cyber defense tip every day.
        </p>
      </div>
    `;

  const footerHtml = renderEmailFooter({
    clientOrigin,
    safeEmail,
    reason: `This welcome dispatch was sent to ${safeEmail} because you created a new account on CyberGuard Ghana.`,
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
      <title>${escapeHtml(subject)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .content { padding: 36px 32px; text-align: left; }
        .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .lead-text { font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 16px; }
        .feature-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .feature-item { margin-bottom: 14px; }
        .feature-item:last-child { margin-bottom: 0; }
        .feature-title { font-size: 13px; font-weight: 800; color: #0056D2; margin-bottom: 3px; }
        .feature-desc { font-size: 12px; color: #475569; line-height: 1.5; margin: 0; }
        .btn-container { text-align: center; margin: 28px 0 16px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 86, 210, 0.25); }
        .secondary-link { display: block; text-align: center; font-size: 12px; color: #0056D2; text-decoration: underline; margin-bottom: 20px; font-weight: 600; }
        .hotline-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-top: 24px; }
        .hotline-title { font-size: 12px; font-weight: 800; color: #1e40af; margin-bottom: 4px; }
        .hotline-desc { font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
        ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>

      <div class="wrapper">
        ${headerHtml}

        <div class="content">
          <div class="greeting">Akwaaba, ${safeName}!</div>
          <p class="lead-text">
            Welcome to <strong>CyberGuard Ghana</strong>! Thank you for signing up—your account is active and ready to build your digital defense skills.
          </p>
          <p class="lead-text">
            Whether you want to protect your Mobile Money (MoMo) wallet, secure your social accounts, or prepare for a cybersecurity career, everything is ready in your portal:
          </p>

          <div class="feature-box">
            <div class="feature-item">
              <div class="feature-title">1. Accredited Cyber Safety Courses &amp; Certificates</div>
              <p class="feature-desc">Complete bite-sized modules on phishing defense, password hygiene, AI deepfakes, and MoMo security to earn verifiable certificates.</p>
            </div>
            <div class="feature-item">
              <div class="feature-title">2. Vetted 1-on-1 Mentors &amp; Encrypted CyberChat</div>
              <p class="feature-desc">Book live sessions with accredited cybersecurity professionals and collaborate privately with end-to-end encryption.</p>
            </div>
            <div class="feature-item">
              <div class="feature-title">3. Confidential Incident Reporting</div>
              <p class="feature-desc">Report online extortion, impersonation, or cyber fraud confidentially for review under Ghana's Child Online Protection framework.</p>
            </div>
          </div>

          ${dailyTipsSectionHtml}

          <div class="btn-container">
            <a href="${dashboardLink}" class="btn" target="_blank">Open Your Dashboard</a>
          </div>
          <a href="${coursesLink}" class="secondary-link" target="_blank">Or browse all cyber safety courses &rarr;</a>

          <div class="hotline-box">
            <div class="hotline-title">National Cyber Threat Helpline: Toll-Free Dial 292</div>
            <p class="hotline-desc">
              Need urgent help with cyber fraud or online harassment? Call <strong>292</strong> toll-free anytime or forward suspicious SMS messages to shortcode <strong>419</strong>.
            </p>
          </div>
        </div>

        ${footerHtml}
      </div>
    </body>
    </html>
  `;

  const text = `Akwaaba, ${displayName}!\n\nWelcome to CyberGuard Ghana! Thank you for signing up — your account is now active and ready.\n\nWhat you can do right away:\n1. Explore accredited courses on Mobile Money (MoMo) security, phishing defense, and social media privacy: ${coursesLink}\n2. Book 1-on-1 sessions with vetted mentors and chat safely on E2EE CyberChat\n3. Report cyber threats confidentially\n\n${dailyTipsText}\n\nOpen your dashboard:\n${dashboardLink}\n\nNational Cyber Threat Helpline: Call toll-free 292 anytime or forward suspicious SMS alerts to 419.\n\nWarm regards,\nThe CyberGuard Ghana Team`;

  return sendEmail({ to: toEmail, subject, html, text, clientOrigin });
}

/**
 * Send Daily Cyber Safety Tip Email to opted-in users with RFC 8058 One-Click Unsubscribe
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
  const safeName = escapeHtml(displayName);
  const safeUnsubscribeUrl = unsubscribeUrl ? escapeHtml(unsubscribeUrl) : "";

  const subject = `Daily Cyber Safety Tip: ${tip.title} — CyberGuard Ghana`;
  const preheader = `Today's 60-Second Cyber Defense Tip: ${tip.title} — ${tip.category}`;

  const headerHtml = renderEmailHeader({
    subtitle: "Daily Cyber Defense Briefing",
    clientOrigin,
  });

  const footerHtml = renderEmailFooter({
    clientOrigin,
    safeEmail: escapeHtml(toEmail),
    unsubscribeUrl: safeUnsubscribeUrl,
    reason: `You are receiving this daily briefing because your account has Cyber Safety Tips enabled.`,
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
      <title>${escapeHtml(subject)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .content { padding: 32px 32px; text-align: left; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .category-pill { display: inline-block; background: #eff6ff; color: #0056D2; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 800; padding: 4px 12px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .tip-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 1.35; letter-spacing: -0.2px; }
        .tip-body { font-size: 14px; line-height: 1.65; color: #334155; margin: 0 0 20px 0; }
        .action-box { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 10px; padding: 18px 20px; margin: 24px 0; }
        .action-label { font-size: 12px; font-weight: 800; color: #15803d; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .action-text { font-size: 13px; line-height: 1.6; color: #14532d; margin: 0; font-weight: 500; }
        .btn-container { text-align: left; margin: 26px 0 20px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 86, 210, 0.2); }
        .hotline-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-top: 22px; font-size: 12px; color: #475569; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
        ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>

      <div class="wrapper">
        ${headerHtml}

        <div class="content">
          <div class="greeting">Good morning, ${safeName},</div>

          <span class="category-pill">Tip #${escapeHtml(tip.index)} &bull; ${escapeHtml(tip.category)}</span>
          <h2 class="tip-title">${escapeHtml(tip.title)}</h2>
          <p class="tip-body">${escapeHtml(tip.summary)}</p>

          <div class="action-box">
            <p class="action-label">Today's 60-Second Safety Action</p>
            <p class="action-text">${escapeHtml(tip.actionStep)}</p>
          </div>

          <div class="btn-container">
            <a href="${courseUrl}" class="btn" target="_blank">Practice in CyberGuard Academy &rarr;</a>
          </div>

          <div class="hotline-box">
            <strong>Spotted a scam or cyber threat?</strong> Call the Ghana Cyber Security Authority toll-free helpline on <strong>292</strong> or forward suspicious SMS alerts to shortcode <strong>419</strong>.
          </div>
        </div>

        ${footerHtml}
      </div>
    </body>
    </html>
  `;

  const text = `Good morning ${displayName},\n\nCyberGuard Ghana — Daily Cyber Safety Tip (${dateFormatted})\n\n[Tip #${tip.index} • ${tip.category}]\n${tip.title}\n\n${tip.summary}\n\nToday's 60-Second Safety Action:\n${tip.actionStep}\n\nPractice on CyberGuard Ghana: ${courseUrl}\n\nManage preferences: ${clientOrigin}/dashboard?tab=settings${unsubscribeUrl ? `\nUnsubscribe: ${unsubscribeUrl}` : ""}\n\nNational Cyber Threat Helpline: Toll-Free 292`;

  const extraHeaders = {
    "Precedence": "bulk",
    ...(unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${smtpUser}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : {}),
  };

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
  const preheader = `Your CyberGuard Ghana email verification code is ${otpCode}. Valid for 10 minutes.`;

  const headerHtml = renderEmailHeader({
    subtitle: "Email Verification & Account Security",
    clientOrigin,
  });

  const footerHtml = renderEmailFooter({
    clientOrigin,
    safeEmail,
    reason: `This security code was sent to ${safeEmail} to verify your email address on CyberGuard Ghana.`,
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
      <title>${safeOtp} — Verify Your Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .content { padding: 36px 32px; text-align: left; }
        .greeting { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 20px; }
        .code-box { text-align: center; margin: 30px 0; }
        .code-value { display: inline-block; background-color: #001E3C; color: #38BDF8; font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; padding: 18px 32px; border-radius: 12px; border: 2px solid #0056D2; box-shadow: 0 4px 14px rgba(0, 86, 210, 0.2); }
        .alert-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 8px; font-size: 12px; color: #166534; margin: 22px 0; font-weight: 500; }
        .security-note { font-size: 12px; color: #64748b; line-height: 1.55; margin-top: 26px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
        ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
      </div>

      <div class="wrapper">
        ${headerHtml}

        <div class="content">
          <div class="greeting">Verify Your Email Address</div>
          <p class="text">
            Welcome to <strong>CyberGuard Ghana</strong>. To complete your signup and protect your student portal, enter this 6-digit security verification code on the registration page:
          </p>

          <div class="code-box">
            <div class="code-value">${safeOtp}</div>
          </div>

          <div class="alert-box">
            <strong>Time-Sensitive:</strong> This security code will expire in <strong>10 minutes</strong>.
          </div>

          <p class="text">
            Once verified, you will be able to customize your profile, set your cybersecurity interests, and access your age-appropriate courses.
          </p>

          <div class="security-note">
            <strong>Security Notice:</strong> Never share this 6-digit code with anyone. CyberGuard officers and mentors will never ask you for your code. If you did not initiate this request, you can safely disregard this message.
          </div>
        </div>

        ${footerHtml}
      </div>
    </body>
    </html>
  `;

  const text = `CyberGuard Ghana Email Verification Code: ${otpCode}\n\nYour 6-digit verification code is: ${otpCode}\n\nEnter this code on the registration page to verify your email. This code will expire in 10 minutes.\n\nNever share this code with anyone.\nCyberGuard Ghana • National Child Online Protection`;

  const securityHeaders = {
    "X-Priority": "1",
    "Priority": "Urgent",
    "Importance": "high",
  };

  return sendEmail({ to: toEmail, subject, html, text, headers: securityHeaders, clientOrigin });
}

module.exports = {
  transporter,
  escapeHtml,
  isTrustedClientOrigin,
  setClientOriginHint,
  resolveClientOrigin,
  getLogoAttachment,
  renderEmailHeader,
  renderEmailFooter,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOtpVerificationEmail,
  sendDailySafetyTipEmail,
};
