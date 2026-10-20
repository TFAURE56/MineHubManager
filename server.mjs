import http from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { access, appendFile, cp, mkdir, readFile, readdir, rename, rm, stat, statfs, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, normalize, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFile, spawn } from "node:child_process";
import { createConnection } from "node:net";
import crypto from "node:crypto";
import os from "node:os";
import { promisify } from "node:util";
import {
  PROPERTY_GROUPS,
  PROPERTY_SCHEMA,
  defaultProperties,
  legacyProperties,
  normalizePropertyPatch,
  parseProperties,
  serializeProperties,
  settingsFromProperties,
} from "./server-properties.mjs";
import { buildPlayerStats } from "./player-stats.mjs";
import { parseAdvancementMessage, stripSystemChat } from "./console-events.mjs";
import { normalizePublicAddress } from "./public-address.mjs";
import { resolveInstanceDirectory } from "./instance-path.mjs";
import { inspectNodeVersion, parseJavaVersion } from "./runtime-checks.mjs";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const ROOT = resolve(process.cwd());
const PUBLIC_DIR = join(ROOT, "public");
const DATA_DIR = resolve(process.env.MINECRAFT_ROOT || join(ROOT, "data"));
const GENERAL_SETTINGS_FILE = join(DATA_DIR, "general-settings.json");
let SERVERS_DIR = join(DATA_DIR, "servers");
const STATE_FILE = join(DATA_DIR, "state.json");
const BACKUPS_DIR = resolve(process.env.MINECRAFT_BACKUP_ROOT || join(DATA_DIR, "backups"));
const METRICS_DIR = join(DATA_DIR, "metrics");
const LOGS_DIR = join(DATA_DIR, "logs");
const MAX_CONSOLE_LOG_BYTES = 10 * 1024 * 1024;
const API_TOKEN = process.env.MCM_TOKEN || "";
const USER_AGENT = "MineHubManager/0.10.0 (local Minecraft server manager)";
const PACKAGE = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
const MIN_NODE_MAJOR = Number(PACKAGE.engines?.node?.match(/\d+/)?.[0] || 20);

const runtimes = new Map();
const catalogCache = new Map();
const execFileAsync = promisify(execFile);
const backupRuns = new Set();
const modUpdateRuns = new Set();
const playerStatsCache = new Map();
const scheduledRuns = new Set();
const MAX_METRIC_SAMPLES = 1440;
let cpuSnapshot = null;

async function inspectJavaRuntime() {
  const configured = process.env.JAVA_PATH || (process.env.JAVA_HOME ? join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java") : "java");
  try {
    const result = await execFileAsync(configured, ["-version"], { timeout: 5000, windowsHide: true });
    const parsed = parseJavaVersion(`${result.stdout || ""}\n${result.stderr || ""}`);
    if (!parsed) throw new Error("Version Java impossible a lire");
    return { installed: true, ...parsed, executable: configured, error: null };
  } catch (error) {
    return { installed: false, version: null, major: null, executable: configured, error: error.message };
  }
}

const serverCopyOptions = {
  recursive: true,
  preserveTimestamps: true,
  filter: (source) => basename(source) !== "session.lock",
};

try {
  const savedSettings = JSON.parse(await readFile(GENERAL_SETTINGS_FILE, "utf8"));
  if (typeof savedSettings.instanceDirectory === "string" && isAbsolute(savedSettings.instanceDirectory)) {
    SERVERS_DIR = resolve(savedSettings.instanceDirectory);
  }
} catch (error) {
  if (error.code !== "ENOENT") console.warn(`Paramètres généraux illisibles: ${error.message}`);
}

function isTcpPortInUse(port) {
  return new Promise((resolvePort) => {
    const socket = createConnection({ host: "127.0.0.1", port: Number(port) });
    const finish = (busy) => {
      socket.destroy();
      resolvePort(busy);
    };
    socket.setTimeout(700, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function assertNoExternalServer(server) {
  if (!runtimes.get(server.id)?.process && await isTcpPortInUse(server.settings.port)) {
    throw new Error(`Le port Minecraft ${server.settings.port} est deja utilise hors de MineHub. Arretez ce processus avant de gerer les fichiers.`);
  }
}

const isLoopbackHost = ["127.0.0.1", "::1", "localhost"].includes(HOST.toLowerCase());
if (!isLoopbackHost && API_TOKEN.length < 32) {
  throw new Error("MCM_TOKEN doit contenir au moins 32 caracteres quand l'agent est expose sur le reseau.");
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

await mkdir(SERVERS_DIR, { recursive: true });
await mkdir(LOGS_DIR, { recursive: true });

function defaultState() {
  return { servers: [], createdAt: new Date().toISOString() };
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Impossible de lire l'etat:", error);
    const state = defaultState();
    await saveState(state);
    return state;
  }
}

async function saveState(state) {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  const temporary = `${STATE_FILE}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2), "utf8");
  await rename(temporary, STATE_FILE);
}

async function saveGeneralSettings(settings) {
  const temporary = `${GENERAL_SETTINGS_FILE}.tmp`;
  await writeFile(temporary, JSON.stringify(settings, null, 2), "utf8");
  await rename(temporary, GENERAL_SETTINGS_FILE);
}

async function migrateInstanceDirectory(value, state) {
  const destination = resolveInstanceDirectory(value, SERVERS_DIR);
  const sameDirectory = process.platform === "win32"
    ? resolve(destination).toLowerCase() === resolve(SERVERS_DIR).toLowerCase()
    : resolve(destination) === resolve(SERVERS_DIR);
  if (sameDirectory) return destination;

  for (const item of state.servers) {
    if (runtimes.get(item.id)?.process || await isTcpPortInUse(item.settings.port)) {
      throw new Error(`Arrêtez toutes les instances avant de déplacer les fichiers. « ${item.name} » est en ligne ou utilise encore le port ${item.settings.port}.`);
    }
  }

  const entries = await readdir(SERVERS_DIR, { withFileTypes: true });
  await mkdir(dirname(destination), { recursive: true });
  let createdDestination = false;
  try {
    await mkdir(destination);
    createdDestination = true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const info = await stat(destination);
    if (!info.isDirectory() || (await readdir(destination)).length) {
      throw new Error("Le dossier de destination doit être nouveau ou vide.");
    }
  }

  const copied = [];
  try {
    for (const entry of entries) {
      const source = join(SERVERS_DIR, entry.name);
      const target = join(destination, entry.name);
      copied.push(target);
      await cp(source, target, serverCopyOptions);
    }
    await saveGeneralSettings({ instanceDirectory: destination });
    SERVERS_DIR = destination;
    playerStatsCache.clear();
    return destination;
  } catch (error) {
    await Promise.all(copied.map((path) => rm(path, { recursive: true, force: true })));
    if (createdDestination) await rm(destination, { recursive: true, force: true });
    throw error;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    ...headers,
  });
  res.end(body);
}

function apiError(res, statusCode, message, details) {
  sendJson(res, statusCode, { error: message, ...(details ? { details } : {}) });
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("Corps de requete trop volumineux");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isAuthorized(req) {
  if (!API_TOKEN) return true;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  const received = Buffer.from(token);
  const expected = Buffer.from(API_TOKEN);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(received, expected);
}

function slugify(value) {
  return String(value || "server")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "server";
}

function uniqueSlug(name, servers) {
  const base = slugify(name);
  let slug = base;
  let index = 2;
  while (servers.some((server) => server.id === slug)) slug = `${base}-${index++}`;
  return slug;
}

function compareMinecraftVersions(a, b) {
  const parse = (value) => String(value).split(/[.-]/).map((part) => Number(part) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let index = 0; index < Math.max(pa.length, pb.length); index += 1) {
    const difference = (pb[index] || 0) - (pa[index] || 0);
    if (difference) return difference;
  }
  return String(b).localeCompare(String(a));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...options.headers },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Service distant indisponible (${response.status})`);
  return response.json();
}

function cacheGet(key, ttl = 10 * 60_000) {
  const cached = catalogCache.get(key);
  return cached && Date.now() - cached.time < ttl ? cached.value : null;
}

function cacheSet(key, value) {
  catalogCache.set(key, { time: Date.now(), value });
  return value;
}

const fallbackVersions = [
  "1.21.11", "1.21.10", "1.21.9", "1.21.8", "1.21.7", "1.21.6", "1.21.5",
  "1.21.4", "1.21.3", "1.21.1", "1.20.6", "1.20.4", "1.20.2", "1.20.1",
  "1.19.4", "1.19.2", "1.18.2", "1.17.1", "1.16.5", "1.12.2", "1.8.9",
];

async function getVersions(type) {
  const key = `versions:${type}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    let versions = [];
    if (type === "paper") {
      const data = await fetchJson("https://fill.papermc.io/v3/projects/paper");
      versions = Object.values(data.versions || {}).flat();
    } else if (type === "fabric") {
      const data = await fetchJson("https://meta.fabricmc.net/v2/versions/game");
      versions = data.filter((item) => item.stable).map((item) => item.version);
    } else {
      const data = await fetchJson("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
      versions = data.versions.filter((item) => item.type === "release").map((item) => item.id);
    }
    return cacheSet(key, [...new Set(versions)].sort(compareMinecraftVersions));
  } catch (error) {
    console.warn(`Catalogue ${type}: ${error.message}`);
    return cacheSet(key, fallbackVersions);
  }
}

async function resolveDistribution(type, version) {
  if (type === "paper") {
    const builds = await fetchJson(`https://fill.papermc.io/v3/projects/paper/versions/${encodeURIComponent(version)}/builds`);
    const build = builds.find((item) => item.channel === "STABLE") || builds[0];
    const download = build?.downloads?.["server:default"];
    if (!download?.url) throw new Error("Aucun build Paper stable n'est disponible pour cette version");
    return { url: download.url, build: String(build.id || build.number || "stable"), fileName: download.name || "server.jar" };
  }

  if (type === "fabric") {
    const [loaders, installers] = await Promise.all([
      fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(version)}`),
      fetchJson("https://meta.fabricmc.net/v2/versions/installer"),
    ]);
    const compatible = loaders.find((item) => item.loader?.stable) || loaders[0];
    const installer = installers.find((item) => item.stable) || installers[0];
    if (!compatible?.loader?.version || !installer?.version) {
      throw new Error("Aucun chargeur Fabric compatible n'est disponible");
    }
    const loader = compatible.loader.version;
    const installerVersion = installer.version;
    return {
      url: `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(version)}/${encodeURIComponent(loader)}/${encodeURIComponent(installerVersion)}/server/jar`,
      build: loader,
      fileName: "fabric-server-launch.jar",
    };
  }

  const manifest = await fetchJson("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
  const entry = manifest.versions.find((item) => item.id === version);
  if (!entry) throw new Error("Version Vanilla introuvable");
  const metadata = await fetchJson(entry.url);
  if (!metadata.downloads?.server?.url) throw new Error("Cette version ne propose pas de serveur telechargeable");
  return { url: metadata.downloads.server.url, build: version, fileName: "server.jar" };
}

async function latestDistribution(type) {
  const versions = await getVersions(type);
  const version = versions.find((item) => !item.includes("-")) || versions[0];
  if (!version) throw new Error("Aucune version stable n'est disponible.");
  return { version, ...(await resolveDistribution(type, version)) };
}

async function downloadFile(url, target) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(180_000) });
  if (!response.ok || !response.body) throw new Error(`Telechargement impossible (${response.status})`);
  await pipeline(Readable.fromWeb(response.body), await import("node:fs").then(({ createWriteStream }) => createWriteStream(target)));
}

async function readServerProperties(server) {
  const filePath = join(SERVERS_DIR, server.id, "server.properties");
  let existing = {};
  try {
    existing = parseProperties(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return { ...defaultProperties(), ...legacyProperties(server.settings), ...existing };
}

async function writeServerConfig(server, propertyPatch = {}, removedKeys = []) {
  const serverDir = join(SERVERS_DIR, server.id);
  await mkdir(serverDir, { recursive: true });
  const properties = { ...await readServerProperties(server), ...propertyPatch };
  for (const key of removedKeys) delete properties[key];
  await writeFile(join(serverDir, "server.properties"), serializeProperties(properties), "utf8");
  await writeFile(join(serverDir, "eula.txt"), `# Accepted through MineHub Manager\neula=${Boolean(server.eula)}\n`, "utf8");
  await writeFile(join(serverDir, "minehub.json"), JSON.stringify(server, null, 2), "utf8");
  return properties;
}

async function installServer(serverId) {
  const state = await loadState();
  const server = state.servers.find((item) => item.id === serverId);
  if (!server) return;
  try {
    const distribution = await resolveDistribution(server.type, server.version);
    const serverDir = join(SERVERS_DIR, server.id);
    const temporary = join(serverDir, "server.jar.download");
    await downloadFile(distribution.url, temporary);
    await rename(temporary, join(serverDir, "server.jar"));
    server.build = distribution.build;
    server.installation = { status: "ready", progress: 100, message: "Pret a demarrer" };
  } catch (error) {
    server.installation = { status: "error", progress: 0, message: error.message };
  }
  server.updatedAt = new Date().toISOString();
  await writeServerConfig(server);
  await saveState(state);
}

function runtimeView(server) {
  const runtime = runtimes.get(server.id);
  return {
    ...server,
    status: runtime ? runtime.status : server.installation?.status === "installing" ? "installing" : "offline",
    startedAt: runtime?.startedAt || null,
    pid: runtime?.process?.pid || null,
    onlinePlayers: runtime?.players?.size || 0,
    playerNames: runtime?.players ? [...runtime.players.keys()] : [],
  };
}

function eventFile(serverId) {
  return join(SERVERS_DIR, serverId, "minehub-events.jsonl");
}

function recordEvent(runtime, event) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: event.type || "system",
    player: event.player || null,
    target: event.target || null,
    title: String(event.title || "Événement serveur").slice(0, 160),
    detail: String(event.detail || "").slice(0, 1000),
    meta: event.meta && typeof event.meta === "object" ? event.meta : {},
  };
  runtime.events.push(entry);
  if (runtime.events.length > 1000) runtime.events.splice(0, runtime.events.length - 1000);
  runtime.eventWrite = runtime.eventWrite
    .then(() => appendFile(eventFile(runtime.serverId), `${JSON.stringify(entry)}\n`, "utf8"))
    .catch((error) => console.error("Écriture de l'historique:", error));
  return entry;
}

function consoleMessage(line) {
  const message = String(line).match(/\]\s*:\s*(.*)$/)?.[1]?.trim() || String(line).trim();
  return stripSystemChat(message);
}

const deathMarkers = [
  " died", " drowned", " starved", " suffocated", " froze to death", " burned to death",
  " went up in flames", " fell ", " hit the ground", " was slain by ", " was shot by ",
  " was killed by ", " was blown up by ", " was fireballed by ", " was pummeled by ",
  " was impaled by ", " was squashed by ", " was skewered by ", " was obliterated by ",
  " tried to swim in lava", " discovered the floor was lava", " walked into danger zone",
  " withered away", " was pricked to death", " was struck by lightning", " fell out of the world",
  " experienced kinetic energy", " didn’t want to live in the same world", " didn't want to live in the same world",
];

function classifyConsoleLine(runtime, clean) {
  const message = consoleMessage(clean);
  let match;

  match = message.match(/^([A-Za-z0-9_]{1,16})\[\/([^\]]+)\] logged in with entity id \d+ at \((.+)\)$/);
  if (match) {
    const [, name, address, position] = match;
    const current = runtime.players.get(name) || { name, joinedAt: new Date().toISOString() };
    runtime.players.set(name, { ...current, address, position, lastSeenAt: new Date().toISOString() });
    return;
  }

  match = message.match(/^([A-Za-z0-9_]{1,16}) joined the game$/);
  if (match) {
    const name = match[1];
    const current = runtime.players.get(name) || {};
    runtime.players.set(name, { ...current, name, joinedAt: current.joinedAt || new Date().toISOString(), lastSeenAt: new Date().toISOString() });
    recordEvent(runtime, { type: "join", player: name, title: `${name} s’est connecté`, detail: message });
    return;
  }

  match = message.match(/^([A-Za-z0-9_]{1,16}) (?:left the game|lost connection:.*)$/);
  if (match) {
    const name = match[1];
    const current = runtime.players.get(name);
    const sessionSeconds = current?.joinedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(current.joinedAt).getTime()) / 1000))
      : 0;
    runtime.players.delete(name);
    recordEvent(runtime, { type: "leave", player: name, title: `${name} s’est déconnecté`, detail: message, meta: { sessionSeconds } });
    return;
  }

  match = message.match(/^There are \d+ of a max of \d+ players online:\s*(.*)$/i);
  if (match) {
    const listed = match[1].split(",").map((name) => name.trim()).filter((name) => /^[A-Za-z0-9_]{1,16}$/.test(name));
    const now = new Date().toISOString();
    const listedSet = new Set(listed);
    for (const knownName of runtime.players.keys()) {
      if (!listedSet.has(knownName)) runtime.players.delete(knownName);
    }
    for (const name of listed) {
      const current = runtime.players.get(name) || {};
      runtime.players.set(name, { ...current, name, joinedAt: current.joinedAt || now, lastSeenAt: now });
    }
    return;
  }

  const advancement = parseAdvancementMessage(message);
  if (advancement) {
    recordEvent(runtime, { type: "advancement", player: advancement.player, title: `${advancement.player} a obtenu ${advancement.advancement}`, detail: message, meta: { advancement: advancement.advancement } });
    return;
  }

  match = message.match(/^<([A-Za-z0-9_]{1,16})>\s+(.+)$/);
  if (match) {
    recordEvent(runtime, { type: "chat", player: match[1], title: `Message de ${match[1]}`, detail: match[2] });
    return;
  }

  const victim = message.match(/^([A-Za-z0-9_]{1,16})\s+/)?.[1];
  if (victim && deathMarkers.some((marker) => message.includes(marker))) {
    const killer = message.match(/(?:slain|shot|killed|blown up|fireballed|pummeled|impaled|squashed|skewered|obliterated) by ([A-Za-z0-9_]{1,16})/)?.[1] || null;
    const isPvp = Boolean(killer && runtime.players.has(killer));
    recordEvent(runtime, {
      type: isPvp ? "pvp" : "death",
      player: victim,
      target: killer,
      title: isPvp ? `${killer} a éliminé ${victim}` : `${victim} est mort`,
      detail: message,
      meta: killer ? { killer } : {},
    });
  }
}

function appendLog(runtime, line, { classify = true } = {}) {
  const stamp = new Date().toLocaleTimeString("fr-FR", { hour12: false });
  const clean = String(line).replace(/\x1b\[[0-9;]*m/g, "").trimEnd();
  if (!clean) return;
  runtime.logs.push({ time: stamp, text: clean });
  if (runtime.logs.length > 500) runtime.logs.splice(0, runtime.logs.length - 500);
  const logPath = join(LOGS_DIR, `${runtime.serverId}.jsonl`);
  const record = `${JSON.stringify({ time: new Date().toISOString(), text: clean })}\n`;
  runtime.logWrite = runtime.logWrite.then(async () => {
    await appendFile(logPath, record, "utf8");
    runtime.logWriteCount += 1;
    if (runtime.logWriteCount % 128 === 0) {
      const info = await stat(logPath).catch(() => null);
      if (info?.size > MAX_CONSOLE_LOG_BYTES) {
        await rm(`${logPath}.1`, { force: true });
        await rename(logPath, `${logPath}.1`);
      }
    }
  }).catch((error) => console.error(`Ecriture journal ${runtime.serverId}:`, error));
  if (classify) classifyConsoleLine(runtime, clean);
}

async function readConsoleLogs(serverId, { search = "", level = "all", limit = 500 } = {}) {
  const files = [`${join(LOGS_DIR, `${serverId}.jsonl`)}.1`, join(LOGS_DIR, `${serverId}.jsonl`)];
  const records = [];
  for (const file of files) {
    try {
      const content = await readFile(file, "utf8");
      for (const row of content.split(/\r?\n/)) {
        if (!row) continue;
        try { records.push(JSON.parse(row)); } catch {}
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const needle = search.trim().toLocaleLowerCase("fr");
  const filtered = records.filter((entry) => {
    const text = String(entry.text || "");
    if (needle && !text.toLocaleLowerCase("fr").includes(needle)) return false;
    if (level === "error" && !/\b(error|exception|failed|fatal)\b|\[error\]/i.test(text)) return false;
    if (level === "warning" && !/\b(warn|warning)\b|\[warn\]/i.test(text)) return false;
    if (level === "info" && /\b(error|exception|failed|fatal|warn|warning)\b|\[(error|warn)\]/i.test(text)) return false;
    return true;
  });
  return filtered.slice(-limit).map((entry) => ({
    time: new Date(entry.time).toLocaleTimeString("fr-FR", { hour12: false }),
    text: String(entry.text || ""),
  }));
}

async function exportConsoleLogs(serverId) {
  const lines = [];
  for (const file of [`${join(LOGS_DIR, `${serverId}.jsonl`)}.1`, join(LOGS_DIR, `${serverId}.jsonl`)]) {
    try {
      const content = await readFile(file, "utf8");
      for (const row of content.split(/\r?\n/)) {
        if (!row) continue;
        try {
          const entry = JSON.parse(row);
          lines.push(`${entry.time} ${entry.text}`);
        } catch {}
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return lines.join("\n");
}

function consumeOutput(runtime, chunk, source) {
  const combined = `${runtime.buffers[source] || ""}${chunk.toString()}`;
  const lines = combined.split(/\r?\n/);
  runtime.buffers[source] = lines.pop() || "";
  for (const line of lines) appendLog(runtime, line);
}

async function startServer(server) {
  if (runtimes.has(server.id)) throw new Error("Le serveur est deja demarre");
  await assertNoExternalServer(server);
  const java = await inspectJavaRuntime();
  if (!java.installed) throw new Error(`Java introuvable ou inutilisable (${java.executable}). Installe Java ou configure JAVA_HOME/JAVA_PATH.`);
  const serverDir = join(SERVERS_DIR, server.id);
  await access(join(serverDir, "server.jar"));
  const args = [
    `-Xms${server.memory.min}M`,
    `-Xmx${server.memory.max}M`,
    "-jar",
    "server.jar",
    "nogui",
  ];
  const child = spawn(java.executable, args, {
    cwd: serverDir,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const runtime = {
    serverId: server.id,
    process: child,
    status: "starting",
    startedAt: new Date().toISOString(),
    logs: [],
    logWrite: Promise.resolve(),
    logWriteCount: 0,
    players: new Map(),
    events: [],
    eventWrite: Promise.resolve(),
    buffers: { stdout: "", stderr: "" },
  };
  runtimes.set(server.id, runtime);
  appendLog(runtime, `MineHub: demarrage de ${server.name} (${server.type} ${server.version})`);
  recordEvent(runtime, { type: "system", title: `${server.name} démarre`, detail: `${server.type} ${server.version}` });
  child.stdout.on("data", (chunk) => {
    consumeOutput(runtime, chunk, "stdout");
    if (chunk.toString().includes("Done (") && runtime.status !== "online") {
      runtime.status = "online";
      recordEvent(runtime, { type: "system", title: `${server.name} est en ligne`, detail: "Le chargement du monde est terminé." });
    }
  });
  child.stderr.on("data", (chunk) => {
    consumeOutput(runtime, chunk, "stderr");
  });
  child.on("error", (error) => appendLog(runtime, `Erreur Java: ${error.message}`));
  child.on("exit", (code) => {
    for (const source of ["stdout", "stderr"]) {
      if (runtime.buffers[source]) appendLog(runtime, runtime.buffers[source]);
    }
    for (const player of runtime.players.values()) {
      const sessionSeconds = player.joinedAt ? Math.max(0, Math.floor((Date.now() - new Date(player.joinedAt).getTime()) / 1000)) : 0;
      recordEvent(runtime, {
        type: "leave",
        player: player.name,
        title: `${player.name} s’est déconnecté avec l’arrêt du serveur`,
        detail: "Fin de session enregistrée à l’arrêt du serveur.",
        meta: { sessionSeconds, serverShutdown: true },
      });
    }
    appendLog(runtime, `Processus arrete avec le code ${code ?? "inconnu"}`);
    const crashed = code !== 0 && runtime.status !== "stopping";
    recordEvent(runtime, {
      type: crashed ? "crash" : "system",
      title: crashed ? `${server.name} s’est arrêté anormalement` : `${server.name} est arrêté`,
      detail: `Code de sortie ${code ?? "inconnu"}`,
    });
    runtime.status = "offline";
    runtime.players.clear();
    runtime.process = null;
    setTimeout(() => runtimes.get(server.id) === runtime && runtimes.delete(server.id), 15_000);
  });
  return runtime;
}

async function stopServer(serverId) {
  const runtime = runtimes.get(serverId);
  if (!runtime?.process) throw new Error("Le serveur est deja arrete");
  runtime.status = "stopping";
  runtime.process.stdin.write("stop\n");
  setTimeout(() => {
    if (runtime.process && !runtime.process.killed) runtime.process.kill("SIGTERM");
  }, 15_000).unref();
}

function requireRuntime(serverId) {
  const runtime = runtimes.get(serverId);
  if (!runtime?.process) throw new Error("Le serveur n'est pas démarré");
  return runtime;
}

function sendRuntimeCommand(runtime, command, { log = true } = {}) {
  if (!runtime?.process) throw new Error("Le serveur n'est pas démarré");
  const clean = String(command || "").replace(/[\r\n\0]/g, "").slice(0, 1000);
  if (!clean) throw new Error("Commande vide");
  runtime.process.stdin.write(`${clean}\n`);
  if (log) appendLog(runtime, `> ${clean}`, { classify: false });
}

async function readJsonArray(filePath) {
  try {
    const value = JSON.parse(await readFile(filePath, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error.code !== "ENOENT") console.warn(`Lecture ${filePath}: ${error.message}`);
    return [];
  }
}

async function playerSnapshot(server) {
  const runtime = runtimes.get(server.id);
  const serverDir = join(SERVERS_DIR, server.id);
  const [ops, whitelist, banned] = await Promise.all([
    readJsonArray(join(serverDir, "ops.json")),
    readJsonArray(join(serverDir, "whitelist.json")),
    readJsonArray(join(serverDir, "banned-players.json")),
  ]);
  const accessLists = { ops, whitelist, banned };
  if (runtime?.process) sendRuntimeCommand(runtime, "list", { log: false });
  const stats = await playerStatistics(server, accessLists, runtime);
  if (!runtime?.process) return { players: [], online: 0, max: server.settings.maxPlayers, accessLists, playerStats: stats, refreshedAt: new Date().toISOString() };
  const nameSet = (items) => new Set(items.map((item) => String(item.name || "").toLowerCase()));
  const opNames = nameSet(ops);
  const whitelistNames = nameSet(whitelist);
  const bannedNames = nameSet(banned);
  const players = [...runtime.players.values()].map((player) => ({
    ...player,
    operator: opNames.has(player.name.toLowerCase()),
    whitelisted: whitelistNames.has(player.name.toLowerCase()),
    banned: bannedNames.has(player.name.toLowerCase()),
    sessionSeconds: Math.max(0, Math.floor((Date.now() - new Date(player.joinedAt || Date.now()).getTime()) / 1000)),
  })).sort((a, b) => a.name.localeCompare(b.name));
  return { players, online: players.length, max: server.settings.maxPlayers, accessLists, playerStats: stats, refreshedAt: new Date().toISOString() };
}

async function playerStatistics(server, accessLists, runtime) {
  const cached = playerStatsCache.get(server.id);
  if (cached && Date.now() - cached.time < 5_000) return cached.value;

  const serverDir = join(SERVERS_DIR, server.id);
  const [userCache, events, properties] = await Promise.all([
    readJsonArray(join(serverDir, "usercache.json")),
    readAllEvents(server.id),
    readServerProperties(server),
  ]);
  const profiles = new Map();
  const addProfile = (entry) => {
    const name = String(entry?.name || "");
    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) return;
    const key = name.toLowerCase();
    const current = profiles.get(key) || { name };
    profiles.set(key, { ...current, ...entry, name: current.name || name });
  };
  for (const entry of [...userCache, ...accessLists.ops, ...accessLists.whitelist, ...accessLists.banned]) addProfile(entry);

  const onlinePlayers = runtime?.players
    ? [...runtime.players.values()].map((player) => ({
      ...player,
      sessionSeconds: Math.max(0, Math.floor((Date.now() - new Date(player.joinedAt || Date.now()).getTime()) / 1000)),
    }))
    : [];
  const levelName = String(properties["level-name"] || "world");
  const worldPath = resolve(serverDir, levelName);
  const statsPath = join(worldPath, "stats");
  const advancementPath = join(worldPath, "advancements");
  const inServer = (path) => path.startsWith(`${serverDir}${sep}`);
  const [statsFiles, advancementFiles] = await Promise.all([
    readUuidJsonFiles(inServer(statsPath) ? statsPath : ""),
    readUuidJsonFiles(inServer(advancementPath) ? advancementPath : ""),
  ]);
  const value = buildPlayerStats({ profiles: [...profiles.values()], statFiles: statsFiles, advancementFiles, events, onlinePlayers });
  playerStatsCache.set(server.id, { time: Date.now(), value });
  return value;
}

async function readUuidJsonFiles(directory) {
  if (!directory) return {};
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
  const files = entries.filter((entry) => entry.isFile() && /^[0-9a-f-]{32,36}\.json$/i.test(entry.name));
  const pairs = await Promise.all(files.map(async (entry) => {
    try {
      return [entry.name.slice(0, -5), JSON.parse(await readFile(join(directory, entry.name), "utf8"))];
    } catch (error) {
      if (error.code !== "ENOENT") console.warn(`Lecture ${entry.name}: ${error.message}`);
      return null;
    }
  }));
  return Object.fromEntries(pairs.filter(Boolean));
}

function offlinePlayerUuid(name) {
  const bytes = crypto.createHash("md5").update(`OfflinePlayer:${name}`, "utf8").digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x30;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function resolvePlayerProfile(server, name) {
  const serverDir = join(SERVERS_DIR, server.id);
  const cache = await readJsonArray(join(serverDir, "usercache.json"));
  const cached = cache.find((item) => String(item.name || "").toLowerCase() === name.toLowerCase() && /^[0-9a-f-]{32,36}$/i.test(item.uuid || ""));
  if (cached) return { name: cached.name, uuid: cached.uuid };
  if (!server.settings.onlineMode) return { name, uuid: offlinePlayerUuid(name) };

  const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 204 || response.status === 404) throw new Error("Profil Minecraft introuvable. Vérifiez le nom du joueur.");
  if (!response.ok) throw new Error(`Service de profils Mojang indisponible (${response.status}).`);
  const profile = await response.json();
  if (!/^[0-9a-f]{32}$/i.test(profile.id || "")) throw new Error("Le profil Mojang renvoyé est invalide.");
  const id = profile.id.toLowerCase();
  return { name: profile.name, uuid: `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}` };
}

async function writeJsonArray(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, filePath);
}

async function updatePlayerAccess(server, body) {
  if (server.installation?.status !== "ready") throw new Error("L'installation du serveur n'est pas terminée.");
  if (backupRuns.has(server.id)) throw new Error("Attendez la fin de l'opération de sauvegarde ou de mise à jour.");
  await assertNoExternalServer(server);
  const list = String(body.list || "");
  const action = String(body.action || "");
  const name = validPlayerName(body.name);
  if (!["ops", "whitelist", "banned"].includes(list) || !["add", "remove"].includes(action)) {
    throw new Error("Modification de permission invalide.");
  }

  const commands = {
    ops: { add: `op ${name}`, remove: `deop ${name}` },
    whitelist: { add: `whitelist add ${name}`, remove: `whitelist remove ${name}` },
    banned: { add: `ban ${name} ${safeReason(body.reason, "Banni par un administrateur")}`, remove: `pardon ${name}` },
  };
  const runtime = runtimes.get(server.id);
  if (runtime?.process) {
    if (runtime.status !== "online") throw new Error("Attendez que le serveur soit complètement démarré.");
    sendRuntimeCommand(runtime, commands[list][action]);
    recordEvent(runtime, {
      type: "admin",
      player: name,
      title: `${list === "ops" ? "Opérateur" : list === "whitelist" ? "Whitelist" : "Bannissement"} : ${action === "add" ? "ajout" : "retrait"}`,
      detail: commands[list][action],
      meta: { action: `access-${list}-${action}` },
    });
    return { queued: true, list, action, name };
  }

  const fileByList = { ops: "ops.json", whitelist: "whitelist.json", banned: "banned-players.json" };
  const filePath = join(SERVERS_DIR, server.id, fileByList[list]);
  const entries = await readJsonArray(filePath);
  const matches = (item) => String(item.name || "").toLowerCase() === name.toLowerCase();
  const existing = entries.find(matches);
  if (action === "remove") {
    if (!existing) throw new Error("Ce joueur ne figure pas dans cette liste.");
    await writeJsonArray(filePath, entries.filter((item) => !matches(item)));
    return { queued: false, list, action, name: existing.name };
  }
  if (existing) throw new Error("Ce joueur figure déjà dans cette liste.");
  const profile = await resolvePlayerProfile(server, name);
  const properties = list === "ops" ? await readServerProperties(server) : {};
  const permissionLevel = Math.min(4, Math.max(1, Number.parseInt(properties["op-permission-level"], 10) || 4));
  const entry = list === "ops"
    ? { uuid: profile.uuid, name: profile.name, level: permissionLevel, bypassesPlayerLimit: false }
    : list === "whitelist"
      ? { uuid: profile.uuid, name: profile.name }
      : { uuid: profile.uuid, name: profile.name, created: new Date().toISOString(), source: "MineHub", expires: null, reason: safeReason(body.reason, "Banni par un administrateur") };
  await writeJsonArray(filePath, [...entries, entry]);
  return { queued: false, list, action, name: profile.name };
}

function validPlayerName(value) {
  const name = String(value || "");
  if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) throw new Error("Nom de joueur invalide");
  return name;
}

function safeReason(value, fallback) {
  const reason = String(value || fallback || "").replace(/[\r\n\0§]/g, " ").trim().slice(0, 160);
  return reason || fallback;
}

function coordinate(value) {
  const result = String(value ?? "").trim();
  if (!/^(?:[~^](?:-?\d+(?:\.\d+)?)?|-?\d+(?:\.\d+)?)$/.test(result)) throw new Error(`Coordonnée invalide : ${result}`);
  return result;
}

function playerActionCommands(runtime, playerName, body) {
  const action = String(body.action || "");
  const name = validPlayerName(playerName);
  if (!runtime.players.has(name) && !["pardon", "whitelist-add", "op"].includes(action)) {
    throw new Error(`${name} n'est pas connecté`);
  }
  switch (action) {
    case "heal":
      return [`effect give ${name} minecraft:instant_health 1 20 true`];
    case "feed":
      return [`effect give ${name} minecraft:saturation 1 20 true`];
    case "heal-feed":
      return [`effect give ${name} minecraft:instant_health 1 20 true`, `effect give ${name} minecraft:saturation 1 20 true`];
    case "kill":
      return [`kill ${name}`];
    case "gamemode": {
      const mode = String(body.gamemode || "");
      if (!["survival", "creative", "adventure", "spectator"].includes(mode)) throw new Error("Mode de jeu invalide");
      return [`gamemode ${mode} ${name}`];
    }
    case "teleport": {
      if (body.target) {
        const target = validPlayerName(body.target);
        if (!runtime.players.has(target)) throw new Error(`${target} n'est pas connecté`);
        return [`tp ${name} ${target}`];
      }
      const x = coordinate(body.x);
      const y = coordinate(body.y);
      const z = coordinate(body.z);
      const dimension = String(body.dimension || "minecraft:overworld");
      if (!/^minecraft:(?:overworld|the_nether|the_end)$/.test(dimension)) throw new Error("Dimension invalide");
      return [`execute in ${dimension} run tp ${name} ${x} ${y} ${z}`];
    }
    case "give": {
      let item = String(body.item || "").trim().toLowerCase();
      if (!item.includes(":")) item = `minecraft:${item}`;
      if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(item)) throw new Error("Identifiant d'objet invalide");
      const count = Math.min(6400, Math.max(1, Number.parseInt(body.count, 10) || 1));
      return [`give ${name} ${item} ${count}`];
    }
    case "clear": {
      let item = String(body.item || "").trim().toLowerCase();
      if (!item) return [`clear ${name}`];
      if (!item.includes(":")) item = `minecraft:${item}`;
      if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(item)) throw new Error("Identifiant d'objet invalide");
      return [`clear ${name} ${item}`];
    }
    case "xp": {
      const levels = Math.min(100000, Math.max(-100000, Number.parseInt(body.levels, 10) || 0));
      return [`xp add ${name} ${levels} levels`];
    }
    case "effect": {
      let effect = String(body.effect || "").trim().toLowerCase();
      if (!effect.includes(":")) effect = `minecraft:${effect}`;
      if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(effect)) throw new Error("Effet invalide");
      const duration = Math.min(1000000, Math.max(1, Number.parseInt(body.duration, 10) || 60));
      const amplifier = Math.min(255, Math.max(0, Number.parseInt(body.amplifier, 10) || 0));
      return [`effect give ${name} ${effect} ${duration} ${amplifier} true`];
    }
    case "clear-effects":
      return [`effect clear ${name}`];
    case "kick":
      return [`kick ${name} ${safeReason(body.reason, "Expulsé par un administrateur")}`];
    case "ban":
      return [`ban ${name} ${safeReason(body.reason, "Banni par un administrateur")}`];
    case "pardon":
      return [`pardon ${name}`];
    case "op":
      return [`op ${name}`];
    case "deop":
      return [`deop ${name}`];
    case "whitelist-add":
      return [`whitelist add ${name}`];
    case "whitelist-remove":
      return [`whitelist remove ${name}`];
    case "message":
      return [`tellraw ${name} ${JSON.stringify({ text: safeReason(body.message, "Message de l’administration"), color: "gold" })}`];
    case "spawnpoint":
      return [`spawnpoint ${name}`];
    default:
      throw new Error("Action joueur inconnue");
  }
}

function executePlayerAction(server, playerName, body) {
  const runtime = requireRuntime(server.id);
  const commands = playerActionCommands(runtime, playerName, body);
  for (const command of commands) sendRuntimeCommand(runtime, command);
  const action = String(body.action || "action");
  recordEvent(runtime, {
    type: "admin",
    player: playerName,
    title: `Action ${action} sur ${playerName}`,
    detail: commands.join(" · "),
    meta: { action },
  });
  return commands.length;
}

function executeWorldAction(server, body) {
  const runtime = requireRuntime(server.id);
  const action = String(body.action || "");
  let commands;
  if (action === "time") {
    const value = String(body.value || "day");
    if (!["day", "noon", "night", "midnight"].includes(value)) throw new Error("Heure invalide");
    commands = [`time set ${value}`];
  } else if (action === "weather") {
    const value = String(body.value || "clear");
    if (!["clear", "rain", "thunder"].includes(value)) throw new Error("Météo invalide");
    commands = [`weather ${value}`];
  } else if (action === "difficulty") {
    const value = String(body.value || "normal");
    if (!["peaceful", "easy", "normal", "hard"].includes(value)) throw new Error("Difficulté invalide");
    commands = [`difficulty ${value}`];
  } else if (action === "save") {
    commands = ["save-all flush"];
  } else if (action === "whitelist") {
    const value = body.value === true || body.value === "on" ? "on" : "off";
    commands = [`whitelist ${value}`];
  } else if (action === "gamerule") {
    const rule = String(body.rule || "");
    const value = String(body.value ?? "");
    if (!/^[A-Za-z][A-Za-z0-9]{1,64}$/.test(rule) || !/^(?:true|false|-?\d{1,12})$/.test(value)) throw new Error("Gamerule invalide");
    commands = [`gamerule ${rule} ${value}`];
  } else {
    throw new Error("Action monde inconnue");
  }
  for (const command of commands) sendRuntimeCommand(runtime, command);
  recordEvent(runtime, { type: "admin", title: `Action monde : ${action}`, detail: commands.join(" · "), meta: { action } });
  return commands.length;
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function backupServerDir(serverId) {
  return join(BACKUPS_DIR, serverId);
}

function backupPath(serverId, backupId) {
  if (!/^[A-Za-z0-9-]{1,80}$/.test(backupId)) throw new Error("Identifiant de sauvegarde invalide");
  return join(backupServerDir(serverId), backupId);
}

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) total += await directorySize(path);
    else if (entry.isFile()) total += (await stat(path)).size;
  }
  return total;
}

async function listBackups(serverId) {
  const directory = backupServerDir(serverId);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const backups = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    try {
      return JSON.parse(await readFile(join(directory, entry.name, "backup.json"), "utf8"));
    } catch {
      return null;
    }
  }));
  return backups.filter((backup) => backup?.serverId === serverId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function waitForSave(runtime, timeout = 120_000) {
  const startIndex = runtime.logs.length;
  sendRuntimeCommand(runtime, "save-all flush");
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (runtime.logs.slice(startIndex).some((line) => /saved the game|saved .*chunk/i.test(line.text))) return;
    await delay(150);
  }
  throw new Error("Le serveur n’a pas confirmé la sauvegarde du monde à temps.");
}

async function createBackup(server, type = "manual", { locked = false, allowModUpdate = false } = {}) {
  if (modUpdateRuns.has(server.id) && !allowModUpdate) throw new Error("Une modification des mods ou plugins est en cours.");
  if (backupRuns.has(server.id) && !locked) throw new Error("Une sauvegarde est déjà en cours pour ce serveur.");
  if (!locked) backupRuns.add(server.id);
  const runtime = runtimes.get(server.id);
  const wasRunning = Boolean(runtime?.process);
  const now = new Date();
  const backupId = `${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${crypto.randomUUID().slice(0, 8)}`;
  const destination = backupPath(server.id, backupId);
  let savingDisabled = false;
  try {
    await assertNoExternalServer(server);
    if (runtime?.process && runtime.status !== "online") throw new Error("Attendez que le serveur soit complètement démarré avant la sauvegarde.");
    if (runtime?.process) {
      sendRuntimeCommand(runtime, "save-off");
      savingDisabled = true;
      await waitForSave(runtime);
    }
    const filesPath = join(destination, "files");
    await mkdir(destination, { recursive: true });
    await cp(join(SERVERS_DIR, server.id), filesPath, serverCopyOptions);
    const metadata = {
      id: backupId,
      serverId: server.id,
      serverName: server.name,
      type,
      version: server.version,
      build: server.build,
      distribution: server.type,
      createdAt: now.toISOString(),
      sizeBytes: await directorySize(filesPath),
      wasRunning,
    };
    await writeFile(join(destination, "backup.json"), JSON.stringify(metadata, null, 2), "utf8");
    if (runtime) recordEvent(runtime, { type: "system", title: `Sauvegarde créée : ${server.name}`, detail: `${type} · ${formatBytes(metadata.sizeBytes)}` });
    return metadata;
  } catch (error) {
    await rm(destination, { recursive: true, force: true }).catch(() => {});
    throw error;
  } finally {
    if (savingDisabled && runtime?.process) sendRuntimeCommand(runtime, "save-on");
    if (!locked) backupRuns.delete(server.id);
  }
}

async function deleteBackup(serverId, backupId) {
  const directory = backupPath(serverId, backupId);
  const metadata = JSON.parse(await readFile(join(directory, "backup.json"), "utf8"));
  if (metadata.serverId !== serverId || metadata.id !== backupId) throw new Error("Sauvegarde introuvable.");
  await rm(directory, { recursive: true, force: true });
  return metadata;
}

async function restoreBackup(server, backupId, { allowVersionChange = false } = {}) {
  if (modUpdateRuns.has(server.id)) throw new Error("Une modification des mods ou plugins est en cours.");
  if (backupRuns.has(server.id)) throw new Error("Une opération de sauvegarde est déjà en cours.");
  if (runtimes.get(server.id)?.process) throw new Error("Arrêtez le serveur avant de restaurer une sauvegarde.");
  backupRuns.add(server.id);
  let stagingPath;
  const destination = backupPath(server.id, backupId);
  try {
    await assertNoExternalServer(server);
    const metadata = JSON.parse(await readFile(join(destination, "backup.json"), "utf8"));
    if (metadata.serverId !== server.id || metadata.id !== backupId) throw new Error("Sauvegarde introuvable.");
    if (metadata.distribution !== server.type || (!allowVersionChange && metadata.version !== server.version)) {
      throw new Error("Cette sauvegarde provient d’une autre version ou distribution du serveur.");
    }
    const source = join(destination, "files");
    await access(source);
    const recovery = await createBackup(server, "pre-restore", { locked: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    stagingPath = join(DATA_DIR, "restore-staging", `${server.id}-${stamp}`);
    await mkdir(dirname(stagingPath), { recursive: true });
    await rename(join(SERVERS_DIR, server.id), stagingPath);
    try {
      await cp(source, join(SERVERS_DIR, server.id), serverCopyOptions);
      await rm(stagingPath, { recursive: true, force: true });
    } catch (error) {
      await rm(join(SERVERS_DIR, server.id), { recursive: true, force: true }).catch(() => {});
      await rename(stagingPath, join(SERVERS_DIR, server.id)).catch(() => {});
      throw error;
    }
    server.version = metadata.version;
    server.build = metadata.build ?? server.build;
    server.installation = { status: "ready", progress: 100, message: "Pret a demarrer" };
    server.updateRollback = null;
    server.updatedAt = new Date().toISOString();
    await writeServerConfig(server);
    const state = await loadState();
    const savedServer = state.servers.find((item) => item.id === server.id);
    if (savedServer) Object.assign(savedServer, {
      version: server.version,
      build: server.build,
      installation: server.installation,
      updateRollback: null,
      updatedAt: server.updatedAt,
    });
    await saveState(state);
    return { backup: metadata, recovery };
  } finally {
    backupRuns.delete(server.id);
  }
}

async function checkServerUpdate(server) {
  const latest = await latestDistribution(server.type);
  const updateAvailable = latest.version !== server.version || String(latest.build) !== String(server.build);
  return {
    current: { version: server.version, build: server.build },
    latest: { version: latest.version, build: latest.build },
    updateAvailable,
    rollbackAvailable: Boolean(server.updateRollback),
  };
}

async function updateServer(server) {
  await assertNoExternalServer(server);
  if (runtimes.get(server.id)?.process) throw new Error("Arrêtez le serveur avant de le mettre à jour.");
  if (server.installation?.status !== "ready") throw new Error("L'installation du serveur n'est pas terminée.");
  if (backupRuns.has(server.id) || modUpdateRuns.has(server.id)) throw new Error("Une autre opération sur les fichiers de cette instance est déjà en cours.");

  backupRuns.add(server.id);
  const previous = { version: server.version, build: server.build, installation: server.installation, updateRollback: server.updateRollback };
  const serverDir = join(SERVERS_DIR, server.id);
  const jarPath = join(serverDir, "server.jar");
  const downloadPath = join(serverDir, "server.jar.update");
  const previousJarPath = join(serverDir, "server.jar.before-update");
  let movedPreviousJar = false;
  try {
    const latest = await latestDistribution(server.type);
    if (latest.version === server.version && String(latest.build) === String(server.build)) {
      throw new Error("Ce serveur est déjà à jour.");
    }
    const backup = await createBackup(server, "pre-update", { locked: true });
    await rm(downloadPath, { force: true });
    await rm(previousJarPath, { force: true }).catch(() => {});
    await downloadFile(latest.url, downloadPath);
    await rename(jarPath, previousJarPath);
    movedPreviousJar = true;
    await rename(downloadPath, jarPath);

    server.version = latest.version;
    server.build = latest.build;
    server.installation = { status: "ready", progress: 100, message: "Pret a demarrer" };
    server.updateRollback = backup.id;
    server.updatedAt = new Date().toISOString();
    await writeServerConfig(server);
    const state = await loadState();
    const savedServer = state.servers.find((item) => item.id === server.id);
    if (savedServer) Object.assign(savedServer, {
      version: server.version,
      build: server.build,
      installation: server.installation,
      updateRollback: server.updateRollback,
      updatedAt: server.updatedAt,
    });
    await saveState(state);
    await rm(previousJarPath, { force: true });
    return { server: runtimeView(server), backup, current: { version: server.version, build: server.build } };
  } catch (error) {
    await rm(downloadPath, { force: true }).catch(() => {});
    if (movedPreviousJar) {
      await rm(jarPath, { force: true }).catch(() => {});
      await rename(previousJarPath, jarPath).catch(() => {});
    }
    Object.assign(server, previous);
    await writeServerConfig(server).catch(() => {});
    throw error;
  } finally {
    backupRuns.delete(server.id);
  }
}

async function pruneScheduledBackups(serverId, retention) {
  const scheduled = (await listBackups(serverId)).filter((backup) => backup.type === "scheduled");
  for (const backup of scheduled.slice(Math.max(1, retention))) {
    await deleteBackup(serverId, backup.id);
  }
}

function normalizeBackupSchedule(input = {}, previous = {}) {
  const intervals = [6, 12, 24, 48, 168];
  const retentionOptions = [1, 3, 5, 10, 20];
  const intervalHours = Number(input.intervalHours ?? previous.intervalHours ?? 24);
  const retention = Number(input.retention ?? previous.retention ?? 5);
  if (!intervals.includes(intervalHours)) throw new Error("Intervalle de sauvegarde invalide.");
  if (!retentionOptions.includes(retention)) throw new Error("Rétention de sauvegarde invalide.");
  const enabled = input.enabled === undefined ? Boolean(previous.enabled) : Boolean(input.enabled);
  return {
    enabled,
    intervalHours,
    retention,
    nextRunAt: enabled
      ? (previous.enabled && previous.intervalHours === intervalHours && previous.nextRunAt) || new Date(Date.now() + intervalHours * 3_600_000).toISOString()
      : null,
  };
}

function getHostCpuPercent() {
  const totals = os.cpus().reduce((result, cpu) => {
    const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
    result.total += total;
    result.idle += cpu.times.idle;
    return result;
  }, { total: 0, idle: 0 });
  const previous = cpuSnapshot;
  cpuSnapshot = totals;
  if (!previous) return 0;
  const totalDelta = totals.total - previous.total;
  const idleDelta = totals.idle - previous.idle;
  return totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 1000) / 10 : 0;
}

async function javaProcessMetrics(pid) {
  const processId = Number(pid);
  if (!Number.isInteger(processId) || processId <= 0) return null;
  try {
    if (process.platform === "win32") {
      const script = `$p=Get-Process -Id ${processId} -ErrorAction Stop; [pscustomobject]@{cpu=$p.CPU; memory=$p.WorkingSet64; elapsed=([DateTime]::Now-$p.StartTime).TotalSeconds} | ConvertTo-Json -Compress`;
      const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { timeout: 5000, windowsHide: true });
      const value = JSON.parse(stdout.trim());
      const elapsed = Math.max(1, Number(value.elapsed) || 1);
      return {
        cpuPercent: Math.min(100, Math.round((Number(value.cpu || 0) / elapsed / os.availableParallelism()) * 1000) / 10),
        memoryBytes: Number(value.memory) || 0,
      };
    }
    const { stdout } = await execFileAsync("ps", ["-p", String(processId), "-o", "%cpu=,rss="], { timeout: 5000 });
    const [cpu, memoryKb] = stdout.trim().split(/\s+/).map(Number);
    if (!Number.isFinite(memoryKb)) return null;
    return { cpuPercent: Math.min(100, Math.round((cpu / os.availableParallelism()) * 10) / 10), memoryBytes: memoryKb * 1024 };
  } catch {
    return null;
  }
}

async function collectMetrics(server) {
  const runtime = runtimes.get(server.id);
  const processMetrics = runtime?.process ? await javaProcessMetrics(runtime.process.pid) : null;
  let disk = null;
  try {
    const info = await statfs(DATA_DIR);
    const total = Number(info.blocks) * Number(info.bsize);
    const free = Number(info.bavail) * Number(info.bsize);
    disk = { totalBytes: total, freeBytes: free, usedBytes: Math.max(0, total - free) };
  } catch {}
  return {
    sampledAt: new Date().toISOString(),
    status: runtime?.status || "offline",
    onlinePlayers: runtime?.players.size || 0,
    process: processMetrics ? { ...processMetrics, memoryLimitBytes: Number(server.memory?.max || 0) * 1024 * 1024 } : null,
    host: {
      cpuPercent: getHostCpuPercent(),
      memoryTotalBytes: os.totalmem(),
      memoryUsedBytes: Math.max(0, os.totalmem() - os.freemem()),
      disk,
    },
  };
}

function metricFile(serverId) {
  return join(METRICS_DIR, `${serverId}.jsonl`);
}

async function readMetricHistory(serverId) {
  try {
    return (await readFile(metricFile(serverId), "utf8")).split(/\r?\n/).filter(Boolean).slice(-MAX_METRIC_SAMPLES).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code !== "ENOENT") console.warn(`Historique métrique ${serverId}: ${error.message}`);
    return [];
  }
}

const metricSampleRuns = new Set();

async function persistMetricSample(serverId, snapshot) {
  if (metricSampleRuns.has(serverId)) return;
  metricSampleRuns.add(serverId);
  try {
    const file = metricFile(serverId);
    const history = await readMetricHistory(serverId);
    const previous = history.at(-1);
    if (previous && Date.now() - new Date(previous.sampledAt).getTime() < 60_000) return;
    await mkdir(METRICS_DIR, { recursive: true });
    history.push(snapshot);
    const bounded = history.slice(-MAX_METRIC_SAMPLES);
    await writeFile(file, `${bounded.map((sample) => JSON.stringify(sample)).join("\n")}\n`, "utf8");
  } finally {
    metricSampleRuns.delete(serverId);
  }
}

async function sampleAllMetrics() {
  const state = await loadState();
  for (const server of state.servers) {
    const runtime = runtimes.get(server.id);
    if (!runtime?.process || runtime.status !== "online") continue;
    try {
      await persistMetricSample(server.id, await collectMetrics(server));
    } catch (error) {
      console.warn(`Mesure ${server.id}: ${error.message}`);
    }
  }
}

async function runScheduledBackups() {
  const state = await loadState();
  for (const server of state.servers) {
    const schedule = server.automation?.backup;
    if (!schedule?.enabled || !schedule.nextRunAt || Date.now() < new Date(schedule.nextRunAt).getTime()) continue;
    if (server.installation?.status !== "ready") continue;
    const runtime = runtimes.get(server.id);
    if (runtime?.process && runtime.status !== "online") continue;
    if (!runtime?.process && await isTcpPortInUse(server.settings.port)) {
      schedule.nextRunAt = new Date(Date.now() + schedule.intervalHours * 3_600_000).toISOString();
      await saveState(state);
      continue;
    }
    if (scheduledRuns.has(server.id)) continue;
    scheduledRuns.add(server.id);
    try {
      const backup = await createBackup(server, "scheduled");
      await pruneScheduledBackups(server.id, schedule.retention);
      schedule.nextRunAt = new Date(Date.now() + schedule.intervalHours * 3_600_000).toISOString();
      console.log(`Sauvegarde planifiée ${server.id}: ${backup.id}`);
    } catch (error) {
      schedule.nextRunAt = new Date(Date.now() + schedule.intervalHours * 3_600_000).toISOString();
      console.warn(`Sauvegarde planifiée ${server.id}: ${error.message}`);
    } finally {
      scheduledRuns.delete(server.id);
    }
    await saveState(state);
  }
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  const units = ["Ko", "Mo", "Go", "To"];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unit]}`;
}

async function readAllEvents(serverId) {
  const runtime = runtimes.get(serverId);
  if (runtime?.eventWrite) await runtime.eventWrite;
  try {
    const content = await readFile(eventFile(serverId), "utf8");
    return content.split(/\r?\n/).filter(Boolean).slice(-10000).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return [];
  }
}

async function readEvents(serverId, searchParams) {
  const allEvents = await readAllEvents(serverId);
  let events = allEvents;
  const type = String(searchParams.get("type") || "all");
  const player = String(searchParams.get("player") || "").toLowerCase();
  if (type !== "all") events = events.filter((event) => event.type === type);
  if (player) events = events.filter((event) => `${event.player || ""} ${event.target || ""}`.toLowerCase().includes(player));
  const limit = Math.min(1000, Math.max(1, Number(searchParams.get("limit") || 250)));
  const counts = allEvents.reduce((result, event) => {
    result[event.type] = (result[event.type] || 0) + 1;
    return result;
  }, {});
  return { events: events.slice(-limit).reverse(), counts, total: events.length };
}

function normalizeSettings(input = {}, current = {}) {
  const numberBetween = (value, fallback, min, max) => Math.min(max, Math.max(min, Number(value ?? fallback)));
  return {
    motd: String(input.motd ?? current.motd ?? "Un serveur MineHub").slice(0, 120),
    port: numberBetween(input.port, current.port ?? 25565, 1024, 65535),
    maxPlayers: numberBetween(input.maxPlayers, current.maxPlayers ?? 20, 1, 500),
    onlineMode: Boolean(input.onlineMode ?? current.onlineMode ?? true),
    whitelist: Boolean(input.whitelist ?? current.whitelist ?? false),
    pvp: Boolean(input.pvp ?? current.pvp ?? true),
    difficulty: ["peaceful", "easy", "normal", "hard"].includes(input.difficulty) ? input.difficulty : current.difficulty || "normal",
    gamemode: ["survival", "creative", "adventure", "spectator"].includes(input.gamemode) ? input.gamemode : current.gamemode || "survival",
    viewDistance: numberBetween(input.viewDistance, current.viewDistance ?? 10, 2, 32),
    simulationDistance: numberBetween(input.simulationDistance, current.simulationDistance ?? 8, 2, 32),
  };
}

async function searchMods(searchParams) {
  const query = String(searchParams.get("q") || "").slice(0, 80);
  const loader = String(searchParams.get("loader") || "fabric");
  const version = String(searchParams.get("version") || "");
  const projectTypes = loader === "paper"
    ? ["project_type:plugin", "project_type:mod"]
    : ["project_type:mod"];
  const facets = [projectTypes, [`categories:${loader}`]];
  if (version) facets.push([`versions:${version}`]);
  const url = new URL("https://api.modrinth.com/v2/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("index", "relevance");
  url.searchParams.set("facets", JSON.stringify(facets));
  const data = await fetchJson(url.toString());
  return data.hits.map((mod) => ({
    id: mod.project_id,
    slug: mod.slug,
    title: mod.title,
    description: mod.description,
    iconUrl: mod.icon_url,
    author: mod.author,
    downloads: mod.downloads,
    categories: mod.categories?.slice(0, 4) || [],
    latestVersion: mod.latest_version,
    projectType: mod.project_type,
  }));
}

async function installMod(server, projectId) {
  if (server.type === "vanilla") throw new Error("Vanilla ne prend pas en charge les mods");
  const loader = server.type === "paper" ? "paper" : "fabric";
  const url = new URL(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`);
  url.searchParams.set("loaders", JSON.stringify([loader]));
  url.searchParams.set("game_versions", JSON.stringify([server.version]));
  const versions = await fetchJson(url.toString());
  const selected = versions.find((item) => item.version_type === "release") || versions[0];
  const file = selected?.files?.find((item) => item.primary) || selected?.files?.[0];
  if (!file?.url) throw new Error("Aucune version compatible n'a ete trouvee");
  const folderName = server.type === "paper" ? "plugins" : "mods";
  const targetDir = join(SERVERS_DIR, server.id, folderName);
  await mkdir(targetDir, { recursive: true });
  const safeFileName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  await downloadFile(file.url, join(targetDir, safeFileName));
  const project = await fetchJson(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}`);
  const mod = {
    id: projectId,
    name: project.title,
    slug: project.slug,
    version: selected.version_number,
    fileName: safeFileName,
    enabled: true,
    iconUrl: project.icon_url,
    installedAt: new Date().toISOString(),
  };
  server.mods = [...(server.mods || []).filter((item) => item.id !== projectId), mod];
  return mod;
}

function modFolder(server) {
  return join(SERVERS_DIR, server.id, server.type === "paper" ? "plugins" : "mods");
}

async function compatibleModVersion(server, projectId) {
  const loader = server.type === "paper" ? "paper" : "fabric";
  const url = new URL(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`);
  url.searchParams.set("loaders", JSON.stringify([loader]));
  url.searchParams.set("game_versions", JSON.stringify([server.version]));
  const versions = await fetchJson(url.toString());
  return versions.find((item) => item.version_type === "release") || versions[0] || null;
}

async function checkModUpdates(server) {
  if (server.type === "vanilla") return [];
  return Promise.all((server.mods || []).map(async (mod) => {
    try {
      const latest = await compatibleModVersion(server, mod.id);
      return {
        id: mod.id,
        currentVersion: mod.version,
        latestVersion: latest?.version_number || null,
        updateAvailable: Boolean(latest?.version_number && latest.version_number !== mod.version),
      };
    } catch (error) {
      return { id: mod.id, currentVersion: mod.version, latestVersion: null, updateAvailable: false, error: error.message };
    }
  }));
}

async function lockModsForChange(server) {
  if (backupRuns.has(server.id) || modUpdateRuns.has(server.id)) throw new Error("Une autre operation sur les fichiers de cette instance est en cours.");
  if (runtimes.get(server.id)?.process) throw new Error("Arretez le serveur avant de modifier ses mods ou plugins.");
  modUpdateRuns.add(server.id);
  try {
    await assertNoExternalServer(server);
  } catch (error) {
    modUpdateRuns.delete(server.id);
    throw error;
  }
}

async function updateInstalledMod(server, mod, version) {
  if (!version?.version_number) throw new Error("Aucune version compatible disponible.");
  const file = version.files?.find((item) => item.primary) || version.files?.[0];
  if (!file?.url || !file.filename) throw new Error("La version Modrinth ne contient aucun fichier telechargeable.");
  const folder = modFolder(server);
  await mkdir(folder, { recursive: true });
  const fileName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if ((server.mods || []).some((item) => item.id !== mod.id && item.fileName === fileName)) {
    throw new Error(`Le fichier ${fileName} est deja utilise par un autre projet.`);
  }
  const oldName = mod.enabled ? mod.fileName : `${mod.fileName}.disabled`;
  const newName = mod.enabled ? fileName : `${fileName}.disabled`;
  const oldPath = join(folder, oldName);
  const newPath = join(folder, newName);
  const tempPath = join(folder, `${fileName}.minehub-download`);
  const backupPath = `${oldPath}.minehub-backup`;
  if (oldPath !== newPath) {
    try {
      await access(newPath);
      throw new Error(`Le fichier ${newName} existe deja dans le dossier.`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await rm(tempPath, { force: true });
  try {
    await downloadFile(file.url, tempPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  await rm(backupPath, { force: true });
  let movedOldFile = false;
  try {
    await rename(oldPath, backupPath);
    movedOldFile = true;
  } catch (error) {
    if (error.code !== "ENOENT") {
      await rm(tempPath, { force: true });
      throw error;
    }
  }
  try {
    await rename(tempPath, newPath);
  } catch (error) {
    if (movedOldFile) await rename(backupPath, oldPath).catch(() => {});
    await rm(tempPath, { force: true });
    throw error;
  }
  if (movedOldFile) await rm(backupPath, { force: true });
  mod.fileName = fileName;
  mod.version = version.version_number;
  mod.installedAt = new Date().toISOString();
  return mod;
}

async function toggleMod(server, modId, enabled) {
  const mod = (server.mods || []).find((item) => item.id === modId);
  if (!mod) throw new Error("Mod introuvable");
  if (mod.enabled === enabled) return mod;
  const folderName = server.type === "paper" ? "plugins" : "mods";
  const currentName = mod.enabled ? mod.fileName : `${mod.fileName}.disabled`;
  const nextName = enabled ? mod.fileName : `${mod.fileName}.disabled`;
  await rename(join(SERVERS_DIR, server.id, folderName, currentName), join(SERVERS_DIR, server.id, folderName, nextName));
  mod.enabled = enabled;
  return mod;
}

async function removeMod(server, modId) {
  const index = (server.mods || []).findIndex((item) => item.id === modId);
  if (index < 0) throw new Error("Mod introuvable");
  const mod = server.mods[index];
  const folderName = server.type === "paper" ? "plugins" : "mods";
  const fileName = mod.enabled ? mod.fileName : `${mod.fileName}.disabled`;
  await unlink(join(SERVERS_DIR, server.id, folderName, fileName)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  server.mods.splice(index, 1);
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (!isAuthorized(req)) return apiError(res, 401, "Jeton d'acces invalide");

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      name: "MineHub Agent",
      version: "0.10.0",
      host: HOST,
      node: process.version,
      root: DATA_DIR,
      secured: Boolean(API_TOKEN),
      now: new Date().toISOString(),
    });
  }

  if (req.method === "GET" && url.pathname === "/api/prerequisites") {
    return sendJson(res, 200, {
      node: { ...inspectNodeVersion(process.version, MIN_NODE_MAJOR), executable: process.execPath },
      java: await inspectJavaRuntime(),
      checkedAt: new Date().toISOString(),
    });
  }

  if (req.method === "GET" && url.pathname === "/api/versions") {
    const type = ["paper", "fabric", "vanilla"].includes(url.searchParams.get("type")) ? url.searchParams.get("type") : "paper";
    const versions = await getVersions(type);
    return sendJson(res, 200, { type, versions, source: versions === fallbackVersions ? "fallback" : "live" });
  }

  if (req.method === "GET" && url.pathname === "/api/settings-schema") {
    return sendJson(res, 200, { groups: PROPERTY_GROUPS, properties: PROPERTY_SCHEMA });
  }

  if (req.method === "GET" && url.pathname === "/api/general-settings") {
    return sendJson(res, 200, {
      instanceDirectory: SERVERS_DIR,
      defaultInstanceDirectory: join(DATA_DIR, "servers"),
      dataDirectory: DATA_DIR,
    });
  }

  if (req.method === "PATCH" && url.pathname === "/api/general-settings") {
    const body = await readBody(req);
    try {
      const instanceDirectory = await migrateInstanceDirectory(body.instanceDirectory, await loadState());
      return sendJson(res, 200, {
        instanceDirectory,
        defaultInstanceDirectory: join(DATA_DIR, "servers"),
        dataDirectory: DATA_DIR,
      });
    } catch (error) {
      return apiError(res, 409, error.message);
    }
  }

  if (req.method === "GET" && url.pathname === "/api/servers") {
    const state = await loadState();
    const servers = await Promise.all(state.servers.map(async (item) => {
      const view = runtimeView(item);
      if (view.status === "offline" && await isTcpPortInUse(item.settings.port)) view.status = "external";
      return view;
    }));
    return sendJson(res, 200, { servers });
  }

  if (req.method === "POST" && url.pathname === "/api/servers") {
    const body = await readBody(req);
    if (!String(body.name || "").trim()) return apiError(res, 400, "Le nom du serveur est obligatoire");
    if (!["paper", "fabric", "vanilla"].includes(body.type)) return apiError(res, 400, "Type de serveur invalide");
    const versions = await getVersions(body.type);
    if (!versions.includes(body.version)) return apiError(res, 400, "Version Minecraft invalide");
    if (!body.eula) return apiError(res, 400, "Vous devez accepter l'EULA Minecraft");

    const state = await loadState();
    const id = uniqueSlug(body.name, state.servers);
    const now = new Date().toISOString();
    const memoryMax = Math.min(32768, Math.max(1024, Number(body.memoryMax || 4096)));
    const server = {
      id,
      name: String(body.name).trim().slice(0, 48),
      type: body.type,
      version: body.version,
      build: null,
      memory: { min: Math.min(memoryMax, Math.max(512, Number(body.memoryMin || 1024))), max: memoryMax },
      settings: normalizeSettings(body.settings),
      installation: { status: "installing", progress: 15, message: "Recuperation de la distribution" },
      mods: [],
      eula: true,
      createdAt: now,
      updatedAt: now,
    };
    state.servers.push(server);
    await writeServerConfig(server);
    await saveState(state);
    installServer(id).catch((error) => console.error("Installation asynchrone:", error));
    return sendJson(res, 202, { server: runtimeView(server) });
  }

  const serverMatch = url.pathname.match(/^\/api\/servers\/([a-z0-9-]+)(?:\/(.+))?$/);
  if (!serverMatch) {
    if (req.method === "GET" && url.pathname === "/api/mods/search") {
      return sendJson(res, 200, { mods: await searchMods(url.searchParams) });
    }
    return apiError(res, 404, "Route introuvable");
  }

  const [, serverId, resource = ""] = serverMatch;
  const state = await loadState();
  const server = state.servers.find((item) => item.id === serverId);
  if (!server) return apiError(res, 404, "Serveur introuvable");

  if (req.method === "GET" && resource === "update-check") {
    return sendJson(res, 200, await checkServerUpdate(server));
  }

  if (req.method === "POST" && resource === "update") {
    return sendJson(res, 200, await updateServer(server));
  }

  if (req.method === "POST" && resource === "rollback-update") {
    if (!server.updateRollback) return apiError(res, 409, "Aucune mise à jour à annuler.");
    if (runtimes.get(serverId)?.process) return apiError(res, 409, "Arrêtez le serveur avant le retour arrière.");
    const backup = (await listBackups(serverId)).find((item) => item.id === server.updateRollback && item.type === "pre-update");
    if (!backup) return apiError(res, 404, "La sauvegarde de mise à jour est introuvable.");
    return sendJson(res, 200, await restoreBackup(server, backup.id, { allowVersionChange: true }));
  }

  if (req.method === "GET" && resource === "backups") {
    return sendJson(res, 200, { backups: await listBackups(serverId), running: backupRuns.has(serverId) });
  }

  if (req.method === "POST" && resource === "backups") {
    if (server.installation?.status !== "ready") return apiError(res, 409, "Attendez la fin de l’installation avant de sauvegarder.");
    if (backupRuns.has(serverId) || modUpdateRuns.has(serverId)) return apiError(res, 409, "Une opération sur les fichiers de cette instance est déjà en cours.");
    const backup = await createBackup(server, "manual");
    return sendJson(res, 201, { backup });
  }

  const backupActionMatch = resource.match(/^backups\/([A-Za-z0-9-]+)\/(restore)$/);
  if (req.method === "POST" && backupActionMatch) {
    if (backupRuns.has(serverId) || modUpdateRuns.has(serverId)) return apiError(res, 409, "Une opération sur les fichiers de cette instance est déjà en cours.");
    if (runtimes.get(serverId)?.process) return apiError(res, 409, "Arrêtez le serveur avant de restaurer une sauvegarde.");
    const result = await restoreBackup(server, backupActionMatch[1]);
    return sendJson(res, 200, result);
  }

  const backupMatch = resource.match(/^backups\/([A-Za-z0-9-]+)$/);
  if (req.method === "DELETE" && backupMatch) {
    if (backupRuns.has(serverId) || modUpdateRuns.has(serverId)) return apiError(res, 409, "Attendez la fin de l’opération en cours.");
    await deleteBackup(serverId, backupMatch[1]);
    if (server.updateRollback === backupMatch[1]) {
      server.updateRollback = null;
      server.updatedAt = new Date().toISOString();
      await saveState(state);
    }
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && resource === "schedule") {
    return sendJson(res, 200, { backup: server.automation?.backup || normalizeBackupSchedule() });
  }

  if (req.method === "PATCH" && resource === "schedule") {
    const body = await readBody(req);
    server.automation = { ...server.automation, backup: normalizeBackupSchedule(body.backup || {}, server.automation?.backup) };
    server.updatedAt = new Date().toISOString();
    await saveState(state);
    return sendJson(res, 200, { backup: server.automation.backup });
  }

  if (req.method === "GET" && resource === "metrics") {
    const current = await collectMetrics(server);
    if (current.process) await persistMetricSample(serverId, current);
    const history = await readMetricHistory(serverId);
    return sendJson(res, 200, { current, history, sampledEverySeconds: 60, historyHours: 24 });
  }

  if (req.method === "PATCH" && resource === "access") {
    const body = await readBody(req);
    try {
      server.publicAddress = normalizePublicAddress(body.publicAddress);
    } catch (error) {
      return apiError(res, 400, error.message);
    }
    server.updatedAt = new Date().toISOString();
    await writeServerConfig(server);
    await saveState(state);
    return sendJson(res, 200, { server: runtimeView(server) });
  }

  if (req.method === "PATCH" && resource === "settings") {
    const body = await readBody(req);
    server.settings = normalizeSettings(body.settings, server.settings);
    if (body.memory) {
      const max = Math.min(32768, Math.max(1024, Number(body.memory.max || server.memory.max)));
      server.memory = { min: Math.min(max, Math.max(512, Number(body.memory.min || server.memory.min))), max };
    }
    server.updatedAt = new Date().toISOString();
    await writeServerConfig(server, legacyProperties(server.settings));
    await saveState(state);
    return sendJson(res, 200, { server: runtimeView(server) });
  }

  if (req.method === "GET" && resource === "properties") {
    return sendJson(res, 200, { properties: await readServerProperties(server), groups: PROPERTY_GROUPS, schema: PROPERTY_SCHEMA });
  }

  if (req.method === "PATCH" && resource === "properties") {
    const body = await readBody(req);
    const patch = normalizePropertyPatch(body.properties || {});
    const current = await readServerProperties(server);
    const merged = { ...current, ...patch };
    const removedKeys = Array.isArray(body.removedKeys)
      ? body.removedKeys.map((key) => String(key)).filter((key) => /^[A-Za-z0-9_.-]{1,96}$/.test(key))
      : [];
    for (const key of removedKeys) delete merged[key];
    server.settings = settingsFromProperties(merged, server.settings);
    if (body.memory) {
      const max = Math.min(65536, Math.max(1024, Number(body.memory.max || server.memory.max)));
      server.memory = { min: Math.min(max, Math.max(512, Number(body.memory.min || server.memory.min))), max };
    }
    server.updatedAt = new Date().toISOString();
    await writeServerConfig(server, patch, removedKeys);
    await saveState(state);
    return sendJson(res, 200, { server: runtimeView(server), properties: merged });
  }

  if (req.method === "POST" && resource === "action") {
    if (backupRuns.has(serverId) || modUpdateRuns.has(serverId)) return apiError(res, 409, "Attendez la fin de l’opération sur les fichiers.");
    const body = await readBody(req);
    if (body.action === "start") await startServer(server);
    else if (body.action === "stop") await stopServer(serverId);
    else if (body.action === "restart") {
      await stopServer(serverId);
      setTimeout(() => startServer(server).catch(console.error), 3_000).unref();
    } else return apiError(res, 400, "Action inconnue");
    return sendJson(res, 202, { server: runtimeView(server) });
  }

  if (req.method === "GET" && resource === "logs") {
    const runtime = runtimes.get(serverId);
    if (runtime) await runtime.logWrite;
    const search = String(url.searchParams.get("search") || "").slice(0, 200);
    const level = ["all", "info", "warning", "error"].includes(url.searchParams.get("level")) ? url.searchParams.get("level") : "all";
    const logs = await readConsoleLogs(serverId, { search, level });
    return sendJson(res, 200, { logs });
  }

  if (req.method === "GET" && resource === "logs/export") {
    const runtime = runtimes.get(serverId);
    if (runtime) await runtime.logWrite;
    const content = await exportConsoleLogs(serverId);
    return sendText(res, 200, content, { "Content-Disposition": `attachment; filename="${serverId}-console.log"` });
  }

  if (req.method === "GET" && resource === "players") {
    return sendJson(res, 200, await playerSnapshot(server));
  }

  if (req.method === "POST" && resource === "players/access") {
    const result = await updatePlayerAccess(server, await readBody(req));
    return sendJson(res, result.queued ? 202 : 200, result);
  }

  const playerActionMatch = resource.match(/^players\/([A-Za-z0-9_]{1,16})\/action$/);
  if (req.method === "POST" && playerActionMatch) {
    const body = await readBody(req);
    const count = executePlayerAction(server, playerActionMatch[1], body);
    return sendJson(res, 202, { ok: true, commands: count });
  }

  if (req.method === "GET" && resource === "events") {
    return sendJson(res, 200, await readEvents(serverId, url.searchParams));
  }

  if (req.method === "POST" && resource === "world/action") {
    const body = await readBody(req);
    const count = executeWorldAction(server, body);
    return sendJson(res, 202, { ok: true, commands: count });
  }

  if (req.method === "POST" && resource === "command") {
    const body = await readBody(req);
    const runtime = requireRuntime(serverId);
    const command = String(body.command || "").replace(/[\r\n]/g, "").slice(0, 500);
    if (!command) return apiError(res, 400, "Commande vide");
    sendRuntimeCommand(runtime, command);
    recordEvent(runtime, { type: "admin", title: "Commande console", detail: command, meta: { action: "command" } });
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && resource === "mods") {
    return sendJson(res, 200, { mods: server.mods || [] });
  }

  if (req.method === "GET" && resource === "mods/updates") {
    return sendJson(res, 200, { updates: await checkModUpdates(server) });
  }

  if (req.method === "POST" && resource === "mods/update") {
    const body = await readBody(req);
    const requestedId = String(body.modId || "");
    const targets = requestedId
      ? (server.mods || []).filter((mod) => mod.id === requestedId)
      : (server.mods || []).filter((mod) => mod.id);
    if (requestedId && !targets.length) return apiError(res, 404, "Mod ou plugin introuvable.");
    await lockModsForChange(server);
    const updated = [];
    const failed = [];
    let backup = null;
    try {
      const checks = await checkModUpdates(server);
      const available = new Set(checks.filter((item) => item.updateAvailable).map((item) => item.id));
      const toUpdate = targets.filter((mod) => available.has(mod.id));
      for (const result of checks.filter((item) => item.error && targets.some((mod) => mod.id === item.id))) {
        failed.push({ id: result.id, name: targets.find((mod) => mod.id === result.id)?.name, error: result.error });
      }
      if (toUpdate.length) backup = await createBackup(server, "pre-mod-update", { allowModUpdate: true });
      for (const mod of targets) {
        if (!available.has(mod.id)) continue;
        try {
          const latest = await compatibleModVersion(server, mod.id);
          if (!latest?.version_number || latest.version_number === mod.version) continue;
          updated.push(await updateInstalledMod(server, mod, latest));
        } catch (error) {
          failed.push({ id: mod.id, name: mod.name, error: error.message });
        }
      }
      if (updated.length) {
        server.updatedAt = new Date().toISOString();
        await writeServerConfig(server);
        await saveState(state);
      }
    } finally {
      modUpdateRuns.delete(serverId);
    }
    return sendJson(res, 200, { updated, failed, mods: server.mods || [], backup });
  }

  if (req.method === "POST" && resource === "mods") {
    await lockModsForChange(server);
    try {
      const body = await readBody(req);
      const mod = await installMod(server, String(body.projectId || ""));
      server.updatedAt = new Date().toISOString();
      await writeServerConfig(server);
      await saveState(state);
      return sendJson(res, 201, { mod, mods: server.mods });
    } finally {
      modUpdateRuns.delete(serverId);
    }
  }

  const modMatch = resource.match(/^mods\/([A-Za-z0-9_-]+)$/);
  if (modMatch && req.method === "PATCH") {
    await lockModsForChange(server);
    try {
      const body = await readBody(req);
      const mod = await toggleMod(server, modMatch[1], Boolean(body.enabled));
      await writeServerConfig(server);
      await saveState(state);
      return sendJson(res, 200, { mod, mods: server.mods });
    } finally {
      modUpdateRuns.delete(serverId);
    }
  }

  if (modMatch && req.method === "DELETE") {
    await lockModsForChange(server);
    try {
      await removeMod(server, modMatch[1]);
      await writeServerConfig(server);
      await saveState(state);
      return sendJson(res, 200, { ok: true, mods: server.mods });
    } finally {
      modUpdateRuns.delete(serverId);
    }
  }

  return apiError(res, 404, "Operation introuvable");
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(PUBLIC_DIR, `.${safePath}`);
  if (!filePath.startsWith(PUBLIC_DIR)) return apiError(res, 403, "Acces refuse");
  try {
    const details = await stat(filePath);
    if (!details.isFile()) throw new Error("Not a file");
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    const index = join(PUBLIC_DIR, "index.html");
    if (existsSync(index)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      createReadStream(index).pipe(res);
    } else apiError(res, 404, "Fichier introuvable");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (error) {
    console.error(`${req.method} ${url.pathname}:`, error);
    if (!res.headersSent) apiError(res, 500, error.message || "Erreur interne");
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MineHub Manager disponible sur http://${HOST}:${PORT}`);
  console.log(`Dossier des serveurs: ${SERVERS_DIR}`);
  setInterval(() => runScheduledBackups().catch((error) => console.warn("Planificateur de sauvegardes:", error.message)), 60_000).unref();
  setInterval(() => sampleAllMetrics().catch((error) => console.warn("Surveillance:", error.message)), 60_000).unref();
  setTimeout(() => runScheduledBackups().catch((error) => console.warn("Planificateur de sauvegardes:", error.message)), 5_000).unref();
});

function shutdown() {
  for (const runtime of runtimes.values()) {
    if (runtime.process) runtime.process.stdin.write("stop\n");
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
