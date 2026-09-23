import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveChatId, withChatAlias } from "./chatIdentity.ts";

test("resolves a local chat id to the server id", () => {
  const aliases = withChatAlias({}, "local-1", "server-1");
  assert.equal(resolveChatId("local-1", aliases), "server-1");
  assert.equal(resolveChatId("server-1", aliases), "server-1");
});

test("follows a chain and rewrites earlier aliases", () => {
  const once = withChatAlias({}, "local-1", "local-2");
  const twice = withChatAlias(once, "local-2", "server-9");
  assert.equal(resolveChatId("local-1", twice), "server-9");
  assert.equal(resolveChatId("local-2", twice), "server-9");
});
