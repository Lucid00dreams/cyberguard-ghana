const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN || "https://cyberguard-ghana.onrender.com";

export default async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const clientOrigin = host ? `${proto}://${host}` : "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const targetUrl = `${BACKEND_ORIGIN.replace(/\/$/, "")}/api/health${
      clientOrigin ? `?clientOrigin=${encodeURIComponent(clientOrigin)}` : ""
    }`;

    const resp = await fetch(targetUrl, {
      method: "GET",
      headers: {
        ...(clientOrigin ? { Origin: clientOrigin } : {}),
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
    // Even if Render cold-start exceeds 8.5s, the wake-up TCP request has already been initiated
    return res.status(202).json({
      ok: true,
      waking: true,
      clientOrigin,
      note: err.name === "AbortError" ? "Backend wake-up initiated." : err.message,
    });
  }
}

