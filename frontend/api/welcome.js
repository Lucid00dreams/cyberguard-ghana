import nodemailer from "nodemailer";

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN || "https://cyberguard-ghana.onrender.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const smtpUser = (process.env.SMTP_USER || "cyberguardgh@gmail.com").trim();
  const smtpPass = (process.env.SMTP_PASS || "").trim();

  if (!smtpPass) {
    return res.status(200).json({ ok: false, skipped: "SMTP_PASS not set on Vercel." });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  try {
    // Cryptographically verify user identity & recent creation against backend /api/auth/me
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

    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    const clientOrigin = host ? `${proto}://${host}` : "https://cyberguard-ghana.vercel.app";

    const displayName = me.displayName || "CyberGuard Member";
    const receiveDailyTips = Boolean(me.receiveDailyTips);
    const dashboardLink = `${clientOrigin}/dashboard`;
    const coursesLink = `${clientOrigin}/courses`;
    const settingsLink = `${clientOrigin}/dashboard?tab=settings`;

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
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background-color: #001E3C; padding: 32px 36px; text-align: center; border-bottom: 4px solid #0056D2;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">CyberGuard Ghana</h1>
            <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">National Cyber Safety &amp; Digital Defense Academy</p>
          </div>
          <div style="padding: 36px; text-align: left;">
            <div style="font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Akwaaba, ${displayName}!</div>
            <p style="font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 16px;">
              Welcome to <strong>CyberGuard Ghana</strong>! Thank you for signing up—your account is now active and ready.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0056D2; margin-bottom: 3px;">1. Accredited Cyber Safety Courses &amp; Certificates</div>
                <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 0;">Complete bite-sized lessons on phishing detection, password hygiene, AI deepfakes, and Mobile Money protection.</p>
              </div>
              <div style="margin-top: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: #0056D2; margin-bottom: 3px;">2. Vetted 1-on-1 Mentors &amp; Encrypted CyberChat</div>
                <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 0;">Book live mentorship sessions and collaborate safely with end-to-end encryption.</p>
              </div>
              <div style="margin-top: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: #0056D2; margin-bottom: 3px;">3. Confidential Incident Reporting</div>
                <p style="font-size: 12px; color: #475569; line-height: 1.5; margin: 0;">Report cyber scams or online harassment confidentially under Ghana's Child Online Protection (COP) framework.</p>
              </div>
            </div>
            ${dailyTipsSectionHtml}
            <div style="text-align: center; margin: 26px 0 18px 0;">
              <a href="${dashboardLink}" style="display: inline-block; background-color: #0056D2; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px;" target="_blank">Open Your Dashboard</a>
            </div>
            <a href="${coursesLink}" style="display: block; text-align: center; font-size: 12px; color: #0056D2; text-decoration: underline; margin-bottom: 18px; font-weight: 600;" target="_blank">Or browse all cyber safety courses &rarr;</a>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-top: 20px;">
              <div style="font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 3px;">National Cyber Threat Helpline: Toll-Free 292</div>
              <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.45;">Call <strong>292</strong> toll-free anytime or forward suspicious SMS messages to <strong>419</strong>.</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;"><strong>CyberGuard Ghana • Child Online Protection Academy</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10px;">This one-time welcome email was sent to ${me.email} because you created an account on CyberGuard Ghana.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Akwaaba, ${displayName}!\n\nWelcome to CyberGuard Ghana! Your account is now active and ready.\n\nOpen your dashboard: ${dashboardLink}\nBrowse courses: ${coursesLink}\n\nNational Cyber Threat Helpline: Call toll-free 292 anytime.`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || `"CyberGuard Ghana" <${smtpUser}>`,
      to: me.email,
      replyTo: process.env.REPLY_TO_EMAIL || smtpUser,
      subject,
      text,
      html,
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("[Vercel Welcome Email] Error:", err.message);
    return res.status(502).json({ error: err.message });
  }
}

