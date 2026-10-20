import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { applyFiles, isPreservedUpdatePath, validateArchiveEntries, verifyAndExtract } from "../self-updater.mjs";

const execFileAsync = promisify(execFile);

test("accepts a GitHub source archive with one root folder", () => {
  assert.equal(validateArchiveEntries(["owner-minehub-abc123/", "owner-minehub-abc123/package.json"]), "owner-minehub-abc123");
});

test("rejects unsafe or ambiguous archive paths", () => {
  assert.throws(() => validateArchiveEntries(["../outside"]), /dangereux/);
  assert.throws(() => validateArchiveEntries(["C:/outside"]), /absolu/);
  assert.throws(() => validateArchiveEntries(["one/file", "two/file"]), /inattendu/);
});

test("keeps user data, dependencies, git metadata, and environment files", () => {
  for (const path of ["data/state.json", ".git/config", "node_modules/pkg/index.js", ".env"]) {
    assert.equal(isPreservedUpdatePath(path), true);
  }
  assert.equal(isPreservedUpdatePath("public/app.js"), false);
});

test("overlays application files without replacing the data directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "minehub-update-test-"));
  const source = join(root, "source");
  const target = join(root, "target");
  const backup = join(root, "backup");
  try {
    await mkdir(join(source, "public"), { recursive: true });
    await mkdir(join(source, "data"), { recursive: true });
    await mkdir(join(target, "data"), { recursive: true });
    await writeFile(join(source, "server.mjs"), "new app");
    await writeFile(join(source, "public", "app.js"), "new ui");
    await writeFile(join(source, "data", "state.json"), "must not copy");
    await writeFile(join(target, "server.mjs"), "old app");
    await writeFile(join(target, "data", "state.json"), "world state");

    await applyFiles(source, target, backup);

    assert.equal(await readFile(join(target, "server.mjs"), "utf8"), "new app");
    assert.equal(await readFile(join(target, "public", "app.js"), "utf8"), "new ui");
    assert.equal(await readFile(join(target, "data", "state.json"), "utf8"), "world state");
    assert.equal(await readFile(join(backup, "server.mjs"), "utf8"), "old app");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("extracts a release archive only when its package version matches the release", async () => {
  const root = await mkdtemp(join(tmpdir(), "minehub-release-test-"));
  const releaseRoot = join(root, "owner-minehub-abc123");
  const archive = join(root, "release.tar.gz");
  try {
    await mkdir(releaseRoot, { recursive: true });
    await writeFile(join(releaseRoot, "package.json"), JSON.stringify({ version: "0.6.0" }));
    await writeFile(join(releaseRoot, "server.mjs"), "valid source");
    await execFileAsync("tar", ["-czf", archive, "-C", root, "owner-minehub-abc123"]);

    const extracted = await verifyAndExtract(archive, join(root, "work"), "0.6.0");
    assert.equal(JSON.parse(await readFile(join(extracted, "package.json"), "utf8")).version, "0.6.0");
    await assert.rejects(verifyAndExtract(archive, join(root, "other-work"), "0.7.0"), /attendue/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
