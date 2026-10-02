const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Verifies the Bearer JWT on the request and attaches the decoded
 * payload to req.user. Validates tokenVersion against the database
 * to enforce instantaneous session revocation upon password changes or logouts.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if tokenVersion matches database record
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, email: true, tokenVersion: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User account no longer exists." });
    }

    if (typeof payload.tokenVersion === "number" && user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: "Session has been revoked or password was changed. Please log in again." });
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
