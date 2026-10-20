import { execFile, spawn } from "node:child_process";
import { cp, lstat, mkdir, readFile, readdir, rm, stat, writeFile, open } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;
const PRESERVED_TOP_LEVEL = new Set(["data", ".git", "node_modules"]);

export function validateArchiveEntries(entries) {
  const paths = entries.map((entry) => entry.trim()).filter(Boolean).map((entry) => entry.replaceAll("\\", "/"));
  if (!paths.length) throw new Error("L'archive GitHub est vide.");
  const roots = new Set();
  for (const entry of paths) {
    if (entry.startsWith("/") || /^[A-Za-z]:/.test(entry)) throw new Error("Chemin absolu interdit dans l'archive.");
    const parts = entry.split("/").filter((part) => part && part !== ".");
    if (!parts.length || parts.some((part) => part === ".." || part.includes(":"))) throw new Error("Chemin dangereux dans l'archive.");
    roots.add(parts[0]);
  }
  if (roots.size !== 1) throw new Error("Format d'archive GitHub inattendu.");
  return roots.values().next().value;
}

export function isPreservedUpdatePath(path) {
  const normalized = String(path).replaceAll("\\", "/").replace(/^\.\//, "");
  const topLevel = normalized.split("/")[0];
  return PRESERVED_TOP_LEVEL.has(topLevel) || topLevel === ".env";
}

async function listFiles(root, prefix = "") {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (isPreservedUpdatePath(relativePath)) continue;
    const fullPath = join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Lien symbolique refuse dans l'application: ${relativePath}`);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath, relativePath));
    else if (entry.isFile()) files.push({ fullPath, relativePath });
  }
  return files;
}

async function waitForParent(pid) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") return;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error("L'agent MineHub n'a pas libere ses fichiers a temps.");
}

export async function verifyAndExtract(archivePath, workDir, expectedVersion) {
  const archiveStat = await stat(archivePath);
  if (archiveStat.size < 1 || archiveStat.size > MAX_ARCHIVE_BYTES) throw new Error("Taille d'archive invalide (maximum 200 Mo).");
  const { stdout } = await execFileAsync("tar", ["-tzf", archivePath], { maxBuffer: 20 * 1024 * 1024, windowsHide: true });
  const verbose = await execFileAsync("tar", ["-tvzf", archivePath], { maxBuffer: 20 * 1024 * 1024, windowsHide: true });
  if (verbose.stdout.split(/\r?\n/).some((line) => /^[lh]/.test(line.trimStart()))) throw new Error("Les liens symboliques ou physiques sont interdits dans l'archive.");
  const archiveRoot = validateArchiveEntries(stdout.split(/\r?\n/));
  const extractDir = join(workDir, "extract");
  await mkdir(extractDir, { recursive: true });
  await execFileAsync("tar", ["-xzf", archivePath, "-C", extractDir], { maxBuffer: 10 * 1024 * 1024, windowsHide: true });
  const sourceRoot = resolve(extractDir, archiveRoot);
  if (!sourceRoot.startsWith(`${resolve(extractDir)}${sep}`)) throw new Error("Dossier racine d'archive invalide.");
  if (!(await lstat(sourceRoot)).isDirectory()) throw new Error("Racine d'archive invalide.");
  await listFiles(sourceRoot);
  const packageInfo = JSON.parse(await readFile(join(sourceRoot, "package.json"), "utf8"));
  if (packageInfo.version !== expectedVersion) throw new Error(`L'archive contient la version ${packageInfo.version}, attendue: ${expectedVersion}.`);
  return sourceRoot;
}

export async function applyFiles(sourceRoot, targetRoot, backupRoot) {
  targetRoot = resolve(targetRoot);
  const files = await listFiles(sourceRoot);
  const changed = [];
  try {
    for (const file of files) {
      const destination = resolve(targetRoot, ...file.relativePath.split("/"));
      if (!destination.startsWith(`${resolve(targetRoot)}${sep}`)) throw new Error("Destination de mise a jour invalide.");
      const relativeDestination = relative(targetRoot, destination);
      let parent = dirname(destination);
      while (parent !== targetRoot && parent.startsWith(`${targetRoot}${sep}`)) {
        try {
          if ((await lstat(parent)).isSymbolicLink()) throw new Error(`Lien symbolique refuse: ${relative(targetRoot, parent)}`);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        parent = dirname(parent);
      }
      await mkdir(dirname(destination), { recursive: true });
      let existed = false;
      try {
        const oldStat = await lstat(destination);
        if (!oldStat.isFile() || oldStat.isSymbolicLink()) throw new Error(`Fichier cible inattendu: ${relativeDestination}`);
        await mkdir(dirname(join(backupRoot, relativeDestination)), { recursive: true });
        await cp(destination, join(backupRoot, relativeDestination));
        existed = true;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      changed.push({ destination, relativeDestination, existed });
      await cp(file.fullPath, destination);
    }
  } catch (error) {
    for (const item of changed.reverse()) {
      if (item.existed) {
        await mkdir(dirname(item.destination), { recursive: true });
        await cp(join(backupRoot, item.relativeDestination), item.destination);
      } else await rm(item.destination, { force: true });
    }
    throw error;
  }
  return changed;
}

async function waitForAgentHealth(manifest, expectedVersion, timeout = 30_000, child = null) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`Le nouvel agent s'est arrete (${child.exitCode}).`);
    try {
      const host = ["0.0.0.0", "::", ""].includes(manifest.env.HOST) ? "127.0.0.1" : manifest.env.HOST || "127.0.0.1";
      const port = manifest.env.PORT || "4173";
      const response = await fetch(`http://${host.includes(":") && !host.startsWith("[") ? `[${host}]` : host}:${port}/api/health`, {
        headers: manifest.env.MCM_TOKEN ? { Authorization: `Bearer ${manifest.env.MCM_TOKEN}` } : {},
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok && (await response.json()).version === expectedVersion) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 600));
  }
  throw new Error("Le nouvel agent n'a pas demarre correctement.");
}

async function startAgent(manifest, expectedVersion) {
  const dataRoot = resolve(manifest.env.MINECRAFT_ROOT || join(manifest.root, "data"));
  const logDir = join(dataRoot, "logs");
  await mkdir(logDir, { recursive: true });
  const logHandle = await open(join(logDir, "app-update-agent.log"), "a");
  const child = spawn(manifest.node, [join(manifest.root, "server.mjs")], {
    cwd: manifest.root,
    env: manifest.env,
    detached: true,
    stdio: ["ignore", logHandle.fd, logHandle.fd],
    windowsHide: true,
  });
  await new Promise((resolveSpawn, rejectSpawn) => {
    child.once("spawn", resolveSpawn);
    child.once("error", rejectSpawn);
  });
  child.unref();
  await logHandle.close();
  try {
    await waitForAgentHealth(manifest, expectedVersion, 30_000, child);
  } catch (error) {
    child.kill();
    throw error;
  }
}

async function runUpdater(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const workDir = dirname(manifestPath);
  if (manifest.systemdUnit) {
    const installRoot = process.env.MINEHUB_INSTALL_ROOT && resolve(process.env.MINEHUB_INSTALL_ROOT);
    const updateDir = process.env.MINEHUB_UPDATE_DIR && resolve(process.env.MINEHUB_UPDATE_DIR);
    if (!installRoot || resolve(manifest.root) !== installRoot) throw new Error("Le dossier d'installation ne correspond pas a la configuration systemd.");
    if (!updateDir || resolve(workDir) !== updateDir) throw new Error("Le dossier de mise a jour ne correspond pas a la configuration systemd.");
    if (manifest.systemdUnit !== process.env.MINEHUB_SYSTEMD_SERVICE) throw new Error("Le service systemd cible ne correspond pas a la configuration.");
    const archiveRelative = relative(updateDir, resolve(manifest.archive));
    if (!archiveRelative || archiveRelative.startsWith("..") || isAbsolute(archiveRelative)) throw new Error("Archive hors du dossier de mise a jour.");
  }
  const sourceRoot = await verifyAndExtract(manifest.archive, workDir, manifest.version);
  await waitForParent(manifest.parentPid);
  const backupRoot = join(workDir, "rollback");
  await mkdir(backupRoot, { recursive: true });
  let changed;
  try {
    changed = await applyFiles(sourceRoot, manifest.root, backupRoot);
  } catch (error) {
    if (manifest.systemdUnit) {
      const command = process.getuid?.() === 0 ? "systemctl" : "sudo";
      const args = command === "sudo"
        ? ["-n", "systemctl", "--no-block", "restart", manifest.systemdUnit]
        : ["--no-block", "restart", manifest.systemdUnit];
      await execFileAsync(command, args, { timeout: 15_000, windowsHide: true }).catch(() => {});
    } else await startAgent(manifest, manifest.previousVersion).catch(() => {});
    throw error;
  }
  if (manifest.systemdUnit) {
    const command = process.getuid?.() === 0 ? "systemctl" : "sudo";
    const args = command === "sudo"
      ? ["-n", "systemctl", "--no-block", "restart", manifest.systemdUnit]
      : ["--no-block", "restart", manifest.systemdUnit];
    try {
      await execFileAsync(command, args, { timeout: 15_000, windowsHide: true });
      await waitForAgentHealth(manifest, manifest.version, 45_000);
      return;
    } catch (error) {
      for (const item of [...changed].reverse()) {
        if (item.existed) await cp(join(backupRoot, item.relativeDestination), item.destination);
        else await rm(item.destination, { force: true });
      }
      await execFileAsync(command, args, { timeout: 15_000, windowsHide: true }).catch(() => {});
      await waitForAgentHealth(manifest, manifest.previousVersion, 45_000).catch(() => {});
      throw new Error(`Mise a jour annulee, redemarrage systemd impossible: ${error.message}`);
    }
  }
  try {
    await startAgent(manifest, manifest.version);
  } catch (error) {
    for (const item of [...changed].reverse()) {
      if (item.existed) await cp(join(backupRoot, item.relativeDestination), item.destination);
      else await rm(item.destination, { force: true });
    }
    await startAgent(manifest, manifest.previousVersion).catch(() => {});
    throw error;
  }
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error("Fichier de mise a jour manquant.");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    await runUpdater(manifestPath);
    await rm(dirname(manifestPath), { recursive: true, force: true });
  } catch (error) {
    const dataRoot = resolve(manifest?.env?.MINECRAFT_ROOT || join(manifest?.root || dirname(manifestPath), "data"));
    const logDir = join(dataRoot, "logs");
    await mkdir(logDir, { recursive: true }).catch(() => {});
    const logPath = join(logDir, "app-update-error.log");
    await writeFile(logPath, `${new Date().toISOString()} ${error.stack || error.message}\n`).catch(() => {});
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
