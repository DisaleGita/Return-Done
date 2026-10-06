import { formatLongDate } from "../dates";
import { formatMoney } from "../pricing";
import type { ReturnRecord } from "../returns";
import { windowLabel } from "../scheduling";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Everything a customer typed goes through this. The 2023 emails didn't escape input. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The pickup confirmation, adapted from the email the 2023 service sent:
 * request ID, pickup details, item details and what to do next.
 */
/** Shown at the top of every email so nobody mistakes it for a real booking. */
export const TEST_EMAIL_DISCLAIMER =
  "This is a test email from the Return Done demo website, a portfolio project. No real pickup has been scheduled, no driver will come to your address, and no payment was taken. If you didn't request this, you can safely ignore it.";

export function renderConfirmationEmail(record: ReturnRecord, siteUrl: string): EmailContent {
  const { address } = record.pickup;
  const when = `${formatLongDate(record.pickup.date)}, ${windowLabel(record.pickup.windowId)}`;
  const where = [address.line1, address.line2, `${address.city}, ${address.state} ${address.zip}`]
    .filter(Boolean)
    .join(", ");
  const item = `${record.itemDescription}${record.itemCount > 1 ? ` ×${record.itemCount}` : ""}`;
  const trackUrl = `${siteUrl.replace(/\/$/, "")}/returns/${record.id}`;

  const rows: [string, string][] = [
    ["Tracking number", record.id],
    ["Returning", `${item} to ${record.retailerName}`],
    ["Pickup", when],
    ["Address", where],
    ...(record.pickup.instructions
      ? ([["Instructions", record.pickup.instructions]] as [string, string][])
      : []),
    ["Total", `${formatMoney(record.price.total)} (demo, no payment taken)`],
  ];

  const subject = `[TEST] Your Return Done pickup is scheduled (${record.id})`;

  const text = [
    `TEST EMAIL: ${TEST_EMAIL_DISCLAIMER}`,
    "",
    "Your return is scheduled.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Leave the item unpacked. Our driver checks it at the door, then packs and labels it.",
    "You can reschedule up to two hours before your window starts.",
    "",
    `Track your return: ${trackUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f6f9f8;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#132322">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto 16px;background:#fff7eb;border:1px solid #f5c983;border-radius:12px">
      <tr><td style="padding:14px 18px;font-size:14px;line-height:1.5;color:#92400e">
        <strong style="display:block;margin-bottom:2px;color:#7a3409">⚠️ Test email</strong>
        ${escapeHtml(TEST_EMAIL_DISCLAIMER)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe7e6;border-radius:16px">
      <tr><td style="padding:28px 28px 8px">
        <p style="margin:0;font-size:15px;font-weight:700;color:#0a7b77">Return Done</p>
        <h1 style="margin:16px 0 4px;font-size:24px;line-height:1.25">Your return is scheduled 🎉</h1>
        <p style="margin:0;color:#4a5c5e">We'll see you ${escapeHtml(when)}.</p>
      </td></tr>
      <tr><td style="padding:16px 28px">
        <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">
          ${rows
            .map(
              ([label, value]) => `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eef3f2;color:#687a7b;width:38%;vertical-align:top">${escapeHtml(label)}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eef3f2;font-weight:600">${escapeHtml(value)}</td>
          </tr>`,
            )
            .join("")}
        </table>
      </td></tr>
      <tr><td style="padding:8px 28px 4px;font-size:14px;color:#4a5c5e">
        <p style="margin:0 0 8px">Leave the item unpacked. Our driver checks it at the door, then packs and labels it.</p>
        <p style="margin:0">You can reschedule up to two hours before your window starts.</p>
      </td></tr>
      <tr><td style="padding:20px 28px 28px">
        <a href="${escapeHtml(trackUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0a7b77;color:#ffffff;font-weight:600;text-decoration:none">Track your return</a>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
