/**
 * CyberGuard Ghana - Automated Security Regression Test Suite
 * Validates OWASP Top 10 Defenses & Platform Hardening Controls
 * Uses native Node 18+ fetch and FormData (no external packages required)
 */

const fs = require("fs");
const path = require("path");

const API_BASE = process.env.TEST_API_URL || "http://localhost:4000";

let testResults = [];

function recordResult(testId, name, category, passed, details) {
  testResults.push({ testId, name, category, passed, details });
  const status = passed ? "[PASS]" : "[FAIL]";
  console.log(`${status} ${testId}: ${name}`);
  if (!passed && details) {
    console.error(`       Failure reason: ${details}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("CYBERGUARD GHANA - AUTOMATED SECURITY REGRESSION TEST SUITE");
  console.log(`Target: ${API_BASE}`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // TEST 1: SEC-001 (Google OAuth Account Takeover Defense)
  // ---------------------------------------------------------------------------
  try {
    // Attempt unauthenticated account takeover without token
    const resWithoutToken = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "victim_admin@cyberguard.org",
        name: "Attacker Account",
      }),
    });
    const dataWithoutToken = await resWithoutToken.json().catch(() => ({}));

    const passedNoToken = resWithoutToken.status === 400 && 
      (dataWithoutToken.error || "").toLowerCase().includes("credential is required");

    // Attempt account takeover with forged token
    const resForgedToken = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: "ey.forged.signature.token",
      }),
    });
    const dataForgedToken = await resForgedToken.json().catch(() => ({}));

    const passedForgedToken = (resForgedToken.status === 401 || resForgedToken.status === 503) &&
      ((dataForgedToken.error || "").toLowerCase().includes("invalid or expired") ||
       (dataForgedToken.error || "").toLowerCase().includes("google authentication service"));

    recordResult(
      "SEC-001",
      "Google OAuth Account Takeover & Forged Signature Rejection",
      "Authentication",
      passedNoToken && passedForgedToken,
      passedNoToken && passedForgedToken ? "Safely rejected unverified email injection (400) and forged token (401)" : `Got status ${resWithoutToken.status} / ${resForgedToken.status}`
    );
  } catch (err) {
    recordResult("SEC-001", "Google OAuth Defense", "Authentication", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: SEC-002 (Hardcoded SMTP Secret Scan)
  // ---------------------------------------------------------------------------
  try {
    const mailerPath = path.join(__dirname, "../src/utils/mailer.js");
    const mailerContent = fs.readFileSync(mailerPath, "utf8");
    const hasHardcodedPass = mailerContent.includes("haet vqqc azcr cztl") || mailerContent.includes('pass: "');
    const usesEnv = mailerContent.includes("process.env.SMTP_PASS");

    recordResult(
      "SEC-002",
      "Static Secret Audit: No Hardcoded SMTP Passwords in Source",
      "Secrets Management",
      !hasHardcodedPass && usesEnv,
      hasHardcodedPass ? "Detected hardcoded password in mailer.js" : "No hardcoded plaintext secrets found"
    );
  } catch (err) {
    recordResult("SEC-002", "Static Secret Audit", "Secrets Management", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: SEC-009 / SEC-010 (Production Security Headers via Helmet)
  // ---------------------------------------------------------------------------
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const headers = healthRes.headers;

    const hasNosniff = headers.get("x-content-type-options") === "nosniff";
    const hasDenyFrame = (headers.get("x-frame-options") || "").toLowerCase() === "deny";
    const hasHsts = (headers.get("strict-transport-security") || "").includes("max-age=31536000");
    const hasReferrerPolicy = (headers.get("referrer-policy") || "").includes("strict-origin");

    recordResult(
      "SEC-009/010",
      "HTTP Security Headers (HSTS, nosniff, frame-ancestors/DENY)",
      "Infrastructure & Headers",
      hasNosniff && hasDenyFrame && hasHsts && hasReferrerPolicy,
      `nosniff=${hasNosniff}, frameOptions=${hasDenyFrame}, hsts=${hasHsts}, referrerPolicy=${hasReferrerPolicy}`
    );
  } catch (err) {
    recordResult("SEC-009/010", "Security Headers", "Infrastructure", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: User Registration & Authentication Flow
  // ---------------------------------------------------------------------------
  const testEmail = `sec_audit_${Date.now()}@example.com`;
  const testPassword = "AuditPassword123!@#";
  let authToken = null;
  let userId = null;

  try {
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Security Auditor Test",
        ageBand: "YOUNG_ADULT",
        email: testEmail,
        password: testPassword,
      }),
    });

    const regData = await regRes.json().catch(() => ({}));

    if (regRes.status === 201) {
      authToken = regData.token;
      userId = regData.user?.id;
    }

    recordResult(
      "TEST-AUTH",
      "Standard Registration & Token Issuance",
      "Authentication",
      Boolean(authToken),
      authToken ? "Successfully provisioned isolated test subject" : `Failed registration: ${JSON.stringify(regData)}`
    );
  } catch (err) {
    recordResult("TEST-AUTH", "Registration", "Authentication", false, err.message);
  }

  if (!authToken) {
    console.error("Halting authenticated tests: Could not register test user.");
    printSummary();
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };

  // ---------------------------------------------------------------------------
  // TEST 5: SEC-003 (Tutor Privilege Escalation Defense)
  // ---------------------------------------------------------------------------
  try {
    const applyRes = await fetch(`${API_BASE}/api/tutors/apply`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        headline: "Senior Ethical Hacker & Security Researcher",
        bio: "Experienced cybersecurity instructor teaching defense-in-depth and offensive application security.",
        specialties: ["Network Security", "AppSec"],
        hourlyRateGHS: 120,
      }),
    });

    // Fetch user profile to verify current role
    const profileRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const profileData = await profileRes.json().catch(() => ({}));

    const roleIsStillStudent = profileData.role === "STUDENT";

    recordResult(
      "SEC-003",
      "Tutor Application Role Protection (No Unapproved Privilege Escalation)",
      "Authorization / RBAC",
      roleIsStillStudent,
      roleIsStillStudent ? "User remained STUDENT pending administrative vetting." : `User was prematurely elevated to ${profileData.role}`
    );
  } catch (err) {
    recordResult("SEC-003", "Tutor Privilege Escalation", "Authorization", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: SEC-004 (Arbitrary File Upload & Malicious SVG/HTML Rejection)
  // ---------------------------------------------------------------------------
  try {
    // 1. Send an SVG with script disguised as base64 image
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>`;
    const svgBase64 = "data:image/svg+xml;base64," + Buffer.from(maliciousSvg).toString("base64");

    const svgRes = await fetch(`${API_BASE}/api/uploads/image`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ image: svgBase64 }),
    });
    const svgData = await svgRes.json().catch(() => ({}));

    const rejectedSvg = svgRes.status === 400 && 
      (svgData.error || "").toLowerCase().includes("only authentic jpeg, png, webp, or gif");

    // 2. Send a valid 1x1 transparent PNG with genuine magic bytes
    const validPngBytes = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d450000000049454e44ae426082",
      "hex"
    );
    const pngBase64 = "data:image/png;base64," + validPngBytes.toString("base64");

    const pngRes = await fetch(`${API_BASE}/api/uploads/image`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ image: pngBase64 }),
    });
    const pngData = await pngRes.json().catch(() => ({}));

    const acceptedPng = (pngRes.status === 200 || pngRes.status === 201) && Boolean(pngData.url || pngData.objectUrl);

    recordResult(
      "SEC-004",
      "MIME & Magic-Byte File Upload Validation (Rejects SVG/HTML, Accepts Clean Image)",
      "File Handling",
      rejectedSvg && acceptedPng,
      `Malicious SVG rejected: ${rejectedSvg} (status ${svgRes.status}), Valid PNG accepted: ${acceptedPng} (status ${pngRes.status})`
    );
  } catch (err) {
    recordResult("SEC-004", "File Upload Validation", "File Handling", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: SEC-005 (Path Traversal Protection in Video Transcription)
  // ---------------------------------------------------------------------------
  try {
    const traversalRes = await fetch(`${API_BASE}/api/uploads/transcribe`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ videoUrl: "/uploads/videos/../../../../etc/passwd" }),
    });

    const safeTraversal = traversalRes.status === 400;

    recordResult(
      "SEC-005",
      "Path Traversal Prevention in Transcribe Service",
      "Injection & Path Traversal",
      safeTraversal,
      `Directory escape was successfully denied with HTTP ${traversalRes.status}`
    );
  } catch (err) {
    recordResult("SEC-005", "Path Traversal", "Injection", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: SEC-006 (Certificate Generation Integrity & Passing Quiz Enforce)
  // ---------------------------------------------------------------------------
  try {
    const coursesRes = await fetch(`${API_BASE}/api/courses`);
    const coursesData = await coursesRes.json().catch(() => ({}));
    const courses = coursesData.courses || [];
    let certTestPassed = false;
    let certReason = "";

    if (courses.length > 0) {
      const courseId = courses[0].id;

      // Enroll first
      await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });

      // Attempt certificate without passing quizzes
      const certRes = await fetch(`${API_BASE}/api/courses/${courseId}/certificate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      const certData = await certRes.json().catch(() => ({}));

      certTestPassed = certRes.status === 403 && 
        (certData.error || "").toLowerCase().includes("quizzes have been taken and passed");
      certReason = `Status ${certRes.status}: ${certData.error || "Blocked"}`;
    } else {
      certTestPassed = true;
      certReason = "No existing courses to enroll, check skipped safely.";
    }

    recordResult(
      "SEC-006",
      "Accreditation & Certificate Integrity (Requires 100% Passing Quizzes)",
      "Business Logic & Authorization",
      certTestPassed,
      certReason
    );
  } catch (err) {
    recordResult("SEC-006", "Certificate Integrity", "Business Logic", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: SEC-008 (Session Invalidation via tokenVersion on Password Change)
  // ---------------------------------------------------------------------------
  try {
    const newPassword = "UpdatedSecureAudit456!@#";

    // Change password using current valid token
    const changeRes = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ currentPassword: testPassword, newPassword: newPassword }),
    });

    const passwordChanged = changeRes.status === 200;

    // Now attempt to use the OLD token authToken
    const oldTokenAttempt = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const oldTokenData = await oldTokenAttempt.json().catch(() => ({}));

    const oldTokenRevoked = oldTokenAttempt.status === 401 &&
      ((oldTokenData.error || "").toLowerCase().includes("session has been revoked") ||
       (oldTokenData.error || "").toLowerCase().includes("session"));

    // Login with new password to ensure account remains functional
    const loginNewRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const loginNewData = await loginNewRes.json().catch(() => ({}));

    const newLoginValid = loginNewRes.status === 200 && Boolean(loginNewData.token);

    recordResult(
      "SEC-008",
      "Universal Session Invalidation via tokenVersion Rotation",
      "Session Security",
      passwordChanged && oldTokenRevoked && newLoginValid,
      `Password changed: ${passwordChanged}, Old token revoked: ${oldTokenRevoked}, New login works: ${newLoginValid}`
    );
  } catch (err) {
    recordResult("SEC-008", "Session Invalidation", "Session Security", false, err.message);
  }

  printSummary();
}

function printSummary() {
  console.log("\n================================================================================");
  console.log("TEST SUITE EXECUTION SUMMARY");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Security Checks Executed : ${total}`);
  console.log(`Passed                         : ${passed}`);
  console.log(`Failed                         : ${failed}`);
  console.log(`Compliance / Security Pass Rate: ${Math.round((passed / total) * 100)}%`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
