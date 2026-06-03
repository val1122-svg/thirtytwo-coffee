import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Support both naming styles:
// - BOT_TOKEN / CHAT_ID (this project)
// - TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (common)
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID || process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing BOT_TOKEN or CHAT_ID. Create a .env file (see README.md) before submitting orders."
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Basic request logging (helps debugging)
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`${req.method} ${req.url}`);
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Quick test endpoint to verify BOT_TOKEN + CHAT_ID works.
// Visit: http://localhost:3000/api/test-telegram
app.get("/api/test-telegram", async (_req, res) => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({
        ok: false,
        error: "Server is missing BOT_TOKEN or CHAT_ID (check .env)."
      });
    }
    await telegramSendMessage({
      botToken: BOT_TOKEN,
      chatId: CHAT_ID,
      text: "✅ Telegram test message from ThirtyTwo Coffee order server."
    });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Telegram test failed."
    });
  }
});

app.post("/api/submit-order", upload.single("screenshot"), async (req, res) => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({
        ok: false,
        error: "Server is missing BOT_TOKEN or CHAT_ID (check .env)."
      });
    }

    const {
      name,
      phone,
      pickupDate,
      pickupTime,
      total,
      orderLines = ""
    } = req.body || {};

    if (!name || !phone || !pickupDate || !pickupTime || !total) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Missing screenshot file upload." });
    }

    const message = [
      "☕ *NEW COFFEE ORDER*",
      "",
      `👤 Name: ${name}`,
      `☎️ Phone: ${phone}`,
      `📅 Pickup: ${pickupDate} ${pickupTime}`,
      "",
      "*Drinks*:",
      orderLines ? orderLines : "—",
      "",
      `💰 *TOTAL*: RM ${total}`
    ].join("\n");

    // 1) Send message
    await telegramSendMessage({ botToken: BOT_TOKEN, chatId: CHAT_ID, text: message });

    // 2) Send screenshot photo
    const caption = `Payment proof — ${name} — RM ${total}`;
    await telegramSendPhoto({
      botToken: BOT_TOKEN,
      chatId: CHAT_ID,
      caption,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname || "payment.jpg",
      mimeType: req.file.mimetype || "application/octet-stream"
    });

    return res.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit order to Telegram."
    });
  }
});

// Ensure unknown API routes return JSON (not HTML)
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "API route not found." });
});

async function telegramSendMessage({ botToken, chatId, text }) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown"
    })
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data?.ok) {
    throw new Error(data?.description || "Telegram sendMessage failed.");
  }
}

async function telegramSendPhoto({ botToken, chatId, caption, fileBuffer, fileName, mimeType }) {
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption || "");
  form.append("photo", new Blob([fileBuffer], { type: mimeType }), fileName);

  const resp = await fetch(url, { method: "POST", body: form });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data?.ok) {
    throw new Error(data?.description || "Telegram sendPhoto failed.");
  }
}

// Serve frontend (keep AFTER /api routes so /api never falls through to HTML)
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
