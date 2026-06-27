import { Router } from "express";
import { db } from "@workspace/db";
import { subscribersTable } from "@workspace/db";
import { count } from "drizzle-orm";

const router = Router();

router.post("/subscribe", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "invalid_email", message: "请提供有效的邮箱地址" });
    return;
  }

  try {
    await db.insert(subscribersTable).values({ email: email.toLowerCase().trim() }).onConflictDoNothing();

    const [{ value: total }] = await db.select({ value: count() }).from(subscribersTable);

    res.json({ success: true, subscriber_count: Number(total) });
  } catch (err) {
    req.log.error({ err }, "subscribe error");
    res.status(500).json({ error: "server_error", message: "订阅失败，请稍后重试" });
  }
});

router.get("/subscribe/count", async (req, res) => {
  try {
    const [{ value: total }] = await db.select({ value: count() }).from(subscribersTable);
    res.json({ subscriber_count: Number(total) });
  } catch (err) {
    req.log.error({ err }, "subscribe count error");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
