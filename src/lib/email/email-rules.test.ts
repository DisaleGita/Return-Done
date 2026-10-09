import { describe, expect, it } from "vitest";
import { checkDomainRules, suggestEmail } from "./email-rules";

describe("suggestEmail", () => {
  it.each([
    ["customer@gnail.com", "customer@gmail.com"],
    ["a@gmial.com", "a@gmail.com"],
    ["a@gmai.com", "a@gmail.com"],
    ["a@gmaill.com", "a@gmail.com"],
    ["a@gmail.con", "a@gmail.com"],
    ["a@gmail.co", "a@gmail.com"],
    ["a@hotmial.com", "a@hotmail.com"],
    ["a@yaho.com", "a@yahoo.com"],
    ["a@yahooo.com", "a@yahoo.com"],
    ["a@outlok.com", "a@outlook.com"],
    ["a@icloud.co", "a@icloud.com"],
    ["Customer.Name@GNAIL.COM", "Customer.Name@gmail.com"],
  ])("%s → %s", (input, expected) => {
    expect(suggestEmail(input)).toBe(expected);
  });

  it.each([
    "someone@gmail.com",
    "a@hawk.iit.edu",
    "a@yahoo.co.uk",
    "a@hotmail.fr",
    "a@outlook.de",
    "a@mail.com",
    "a@email.com",
    "a@ymail.com",
    "a@me.com",
    "a@live.com",
    "a@aol.com",
    "a@proton.me",
    "a@gmx.com",
    "a@comcast.net",
    "a@company.io",
  ])("leaves real address %s alone", (email) => {
    expect(suggestEmail(email)).toBeNull();
    expect(checkDomainRules(email)).toEqual({ ok: true });
  });
});

describe("checkDomainRules", () => {
  it("asks about likely typos instead of emailing a stranger's domain", () => {
    expect(checkDomainRules("customer@gnail.com")).toEqual({
      ok: false,
      message: "Did you mean customer@gmail.com?",
      suggestion: "customer@gmail.com",
    });
  });

  it("turns away placeholder domains people type to avoid giving an email", () => {
    for (const email of ["anc@abc.com", "a@test.com", "a@xyz.com", "a@asdf.com"]) {
      expect(checkDomainRules(email)).toEqual({
        ok: false,
        message: "Please use your real email address so we can reach you",
      });
    }
  });
});
