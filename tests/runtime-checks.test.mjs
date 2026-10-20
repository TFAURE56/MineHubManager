import test from "node:test";
import assert from "node:assert/strict";
import { inspectNodeVersion, parseJavaVersion } from "../runtime-checks.mjs";

test("Node version is compared against the required major", () => {
  assert.equal(inspectNodeVersion("v22.3.0", 20).compatible, true);
  assert.equal(inspectNodeVersion("v18.19.1", 20).compatible, false);
  assert.equal(inspectNodeVersion("unknown", 20).installed, false);
});

test("Java versions, including legacy Java 8, are parsed", () => {
  assert.deepEqual(parseJavaVersion('openjdk version "21.0.2" 2024-01-16'), { version: "21.0.2", major: 21 });
  assert.deepEqual(parseJavaVersion('java version "1.8.0_402"'), { version: "1.8.0_402", major: 8 });
  assert.deepEqual(parseJavaVersion("not a java version"), null);
});
