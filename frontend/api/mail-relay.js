import crypto from "crypto";
import nodemailer from "nodemailer";

const DEFAULT_ALLOWED_SENDER = "cyberguardgh@gmail.com";

function safeCompareSecret(a, b) {
  if (!a || !b || typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const relaySecret = process.env.MAIL_RELAY_SECRET;
    const providedSecret = req.headers["x-mail-relay-secret"];

    if (relaySecret && !safeCompareSecret(String(providedSecret || ""), relaySecret)) {
      return res.status(401).json({ error: "Invalid mail relay secret." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { to, subject, html, text, headers, from, replyTo, smtp } = body;

    if (!to || typeof to !== "string" || !subject || typeof subject !== "string") {
      return res.status(400).json({ error: "Recipient (to) and subject are required." });
    }

    // Prevent CRLF header injection in recipient or subject
    if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
      return res.status(400).json({ error: "Invalid characters in email header fields." });
    }

    const providedPass = (smtp?.pass || "").trim();
    const envPass = (process.env.SMTP_PASS || "").trim();

    // If caller does not supply the Gmail App Password directly, require MAIL_RELAY_SECRET
    if (!providedPass) {
      if (!relaySecret || !safeCompareSecret(String(providedSecret || ""), relaySecret)) {
        return res.status(401).json({
          error: "Missing SMTP credentials on backend server (set SMTP_USER and SMTP_PASS).",
        });
      }
    }

    const smtpUser = (process.env.SMTP_USER || smtp?.user || "").trim();
    const smtpPass = providedPass || envPass;

    const allowedSenders = new Set([DEFAULT_ALLOWED_SENDER]);
    if (process.env.SMTP_USER) {
      allowedSenders.add(process.env.SMTP_USER.trim().toLowerCase());
    }

    if (!smtpUser || !allowedSenders.has(smtpUser.toLowerCase()) || !smtpPass) {
      return res.status(401).json({
        error: "Unauthorized mail sender or missing SMTP credentials.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromAddress =
      from || process.env.FROM_EMAIL || `"CyberGuard Ghana" <${smtpUser}>`;
    const replyToAddress =
      replyTo || process.env.REPLY_TO_EMAIL || smtpUser;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: replyToAddress,
      subject,
      text: text || "CyberGuard Ghana Notification",
      html,
      headers: {
        "X-Priority": "3",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
        "Auto-Submitted": "auto-generated",
        ...(headers && typeof headers === "object" ? headers : {}),
      },
    });

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("[Vercel Mail Relay] Delivery error:", err.message);
    return res.status(502).json({
      error: "SMTP delivery failed.",
    });
  }
}
