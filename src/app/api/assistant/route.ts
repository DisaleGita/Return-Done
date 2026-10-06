import { NextResponse } from "next/server";
import { analyzeReturnText } from "@/lib/assistant/analyze";
import { assistantRequestSchema, toFieldErrors } from "@/lib/schemas";

/** POST /api/assistant — extracts return details from pasted text. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const parsed = assistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errors = toFieldErrors(parsed.error);
    return NextResponse.json({ error: errors.text ?? "Invalid request" }, { status: 422 });
  }

  try {
    const result = await analyzeReturnText(parsed.data.text, new Date());
    return NextResponse.json(result);
  } catch (error) {
    console.error("[assistant] analysis failed", error);
    return NextResponse.json(
      { error: "We couldn't read that text. Try again in a moment." },
      { status: 500 },
    );
  }
}

/** GET /api/assistant — reports which engine is active, so the UI can label it honestly. */
export async function GET() {
  return NextResponse.json({ engine: process.env.ANTHROPIC_API_KEY ? "claude" : "rules" });
}
