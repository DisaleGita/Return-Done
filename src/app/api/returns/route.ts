import { NextResponse } from "next/server";
import { validateAttachments, type ValidatedAttachment } from "@/lib/attachments";
import { buildReturnRecord } from "@/lib/create-return";
import { addDays, parseISODate } from "@/lib/dates";
import { schedulingConfig } from "@/lib/config";
import { checkEmailAddress } from "@/lib/email/address-check";
import { sendConfirmationEmail } from "@/lib/email/send";
import { createReturnSchema, toFieldErrors } from "@/lib/schemas";

/**
 * POST /api/returns — validates a pickup request, prices it and returns the
 * new return record.
 *
 * In this demo the record is persisted by the client (localStorage). In
 * production this handler is where the database write and payment intent
 * would go. A confirmation email is sent to the customer (see EMAIL_MODE); the
 * address itself isn't stored on the record.
 *
 * Accepts JSON, or multipart/form-data with the details as a JSON "payload"
 * field plus up to three "attachments" (return labels, QR codes, barcodes).
 * Attachments go into the confirmation email and are never stored.
 */
async function readRequest(
  request: Request,
): Promise<{ body: unknown; files: { name: string; bytes: Uint8Array }[] } | null> {
  try {
    if ((request.headers.get("content-type") ?? "").startsWith("multipart/form-data")) {
      const form = await request.formData();
      const payload = form.get("payload");
      if (typeof payload !== "string") return null;
      const files = await Promise.all(
        form
          .getAll("attachments")
          .filter((value): value is File => typeof value !== "string")
          .map(async (file) => ({
            name: file.name,
            bytes: new Uint8Array(await file.arrayBuffer()),
          })),
      );
      return { body: JSON.parse(payload), files };
    }
    return { body: await request.json(), files: [] };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const input = await readRequest(request);
  if (!input) {
    return NextResponse.json({ error: "Request body must be JSON or form data" }, { status: 400 });
  }
  const { body } = input;

  const checked = validateAttachments(input.files);
  if (!checked.ok) {
    return NextResponse.json(
      { error: checked.message, fieldErrors: { attachments: checked.message } },
      { status: 422 },
    );
  }
  const attachments: ValidatedAttachment[] = checked.files;

  const parsed = createReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some details need another look", fieldErrors: toFieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  // Exact window availability depends on the customer's time zone and is
  // enforced in the form. Here we only reject dates outside the booking range,
  // with a day of slack either side for time zone differences.
  const now = new Date();
  const pickup = parseISODate(parsed.data.pickup.date).getTime();
  const earliest = addDays(now, -1).getTime();
  const latest = addDays(now, schedulingConfig.bookingHorizonDays + 1).getTime();
  if (pickup < earliest || pickup > latest) {
    return NextResponse.json(
      {
        error: "That pickup date is outside our booking window",
        fieldErrors: { "pickup.date": "Choose a date in the next two weeks" },
      },
      { status: 422 },
    );
  }

  // Turn away made-up and throwaway addresses before booking anything.
  const address = await checkEmailAddress(parsed.data.contactEmail);
  if (!address.ok) {
    return NextResponse.json(
      { error: address.message, fieldErrors: { contactEmail: address.message } },
      { status: 422 },
    );
  }

  const record = {
    ...buildReturnRecord(parsed.data, now),
    attachments: attachments.map((a) => ({
      name: a.filename,
      type: a.type,
      size: a.content.byteLength,
    })),
  };
  const email = await sendConfirmationEmail(record, parsed.data.contactEmail, attachments);

  return NextResponse.json({ return: record, email }, { status: 201 });
}
