/** What happened to the confirmation email. Shared by the API and the UI. */
export type EmailResult =
  | { status: "skipped"; reason: string }
  | { status: "sent"; mode: "test"; previewUrl: string }
  | { status: "sent"; mode: "smtp" }
  | { status: "failed" };
