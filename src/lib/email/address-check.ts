import { resolve4, resolveMx } from "node:dns/promises";

import { checkDomainRules, domainOf, type AddressCheck } from "./email-rules";

export { checkDomainRules, domainOf, suggestEmail, type AddressCheck } from "./email-rules";

const FAKE: AddressCheck = { ok: false, message: "Please use a real email address" };

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
