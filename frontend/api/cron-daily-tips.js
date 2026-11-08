const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN || "https://cyberguard-ghana.onrender.com";

const ALLOWED_VERCEL_HOST_REGEX = /^cyberguard-ghana(-[a-z0-9-]+)?\.vercel\.app$/i;

export default async function handler(req, res) {
  const rawHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  const clientOrigin = ALLOWED_VERCEL_HOST_REGEX.test(rawHost)
    ? `https://${rawHost}`
    : "https://cyberguard-ghana.vercel.app";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const targetUrl = `${BACKEND_ORIGIN.replace(/\/$/, "")}/api/health?clientOrigin=${encodeURIComponent(
      clientOrigin
    )}`;

    const resp = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Origin: clientOrigin,
        "User-Agent": "cyberguard-vercel-cron/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.status(200).json({
      ok: resp.ok,
      status: resp.status,
      wokeBackend: true,
      clientOrigin,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    return res.status(202).json({
      ok: true,
      waking: true,
      clientOrigin,
      note: err.name === "AbortError" ? "Backend wake-up initiated." : err.message,
    });
  }
}
