/* eslint-disable no-unused-vars */

/**
 * Last-resort error handler. Keeps stack traces out of API responses
 * in production while still logging them server-side for debugging.
 */
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    return res.status(409).json({ error: "A record with that value already exists." });
  }
  if (err.code === "P2025") {
    // Prisma record not found
    return res.status(404).json({ error: "Record not found." });
  }

  if (err.code === "P1001" || err.message?.includes("Can't reach database server")) {
    return res.status(503).json({
      error: "Database service is currently unavailable or paused on Supabase. Please verify your Supabase project status or update your DATABASE_URL in backend/.env.",
    });
  }

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Something went wrong on our end. Please try again."
      : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
