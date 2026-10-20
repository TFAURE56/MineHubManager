import test from "node:test";
import assert from "node:assert/strict";
import { normalizePublicAddress } from "../public-address.mjs";

test("normalise une adresse de tunnel Minecraft partageable", () => {
  assert.equal(normalizePublicAddress(" minecraft://my-world.gl.joinmc.link:25512/ "), "my-world.gl.joinmc.link:25512");
  assert.equal(normalizePublicAddress("[2001:db8::1]"), "[2001:db8::1]");
  assert.equal(normalizePublicAddress(""), "");
});

test("refuse les adresses et ports invalides", () => {
  assert.throws(() => normalizePublicAddress("https://example.com/path"));
  assert.throws(() => normalizePublicAddress("example.com:70000"));
  assert.throws(() => normalizePublicAddress("not a host"));
});
