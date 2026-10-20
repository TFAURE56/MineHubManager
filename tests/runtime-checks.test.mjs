import test from "node:test";
import assert from "node:assert/strict";
import { inspectNodeVersion, parseJavaVersion } from "../runtime-checks.mjs";

<<<<<<< HEAD
test("Node version is compared against the required major", () => {
  assert.equal(inspectNodeVersion("v22.3.0", 20).compatible, true);
  assert.equal(inspectNodeVersion("v18.19.1", 20).compatible, false);
  assert.equal(inspectNodeVersion("unknown", 20).installed, false);
});

test("Java versions, including legacy Java 8, are parsed", () => {
  assert.deepEqual(parseJavaVersion('openjdk version "21.0.2" 2024-01-16'), { version: "21.0.2", major: 21 });
  assert.deepEqual(parseJavaVersion('java version "1.8.0_402"'), { version: "1.8.0_402", major: 8 });
  assert.deepEqual(parseJavaVersion("not a java version"), null);
=======
test("lit les formats de version Java modernes et historiques", () => {
  assert.deepEqual(parseJavaVersion('openjdk version "21.0.8" 2025-07-15'), { version: "21.0.8", major: 21 });
  assert.deepEqual(parseJavaVersion('java version "1.8.0_452"'), { version: "1.8.0_452", major: 8 });
  assert.deepEqual(parseJavaVersion("openjdk 25.0.2 2025-01-21"), { version: "25.0.2", major: 25 });
  assert.equal(parseJavaVersion("not a java version"), null);
});

test("vérifie Node.js par rapport au minimum requis", () => {
  assert.equal(inspectNodeVersion("v24.12.0").compatible, true);
  assert.equal(inspectNodeVersion("v18.19.1").compatible, false);
>>>>>>> 77abf2e (0.5.1)
});
