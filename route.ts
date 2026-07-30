import { createHmac, timingSafeEqual } from "node:crypto";

type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
};

export function verifyTelegramRequest(request: Request): TelegramUser {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) throw new Error("BOT_TOKEN is not configured");

  const initData = request.headers.get("x-telegram-init-data");
  if (!initData) throw new Error("Open Self-Planner from Telegram");

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) throw new Error("Telegram signature is missing");

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const received = Buffer.from(receivedHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw new Error("Invalid Telegram signature");
  }

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > 86_400) {
    throw new Error("Telegram session has expired");
  }

  const rawUser = params.get("user");
  if (!rawUser) throw new Error("Telegram user is missing");
  const user = JSON.parse(rawUser) as TelegramUser;

  const allowedIds = [
    process.env.ALLOWED_TELEGRAM_ID_1,
    process.env.ALLOWED_TELEGRAM_ID_2,
  ]
    .filter(Boolean)
    .map(Number);

  if (!allowedIds.includes(user.id)) {
    throw new Error("Access denied");
  }

  return user;
}

export function userRole(userId: number) {
  return String(userId) === process.env.ALLOWED_TELEGRAM_ID_2
    ? "partner"
    : "me";
}
