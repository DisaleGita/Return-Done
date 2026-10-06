/**
 * Optional allow-list for real delivery, so a public demo can't be used to
 * send mail to arbitrary addresses. Entries are full addresses or "@domain".
 * An empty list allows everyone.
 */
export function isRecipientAllowed(email: string, allowList: string | undefined): boolean {
  const entries = (allowList ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (entries.length === 0) return true;
  const address = email.trim().toLowerCase();
  return entries.some((entry) =>
    entry.startsWith("@") ? address.endsWith(entry) : address === entry,
  );
}
