import { NextResponse } from "next/server";
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
 * would go. If the customer gave an email address, a confirmation is sent
 * (see EMAIL_MODE); the address itself isn't stored on the record.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

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

  const record = buildReturnRecord(parsed.data, now);
  const email = await sendConfirmationEmail(record, parsed.data.contactEmail);

  return NextResponse.json({ return: record, email }, { status: 201 });
}
