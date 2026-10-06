import { resolve4, resolveMx } from "node:dns/promises";

/**
 * Throwaway inbox providers. Not exhaustive: the domain lookup below catches
 * made-up domains, and this catches the common real-but-disposable ones.
 */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "20minutemail.com",
  "33mail.com",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "sharklasers.com",
  "spamgourmet.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "tempmail.net",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "yopmail.com",
  "yopmail.fr",
]);

/** Domains reserved for documentation and testing (RFC 2606 / 6761). */
const RESERVED_DOMAINS = new Set(["example.com", "example.net", "example.org", "localhost"]);
const RESERVED_SUFFIXES = [".test", ".example", ".invalid", ".localhost", ".local"];

export type AddressCheck = { ok: true } | { ok: false; message: string };

const FAKE: AddressCheck = { ok: false, message: "Please use a real email address" };
const DISPOSABLE: AddressCheck = {
  ok: false,
  message: "Please use a permanent email address, not a temporary inbox",
};

export function domainOf(email: string): string {
  return email.trim().toLowerCase().split("@").pop() ?? "";
}

/** The checks that need no network access. */
export function checkDomainRules(email: string): AddressCheck {
  const domain = domainOf(email);
  if (!domain.includes(".")) return FAKE;
  const reserved = [...RESERVED_DOMAINS].some((d) => domain === d || domain.endsWith(`.${d}`));
  if (reserved || RESERVED_SUFFIXES.some((s) => domain.endsWith(s))) return FAKE;
  if (
    DISPOSABLE_DOMAINS.has(domain) ||
    [...DISPOSABLE_DOMAINS].some((d) => domain.endsWith(`.${d}`))
  ) {
    return DISPOSABLE;
  }
  return { ok: true };
}

export interface DnsResolver {
  resolveMx: (domain: string) => Promise<unknown[]>;
  resolve4: (domain: string) => Promise<unknown[]>;
}

const systemDns: DnsResolver = { resolveMx, resolve4 };

const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);
const isNotFound = (error: unknown) =>
  NOT_FOUND.has((error as NodeJS.ErrnoException | undefined)?.code ?? "");

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
  return Promise.race([promise, new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms))]);
}

/**
 * Rejects addresses that can't receive mail: reserved and disposable domains,
 * and domains with no mail (MX) or address (A) records. If DNS itself is slow
 * or failing, the address is allowed, so real customers are never blocked by
 * our own network trouble.
 */
export async function checkEmailAddress(
  email: string,
  dns: DnsResolver = systemDns,
  timeoutMs = 3000,
): Promise<AddressCheck> {
  const rules = checkDomainRules(email);
  if (!rules.ok) return rules;

  const domain = domainOf(email);
  try {
    const mx = await withTimeout(dns.resolveMx(domain), timeoutMs);
    if (mx === "timeout" || mx.length > 0) return { ok: true };
  } catch (error) {
    if (!isNotFound(error)) return { ok: true };
  }
  // No MX record: mail can still be delivered to the domain's A record.
  try {
    const a = await withTimeout(dns.resolve4(domain), timeoutMs);
    return a === "timeout" || a.length > 0 ? { ok: true } : FAKE;
  } catch (error) {
    return isNotFound(error) ? FAKE : { ok: true };
  }
}
