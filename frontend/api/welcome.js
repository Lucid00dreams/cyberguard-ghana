import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN || "https://cyberguard-ghana.onrender.com";

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveLogoAttachment() {
  const candidates = [
    path.join(process.cwd(), "public/logo.png"),
    path.join(process.cwd(), "frontend/public/logo.png"),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return {
          filename: "cyberguard-logo.png",
          path: p,
          cid: "cyberguard-logo",
          contentDisposition: "inline",
        };
      }
    } catch {
      // Continue
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const smtpUser = (process.env.SMTP_USER || "cyberguardgh@gmail.com").trim();
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!smtpPass) {
    return res.status(200).json({ ok: false, skipped: "SMTP_PASS not set on Vercel." });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  try {
    const meResp = await fetch(`${BACKEND_ORIGIN.replace(/\/$/, "")}/api/auth/me`, {
      headers: { Authorization: authHeader },
    });
    if (!meResp.ok) {
      return res.status(401).json({ error: "Invalid session token." });
    }

    const me = await meResp.json();
    const createdAgeMs = Date.now() - new Date(me.createdAt).getTime();
    if (!me?.email || Number.isNaN(createdAgeMs) || createdAgeMs > 5 * 60 * 1000) {
      return res.status(200).json({ ok: false, skipped: "Not a newly created account." });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "cyberguard-ghana.vercel.app";
    const clientOrigin = `https://${host}`;
    const dashboardLink = `${clientOrigin}/dashboard`;
    const coursesLink = `${clientOrigin}/courses`;
    const safeName = escapeHtml(me.displayName || "CyberGuard Member");
    const safeEmail = escapeHtml(me.email);

    const subject = `Welcome to CyberGuard Ghana, ${me.displayName}!`;
    const preheader = "Akwaaba! Your CyberGuard account is ready. Explore safety courses, vetted mentors, and daily defense tips.";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(subject)}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 0;">
        <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          ${escapeHtml(preheader)}
        </div>
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          <!-- Header with Logo -->
          <div style="background-color: #001E3C; padding: 28px 24px; text-align: center; border-bottom: 4px solid #0056D2;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; text-align: center;" align="center">
              <tr>
                <td align="center" style="padding-bottom: 12px;">
                  <img src="cid:cyberguard-logo" alt="CyberGuard Ghana" width="76" height="76" style="display: block; width: 76px; height: 76px; border: 0; outline: none; margin: 0 auto; border-radius: 14px;" />
                </td>
              </tr>
              <tr>
                <td align="center">
                  <span style="font-size: 22px; font-weight: 900; color: #FFFFFF; display: block; line-height: 1.25;">
                    CYBERGUARD <span style="color: #00C4FF;">GHANA</span>
                  </span>
                  <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #93C5FD; display: block; margin-top: 5px;">
                    National Cyber Safety &amp; Digital Defense Academy
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="padding: 36px 32px; text-align: left;">
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Akwaaba, ${safeName}!</div>
            <p style="font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 16px;">
              Welcome to <strong>CyberGuard Ghana</strong>! Thank you for signing up—your account is now active and ready.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="margin-bottom: 14px;">
                <div style="font-size: 13px; font-weight: 800; color: #0056D2; margin-bottom: 3px;">1. Accredited Cyber Safety Courses &amp; Certificates</div>
                <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 0;">Complete bite-sized lessons on phishing detection, password hygiene, AI deepfakes, and Mobile Money protection.</p>
              </div>
              <div style="margin-bottom: 14px;">
                <div style="font-size: 13px; font-weight: 800; color: #0056D2; margin-bottom: 3px;">2. Vetted 1-on-1 Mentors &amp; Encrypted CyberChat</div>
                <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 0;">Book live mentorship sessions and collaborate safely with end-to-end encryption.</p>
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #0056D2; margin-bottom: 3px;">3. Confidential Incident Reporting</div>
                <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 0;">Report cyber scams or online harassment confidentially under Ghana's Child Online Protection (COP) framework.</p>
              </div>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${dashboardLink}" style="display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 10px;" target="_blank">Open Your Dashboard</a>
            </div>
            <a href="${coursesLink}" style="display: block; text-align: center; font-size: 12px; color: #0056D2; text-decoration: underline; margin-bottom: 20px; font-weight: 600;" target="_blank">Or browse all cyber safety courses &rarr;</a>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-top: 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #1e40af; margin-bottom: 4px;">National Cyber Threat Helpline: Toll-Free 292</div>
              <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.5;">Call <strong>292</strong> toll-free anytime or forward suspicious SMS messages to <strong>419</strong>.</p>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #1e293b; font-size: 12px;">CyberGuard Ghana &bull; National Child Online Protection (COP) Framework</p>
            <p style="margin: 0 0 8px 0; color: #475569;">Accra, Ghana &bull; Operated in alignment with the Cyber Security Authority (CSA), Ghana &bull; Act 1038</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">This welcome email was sent to ${safeEmail} for your registered account.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Akwaaba, ${me.displayName}!\n\nWelcome to CyberGuard Ghana! Your account is active and ready.\n\nOpen your dashboard: ${dashboardLink}\nBrowse courses: ${coursesLink}\n\nNational Cyber Threat Helpline: Call toll-free 292 anytime.\nCyberGuard Ghana • National Child Online Protection`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const attachments = [];
    const logo = resolveLogoAttachment();
    if (logo) attachments.push(logo);

    const info = await transporter.sendMail({
      from: `"CyberGuard Ghana" <${smtpUser}>`,
      to: me.email,
      envelope: { from: smtpUser, to: [me.email] },
      replyTo: smtpUser,
      subject,
      text,
      html,
      attachments,
      headers: {
        "Date": new Date().toUTCString(),
        "Message-ID": `<cyberguard.${crypto.randomBytes(12).toString("hex")}.${Date.now()}@gmail.com>`,
        "MIME-Version": "1.0",
        "X-Mailer": "CyberGuard Ghana Engine (Act 1038)",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
        "Auto-Submitted": "auto-generated",
      },
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("[Vercel Welcome Email] Error:", err.message);
    return res.status(502).json({ error: "Welcome email delivery failed." });
  }
}
