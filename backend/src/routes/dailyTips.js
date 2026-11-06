const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { resolveClientOrigin } = require("../utils/mailer");
const {
  DEFAULT_TIMEZONE,
  getZonedTimeParts,
  getTipForDate,
  verifyUnsubscribeToken,
  getDailyTipsScheduleConfig,
  setDailyTipsScheduleConfig,
  dispatchDailySafetyTips,
} = require("../services/dailyTipsService");

const router = express.Router();

/**
 * Public one-click unsubscribe handler (supports GET browser clicks & POST RFC 8058 one-click)
 */
async function handleUnsubscribe(req, res) {
  const token = req.query.token || req.body?.token;
  const clientOrigin = resolveClientOrigin(req.headers.origin);

  if (!token || typeof token !== "string") {
    return res.status(400).send("Missing unsubscribe token.");
  }

  try {
    const payload = verifyUnsubscribeToken(token);
    await prisma.user.updateMany({
      where: { id: payload.id },
      data: { receiveDailyTips: false },
    });

    if (req.method === "POST" || req.headers.accept?.includes("application/json")) {
      return res.json({ success: true, message: "You have been unsubscribed from Daily Cyber Safety Tips." });
    }

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Unsubscribed — CyberGuard Ghana</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { max-width: 440px; width: 100%; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 4px 16px rgba(15,23,42,0.05); }
          h1 { font-size: 20px; margin: 0 0 10px 0; }
          p { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 22px 0; }
          a { display: inline-block; background: #0056D2; color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Daily Tips Paused</h1>
          <p>We have unsubscribed <strong>${payload.email || "your email"}</strong> from the 7:00 AM Daily Cyber Safety Tips. You can re-enable them anytime in your Dashboard settings.</p>
          <a href="${clientOrigin}/dashboard?tab=settings">Return to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(400).send("Invalid or expired unsubscribe link.");
  }
}

router.get("/unsubscribe", handleUnsubscribe);
router.post("/unsubscribe", handleUnsubscribe);

/**
 * Optional external Cron webhook endpoint (e.g. for serverless cron triggers at 0 7 * * *)
 * Protected by CRON_SECRET environment variable.
 */
router.post("/cron", async (req, res, next) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(403).json({ error: "CRON_SECRET is not configured on this server." });
    }
    const authHeader = req.headers.authorization || "";
    const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!provided || provided !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized cron invocation." });
    }

    const result = await dispatchDailySafetyTips({ triggerType: "SCHEDULED_7AM", force: false });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Superadmin (ADMIN): Get current daily tips schedule settings
 */
router.get("/schedule", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const schedule = await getDailyTipsScheduleConfig();
    const { dateStr, hour, minute } = getZonedTimeParts(new Date());
    const todayScheduledDispatch = await prisma.dailyTipDispatch.findFirst({
      where: { dispatchDate: dateStr, triggerType: { startsWith: "SCHEDULED" } },
    });

    const isBeforeScheduledTimeToday =
      hour < schedule.hour || (hour === schedule.hour && minute < schedule.minute);

    const nextScheduledRunLabel = !schedule.enabled
      ? "Disabled by Admin"
      : isBeforeScheduledTimeToday && !todayScheduledDispatch
      ? `Today at ${schedule.displayTime} GMT`
      : `Tomorrow at ${schedule.displayTime} GMT`;

    res.json({
      ...schedule,
      dispatchedToday: Boolean(todayScheduledDispatch),
      nextScheduledRunLabel,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Superadmin (ADMIN): Update daily tips dispatch schedule
 */
router.patch("/schedule", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { hour, minute, enabled } = req.body;
    if (hour === undefined || isNaN(parseInt(hour, 10)) || parseInt(hour, 10) < 0 || parseInt(hour, 10) > 23) {
      return res.status(400).json({ error: "Hour must be an integer between 0 and 23." });
    }
    const cleanMinute = minute !== undefined ? parseInt(minute, 10) : 0;
    if (isNaN(cleanMinute) || cleanMinute < 0 || cleanMinute > 59) {
      return res.status(400).json({ error: "Minute must be an integer between 0 and 59." });
    }

    const updated = await setDailyTipsScheduleConfig({
      hour: parseInt(hour, 10),
      minute: cleanMinute,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
    });

    res.json({
      success: true,
      message: `Daily tips dispatch schedule updated to ${updated.displayTime} GMT (${updated.enabled ? "Active" : "Paused"}).`,
      schedule: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Superadmin (ADMIN): Fetch comprehensive Daily Tips email logs, daily dispatches, and active subscribers
 */
router.get("/logs", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { date, search, status } = req.query;
    const { dateStr: todayDateStr, hour, minute } = getZonedTimeParts(new Date());
    const todaysTip = getTipForDate(new Date());
    const schedule = await getDailyTipsScheduleConfig();

    const logWhere = {
      ...(date ? { dispatchDate: String(date).trim() } : {}),
      ...(status && ["SENT", "FAILED"].includes(String(status).toUpperCase())
        ? { status: String(status).toUpperCase() }
        : {}),
      ...(search
        ? {
            OR: [
              { recipientEmail: { contains: String(search).trim(), mode: "insensitive" } },
              { recipientName: { contains: String(search).trim(), mode: "insensitive" } },
              { tipTitle: { contains: String(search).trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [
      activeSubscribersCount,
      subscribers,
      totalSentCount,
      totalFailedCount,
      sentTodayCount,
      todayScheduledDispatch,
      dispatches,
      emailLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { receiveDailyTips: true } }),
      prisma.user.findMany({
        where: { receiveDailyTips: true },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dailyTipEmailLog.count({ where: { status: "SENT" } }),
      prisma.dailyTipEmailLog.count({ where: { status: "FAILED" } }),
      prisma.dailyTipEmailLog.count({ where: { dispatchDate: todayDateStr, status: "SENT" } }),
      prisma.dailyTipDispatch.findFirst({
        where: { dispatchDate: todayDateStr, triggerType: { startsWith: "SCHEDULED" } },
      }),
      prisma.dailyTipDispatch.findMany({
        where: date ? { dispatchDate: String(date).trim() } : {},
        include: {
          logs: {
            where: {
              ...(status && ["SENT", "FAILED"].includes(String(status).toUpperCase())
                ? { status: String(status).toUpperCase() }
                : {}),
              ...(search
                ? {
                    OR: [
                      { recipientEmail: { contains: String(search).trim(), mode: "insensitive" } },
                      { recipientName: { contains: String(search).trim(), mode: "insensitive" } },
                      { tipTitle: { contains: String(search).trim(), mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            orderBy: { sentAt: "desc" },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 60,
      }),
      prisma.dailyTipEmailLog.findMany({
        where: logWhere,
        orderBy: { sentAt: "desc" },
        take: 500,
      }),
    ]);

    const isBeforeScheduledTimeToday =
      hour < schedule.hour || (hour === schedule.hour && minute < schedule.minute);

    const nextRunDayLabel = !schedule.enabled
      ? "Disabled by Admin"
      : isBeforeScheduledTimeToday && !todayScheduledDispatch
      ? `Today at ${schedule.displayTime} GMT`
      : `Tomorrow at ${schedule.displayTime} GMT`;

    res.json({
      summary: {
        activeSubscribers: activeSubscribersCount,
        totalEmailsSent: totalSentCount,
        totalFailed: totalFailedCount,
        sentTodayCount,
        todayDateStr,
        dispatchedToday: Boolean(todayScheduledDispatch),
        nextScheduledRunLabel: nextRunDayLabel,
        timezone: DEFAULT_TIMEZONE,
        schedule,
        todaysTip: {
          index: todaysTip.index,
          category: todaysTip.category,
          title: todaysTip.title,
          summary: todaysTip.summary,
          actionStep: todaysTip.actionStep,
        },
      },
      dispatches,
      emailLogs,
      subscribers,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Superadmin (ADMIN): Manually trigger today's cyber safety tip broadcast immediately
 * and record every recipient email in the daily logs.
 */
router.post("/dispatch-now", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const result = await dispatchDailySafetyTips({
      triggerType: "MANUAL_ADMIN",
      force: true,
    });

    if (result.skipped) {
      return res.status(409).json({ error: result.reason });
    }

    res.json({
      success: true,
      message: `Daily cyber safety tip dispatched to ${result.dispatch.sentCount} subscriber(s).`,
      dispatch: result.dispatch,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
