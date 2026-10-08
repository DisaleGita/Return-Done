import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { ValidatedAttachment } from "../attachments";
import { siteConfig } from "../config";
import type { ReturnRecord } from "../returns";
import { renderConfirmationEmail } from "./confirmation-email";
import {
  claimEmailSlot,
  createMemoryStore,
  createUpstashStore,
  readLimits,
  type QuotaResult,
  type QuotaStore,
} from "./quota";
import { isRecipientAllowed } from "./recipients";
import { createRedisUrlStore } from "./redis-store";
import type { EmailResult } from "./types";

export type EmailMode = "off" | "test" | "smtp";

/**
 * EMAIL_MODE wins if set. Otherwise email is sent for real as soon as SMTP
 * credentials are configured, and is off when they aren't.
 */
export function getEmailMode(): EmailMode {
  const mode = process.env.EMAIL_MODE?.trim().toLowerCase();
  if (mode === "test" || mode === "smtp" || mode === "off") return mode;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return SMTP_HOST && SMTP_USER && SMTP_PASS ? "smtp" : "off";
}

// Ethereal test accounts are free but slow to create, so reuse one per server instance.
let testTransport: Promise<Transporter> | null = null;

function getTestTransport(): Promise<Transporter> {
  testTransport ??= nodemailer.createTestAccount().then((account) =>
    nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    }),
  );
  // Don't cache a failure; try again next time.
  testTransport.catch(() => (testTransport = null));
  return testTransport;
}

function getSmtpTransport(): Transporter {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("EMAIL_MODE=smtp needs SMTP_HOST, SMTP_USER and SMTP_PASS");
  }
  const port = Number(SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

let memoryStore: QuotaStore | null = null;

/** Upstash REST or a Redis URL in production; in memory for local development. */
function getQuotaStore(): QuotaStore | null {
  const redis = createUpstashStore() ?? createRedisUrlStore();
  if (redis) return redis;
  if (process.env.VERCEL) return null; // memory isn't shared between serverless instances
  return (memoryStore ??= createMemoryStore());
}

/** Enforces EMAIL_MAX_RECIPIENTS. Fails closed: if counting fails, nothing is sent. */
async function checkQuota(to: string): Promise<QuotaResult> {
  const limits = readLimits();
  if (!limits) return { ok: true };
  const store = getQuotaStore();
  if (!store) {
    console.error("[email] email limits need a Redis store, but none is connected");
    return { ok: false, reason: "Demo emails are paused while the email limit is being set up" };
  }
  try {
    return await claimEmailSlot(to, limits, store);
  } catch (error) {
    console.error("[email] quota check failed:", error instanceof Error ? error.message : error);
    return { ok: false, reason: "We couldn't check this demo's email limit right now" };
  }
}

/**
 * Sends the pickup confirmation. Never throws: a booking must not fail because
 * an email couldn't be sent.
 */
export async function sendConfirmationEmail(
  record: ReturnRecord,
  to: string,
  attachments: ValidatedAttachment[] = [],
): Promise<EmailResult> {
  const mode = getEmailMode();
  if (mode === "off") return { status: "skipped", reason: "Email is turned off for this demo" };
  if (mode === "smtp" && !isRecipientAllowed(to, process.env.EMAIL_ALLOWED_RECIPIENTS)) {
    return { status: "skipped", reason: "That address isn't on this demo's allow-list" };
  }
  if (mode === "smtp") {
    const quota = await checkQuota(to);
    if (!quota.ok) return { status: "skipped", reason: quota.reason };
  }

  const content = renderConfirmationEmail(record, siteConfig.url);
  const from = process.env.EMAIL_FROM || `"Return Done" <no-reply@returndone.example>`;

  try {
    const transport = mode === "test" ? await getTestTransport() : getSmtpTransport();
    const info = await transport.sendMail({
      from,
      to,
      ...content,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.type,
      })),
    });
    if (mode === "test") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      return previewUrl ? { status: "sent", mode: "test", previewUrl } : { status: "failed" };
    }
    return { status: "sent", mode: "smtp" };
  } catch (error) {
    console.error("[email] confirmation failed:", error instanceof Error ? error.message : error);
    return { status: "failed" };
  }
}
