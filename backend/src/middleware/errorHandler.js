/* eslint-disable no-unused-vars */

/**
 * Last-resort error handler. Keeps stack traces and internal infrastructure
 * details out of API responses in production while logging them server-side.
 */
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with that value already exists." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err.message && err.message.startsWith("Only authentic video files")) {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "P1001" || err.message?.includes("Can't reach database server")) {
    return res.status(503).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Database service is temporarily unavailable. Please try again shortly."
          : "Database service is currently unavailable. Please verify your database status or DATABASE_URL.",
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
