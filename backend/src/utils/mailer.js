const nodemailer = require("nodemailer");

// Create reusable SMTP transporter using Gmail / custom SMTP
const smtpPass = process.env.SMTP_PASS;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false", // true for 465, false for other ports
  auth: smtpPass
    ? {
        user: process.env.SMTP_USER || "cyberguardgh@gmail.com",
        pass: smtpPass,
      }
    : undefined,
});

/**
  Send a raw email with anti-spam delivery headers
  @param {Object} options - { to, subject, html, text, headers }
 */
async function sendEmail({ to, subject, html, text, headers = {} }) {
  const fromAddress = process.env.FROM_EMAIL || `"CyberGuard Ghana" <cyberguardgh@gmail.com>`;
  const replyToAddress = process.env.REPLY_TO_EMAIL || "cyberguardgh@gmail.com";

  const mailOptions = {
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
      "List-Unsubscribe": `<mailto:${replyToAddress}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      ...headers,
    },
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Email dispatched to ${to}. Message ID: ${info.messageId}`);
  return info;
}

/**
  Send Password Reset Email with responsive Ghanaian COP branding
  @param {string} toEmail - Recipient email
  @param {string} resetToken - JWT or secure reset token
  @param {string} displayName - Recipient name
 */
async function sendPasswordResetEmail(toEmail, resetToken, displayName = "CyberGuard Member") {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const resetLink = `${clientOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;

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
          <div class="greeting">Hello ${displayName},</div>
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
          <p style="margin-top: 10px; font-size: 10px;">This automated notification was sent to ${toEmail}. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${displayName},\n\nWe received a request to reset your password for your CyberGuard Ghana account.\n\nPlease visit the following link to choose a new password:\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.`;

  return sendEmail({ to: toEmail, subject, html, text });
}

/**
 * Send Welcome Email to newly registered users
 * @param {string} toEmail - Recipient email
 * @param {string} displayName - Recipient display name
 */
async function sendWelcomeEmail(toEmail, displayName = "CyberGuard Member") {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const loginLink = `${clientOrigin}/login`;

  const subject = `Welcome to CyberGuard Ghana, ${displayName}`;

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
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
        .lead-text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
        .feature-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; }
        .feature-title { font-size: 13px; font-weight: 700; color: #0056D2; margin-bottom: 3px; }
        .feature-desc { font-size: 12px; color: #475569; line-height: 1.5; margin: 0; }
        .btn-container { text-align: center; margin: 28px 0 20px 0; }
        .btn { display: inline-block; background-color: #0056D2; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
        .hotline-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-top: 20px; }
        .hotline-title { font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 3px; }
        .hotline-desc { font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.4; }
        .footer { background-color: #f1f5f9; padding: 20px 36px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .footer strong { color: #334155; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>CyberGuard Ghana</h1>
          <p>National Youth Cyber Safety Platform</p>
        </div>

        <div class="content">
          <div class="greeting">Hello ${displayName},</div>
          <p class="lead-text">
            Welcome to CyberGuard Ghana. Your student account has been registered successfully.
          </p>
          <p class="lead-text" style="margin-top: -10px;">
            You can now explore accredited digital defense courses, hands-on safety simulations, and verified mentor guidance built under Ghana's Child Online Protection (COP) framework.
          </p>

          <div class="feature-box">
            <div>
              <div class="feature-title">Accredited Learning & Certificates</div>
              <p class="feature-desc">Learn practical steps to secure Mobile Money accounts and social media profiles. Earn verifiable certificates upon completing assessments.</p>
            </div>
            <div style="margin-top: 14px;">
              <div class="feature-title">Interactive Threat Simulator</div>
              <p class="feature-desc">Practice identifying fraudulent SMS alerts, unauthorized access traps, and spoofed recruitment forms.</p>
            </div>
            <div style="margin-top: 14px;">
              <div class="feature-title">Confidential Incident Support</div>
              <p class="feature-desc">Report online safety concerns confidentially with zero personal tracking, reviewed by Cyber Security Authority officers.</p>
            </div>
          </div>

          <div class="btn-container">
            <a href="${loginLink}" class="btn" target="_blank">Access Your Dashboard</a>
          </div>

          <div class="hotline-box">
            <div class="hotline-title">National Cyber Threat Helpline: 292</div>
            <p class="hotline-desc">
              For urgent questions or support regarding digital safety, call toll-free 292 anytime.
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>CyberGuard Ghana • Child Online Protection Academy</strong></p>
          <p>Operated in alignment with the Cyber Security Authority (CSA), Ghana</p>
          <p style="margin-top: 10px; font-size: 10px;">This automated notification was sent to ${toEmail}. You received this email because you registered on CyberGuard Ghana.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${displayName},\n\nWelcome to CyberGuard Ghana. Your student account has been registered successfully.\n\nYou now have access to accredited safety courses, interactive threat simulations, and confidential incident reporting.\n\nSign in to your account:\n${loginLink}\n\nKey features:\n- Accredited courses on Mobile Money and social media security\n- Hands-on threat simulations\n- Confidential incident reporting\n\nHelpline: For immediate digital safety guidance, call toll-free 292.\n\nBest regards,\nThe CyberGuard Ghana Team`;

  return sendEmail({ to: toEmail, subject, html, text });
}

module.exports = {
  transporter,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
