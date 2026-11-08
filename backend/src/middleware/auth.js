const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Verifies the Bearer JWT on the request and attaches the decoded
 * payload to req.user. Enforces token purpose separation and validates
 * tokenVersion against the database for immediate session revocation.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, String(process.env.JWT_SECRET), {
      algorithms: ["HS256"],
    });

    if (!payload || typeof payload === "string" || !payload.id) {
      return res.status(401).json({ error: "Invalid token payload." });
    }

    // Reject single-purpose tokens (e.g. unsubscribe_daily_tips, registration_verified, password_reset)
    if (payload.purpose && payload.purpose !== "session") {
      return res.status(401).json({ error: "Invalid token type for session authentication." });
    }

    if (typeof payload.tokenVersion !== "number") {
      return res.status(401).json({ error: "Invalid or legacy token format. Please log in again." });
    }

    // Check if user exists and tokenVersion matches database record
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, email: true, tokenVersion: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User account no longer exists." });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({
        error: "Session has been revoked or password was changed. Please log in again.",
      });
    }

    // Attach latest role and user info from database
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 * Usage: requireRole("ADMIN", "CSA_OFFICER")
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
