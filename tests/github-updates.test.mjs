import test from "node:test";
import assert from "node:assert/strict";
import { compareVersions, normalizeGitHubRepository } from "../github-updates.mjs";

test("compare les versions stables et préversions", () => {
  assert.equal(compareVersions("v1.2.0", "1.1.9"), 1);
  assert.equal(compareVersions("1.2.0-rc.2", "1.2.0-rc.10"), -1);
  assert.equal(compareVersions("1.2.0", "1.2.0-rc.10"), 1);
  assert.equal(compareVersions("1.2.0+build.4", "1.2.0"), 0);
});

test("valide un dépôt GitHub et accepte son URL HTTPS", () => {
  assert.equal(normalizeGitHubRepository("thomas/MineHub"), "thomas/MineHub");
  assert.equal(normalizeGitHubRepository("https://github.com/thomas/MineHub.git"), "thomas/MineHub");
  assert.throws(() => normalizeGitHubRepository("https://example.com/owner/repo"));
  assert.throws(() => normalizeGitHubRepository("owner/repo/releases"));
  assert.throws(() => normalizeGitHubRepository("../repo"));
});
