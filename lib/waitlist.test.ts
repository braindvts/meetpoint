import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hyphenateNotionId,
  INTERLINK_WAITLIST_DATABASE_ID,
  notionPageProperties,
  parseWaitlistInput,
  waitlistTitle,
} from "./waitlist";

describe("parseWaitlistInput", () => {
  it("requires a real email", () => {
    assert.equal(parseWaitlistInput({ email: "" }).ok, false);
    assert.equal(parseWaitlistInput({ email: "not-an-email" }).ok, false);
    assert.equal(parseWaitlistInput({ email: "missing@" }).ok, false);
  });

  it("normalizes email and optional name", () => {
    const parsed = parseWaitlistInput({
      email: "  Brian@Interlink.app ",
      name: "  Brian Nguyen  ",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.email, "brian@interlink.app");
    assert.equal(parsed.value.name, "Brian Nguyen");
  });

  it("rejects honeypot submissions", () => {
    const parsed = parseWaitlistInput({
      email: "ok@example.com",
      company: "bot",
    });
    assert.equal(parsed.ok, false);
  });
});

describe("Notion waitlist payload", () => {
  it("hyphenates the Interlink database id", () => {
    assert.equal(
      hyphenateNotionId(INTERLINK_WAITLIST_DATABASE_ID),
      "a6ffe8d8-65f9-4b25-a851-e2331a31c65b",
    );
  });

  it("sets Source to Waitlist and uses name as title", () => {
    const props = notionPageProperties("ada@example.com", "Ada Lovelace");
    assert.equal(props.Source.select.name, "Waitlist");
    assert.equal(props.Email.email, "ada@example.com");
    assert.equal(props.Name.title[0].text.content, "Ada Lovelace");
  });

  it("falls back to the email local-part when name is empty", () => {
    assert.equal(waitlistTitle("ada@example.com", ""), "ada");
  });
});
