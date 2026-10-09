/**
 * Email address checks that need no network access, so they run both in the
 * browser (on the first booking step) and on the server. The server also
 * checks that the domain can receive mail; see address-check.ts.
 */

/**
 * Throwaway inbox providers. Not exhaustive: the domain lookup catches
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

/**
 * Real domains that people type as stand-ins for an email they don't want to
 * give. They pass a DNS check (abc.com belongs to ABC), but nobody's personal
 * inbox is there.
 */
const PLACEHOLDER_DOMAINS = new Set([
  "abc.com",
  "abcd.com",
  "asd.com",
  "asdf.com",
  "company.com",
  "domain.com",
  "fake.com",
  "fakeemail.com",
  "mycompany.com",
  "mydomain.com",
  "noemail.com",
  "nomail.com",
  "none.com",
  "null.com",
  "qwerty.com",
  "sample.com",
  "test.com",
  "testing.com",
  "website.com",
  "xyz.com",
  "yourdomain.com",
  "123.com",
]);

/** Providers whose misspellings are worth catching. */
const MAJOR_PROVIDERS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "protonmail.com",
  "comcast.net",
] as const;

/** Real mail domains that look like misspellings of the ones above. */
const KNOWN_PROVIDERS = new Set<string>([
  ...MAJOR_PROVIDERS,
  "mail.com",
  "email.com",
  "ymail.com",
  "rocketmail.com",
  "gmx.com",
  "zoho.com",
  "yandex.com",
  "fastmail.com",
  "hey.com",
  "me.com",
  "mac.com",
  "live.com",
  "msn.com",
  "aol.com",
  "aim.com",
  "proton.me",
  "pm.me",
]);

/** Endings people type instead of ".com". */
const TYPO_TLDS = new Set([
  "con",
  "cmo",
  "cm",
  "om",
  "co",
  "comm",
  "coom",
  "vom",
  "xom",
  "cpm",
  "ocm",
  "c0m",
]);

export type AddressCheck = { ok: true } | { ok: false; message: string; suggestion?: string };

const FAKE: AddressCheck = { ok: false, message: "Please use a real email address" };
const DISPOSABLE: AddressCheck = {
  ok: false,
  message: "Please use a permanent email address, not a temporary inbox",
};

export function domainOf(email: string): string {
  return email.trim().toLowerCase().split("@").pop() ?? "";
}

/** Edit distance that counts a swap of neighbouring letters ("gmial") as one edit. */
function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

/** The major provider a domain looks like a misspelling of, if any. */
function likelyProvider(domain: string): string | null {
  if (KNOWN_PROVIDERS.has(domain)) return null;
  const dot = domain.lastIndexOf(".");
  const base = domain.slice(0, dot);
  const tld = domain.slice(dot + 1);
  for (const provider of MAJOR_PROVIDERS) {
    const pDot = provider.lastIndexOf(".");
    const pBase = provider.slice(0, pDot);
    const pTld = provider.slice(pDot + 1);
    const tldOk = tld === pTld || TYPO_TLDS.has(tld);
    // "gmail.con", "gmail.co"
    if (base === pBase && tld !== pTld && TYPO_TLDS.has(tld)) return provider;
    // "gnail.com", "gmial.com", "hotmial.com", "yaho.com"
    const allowed = pBase.length >= 7 ? 2 : 1;
    if (tldOk && base !== pBase && editDistance(base, pBase) <= allowed) return provider;
  }
  return null;
}

/** "customer@gnail.com" → "customer@gmail.com", or null if nothing looks mistyped. */
export function suggestEmail(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return null;
  const provider = likelyProvider(trimmed.slice(at + 1).toLowerCase());
  return provider ? `${trimmed.slice(0, at)}@${provider}` : null;
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
  if (PLACEHOLDER_DOMAINS.has(domain)) {
    return { ok: false, message: "Please use your real email address so we can reach you" };
  }
  const suggestion = suggestEmail(email);
  if (suggestion) return { ok: false, message: `Did you mean ${suggestion}?`, suggestion };
  return { ok: true };
}
