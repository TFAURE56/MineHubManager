const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  servers: [],
  selectedId: localStorage.getItem("minehub:selected") || null,
  activeView: localStorage.getItem("minehub:view") || "overview",
  connection: readConnection(),
  health: null,
  loading: true,
  versions: [],
  versionType: "paper",
  selectedVersion: "",
  createStep: 1,
  createType: "paper",
  logs: [],
<<<<<<< HEAD
  logSearch: "",
  logLevel: "all",
  logSearchTimer: null,
  players: [],
  accessLists: { ops: [], whitelist: [], banned: [] },
  playersMeta: { online: 0, max: 0 },
  playerStats: [],
=======
  players: [],
  accessLists: { ops: [], whitelist: [], banned: [] },
  playersMeta: { online: 0, max: 0 },
>>>>>>> 77abf2e (0.5.1)
  selectedPlayer: null,
  events: [],
  eventCounts: {},
  eventFilter: "all",
  eventPlayerFilter: "",
  settingsSchema: null,
  serverProperties: null,
  settingsGroup: "general",
  modResults: null,
  modSearching: false,
<<<<<<< HEAD
  modUpdates: null,
  modUpdateChecking: false,
  modUpdating: null,
  modUpdateError: null,
=======
>>>>>>> 77abf2e (0.5.1)
  backups: [],
  backupRunning: false,
  backupsLoadedAt: 0,
  backupSchedule: { enabled: false, intervalHours: 24, retention: 5, nextRunAt: null },
  updateInfo: null,
  updateRunning: false,
<<<<<<< HEAD
=======
  appUpdateSettings: { repository: "" },
  appUpdateSettingsLoaded: false,
  appUpdateInfo: null,
  appUpdateLoading: false,
  appUpdateInstalling: false,
>>>>>>> 77abf2e (0.5.1)
  metrics: null,
  metricsHistory: [],
  metricsLoadedAt: 0,
  prerequisites: null,
<<<<<<< HEAD
  generalSettings: null,
  generalSettingsLoading: false,
  generalSettingsError: null,
=======
  prerequisitesLoading: false,
  prerequisitesError: null,
>>>>>>> 77abf2e (0.5.1)
};

const pageTitles = {
  overview: "Vue d’ensemble",
  players: "Joueurs",
<<<<<<< HEAD
  access: "Accès amis",
=======
>>>>>>> 77abf2e (0.5.1)
  activity: "Activité",
  backups: "Sauvegardes",
  updates: "Mises à jour",
  monitoring: "Surveillance",
  settings: "Configuration",
  mods: "Mods & plugins",
  console: "Console",
<<<<<<< HEAD
  generalSettings: "Paramètres généraux",
=======
>>>>>>> 77abf2e (0.5.1)
};

const statusLabels = {
  online: "En ligne",
  external: "Processus externe",
  offline: "Arrêté",
  starting: "Démarrage",
  stopping: "Arrêt en cours",
  installing: "Installation",
  error: "Erreur",
};

const typeLabels = { paper: "Paper", fabric: "Fabric", vanilla: "Vanilla" };
const gamemodeLabels = { survival: "Survie", creative: "Créatif", adventure: "Aventure", spectator: "Spectateur" };
const difficultyLabels = { peaceful: "Paisible", easy: "Facile", normal: "Normale", hard: "Difficile" };

const playerCatalogues = {
  item: [
    ["stone", "Pierre"], ["cobblestone", "Pierre taillÃ©e"], ["dirt", "Terre"], ["grass_block", "Bloc d'herbe"],
    ["oak_log", "BÃ»che de chÃªne"], ["oak_planks", "Planches de chÃªne"], ["glass", "Verre"], ["sand", "Sable"],
    ["gravel", "Gravier"], ["torch", "Torche"], ["lantern", "Lanterne"], ["crafting_table", "Ã‰tabli"],
    ["furnace", "Four"], ["chest", "Coffre"], ["ender_chest", "Coffre de l'Ender"], ["barrel", "Tonneau"],
    ["obsidian", "Obsidienne"], ["crying_obsidian", "Obsidienne pleureuse"], ["bedrock", "Bedrock"], ["tnt", "TNT"],
    ["diamond", "Diamant"], ["emerald", "Ã‰meraude"], ["iron_ingot", "Lingot de fer"], ["gold_ingot", "Lingot d'or"],
    ["copper_ingot", "Lingot de cuivre"], ["netherite_ingot", "Lingot de Netherite"], ["coal", "Charbon"], ["redstone", "Poudre de Redstone"],
    ["lapis_lazuli", "Lapis-lazuli"], ["quartz", "Quartz du Nether"], ["amethyst_shard", "Ã‰clat d'amÃ©thyste"],
    ["diamond_sword", "Ã‰pÃ©e en diamant"], ["iron_sword", "Ã‰pÃ©e en fer"], ["netherite_sword", "Ã‰pÃ©e en Netherite"],
    ["diamond_pickaxe", "Pioche en diamant"], ["iron_pickaxe", "Pioche en fer"], ["netherite_pickaxe", "Pioche en Netherite"],
    ["diamond_axe", "Hache en diamant"], ["diamond_shovel", "Pelle en diamant"], ["diamond_hoe", "Houe en diamant"],
    ["bow", "Arc"], ["crossbow", "ArbalÃ¨te"], ["trident", "Trident"], ["shield", "Bouclier"], ["arrow", "FlÃ¨che"],
    ["spectral_arrow", "FlÃ¨che spectrale"], ["tipped_arrow", "FlÃ¨che Ã  effet"], ["mace", "Masse"],
    ["diamond_helmet", "Casque en diamant"], ["diamond_chestplate", "Plastron en diamant"], ["diamond_leggings", "JambiÃ¨res en diamant"],
    ["diamond_boots", "Bottes en diamant"], ["netherite_chestplate", "Plastron en Netherite"], ["elytra", "Ã‰lytres"],
    ["turtle_helmet", "Carapace de tortue"], ["totem_of_undying", "Totem d'immortalitÃ©"], ["enchanted_golden_apple", "Pomme dorÃ©e enchantÃ©e"],
    ["golden_apple", "Pomme dorÃ©e"], ["bread", "Pain"], ["cooked_beef", "Steak"], ["golden_carrot", "Carotte dorÃ©e"],
    ["cooked_porkchop", "CÃ´telette cuite"], ["cooked_chicken", "Poulet cuit"], ["baked_potato", "Pomme de terre cuite"],
    ["cake", "GÃ¢teau"], ["enchanted_book", "Livre enchantÃ©"], ["experience_bottle", "Fiole d'expÃ©rience"],
    ["ender_pearl", "Perle de l'Ender"], ["ender_eye", "Oeil de l'Ender"], ["firework_rocket", "FusÃ©e"],
    ["water_bucket", "Seau d'eau"], ["lava_bucket", "Seau de lave"], ["milk_bucket", "Seau de lait"], ["saddle", "Selle"],
    ["name_tag", "Ã‰tiquette"], ["lead", "Laisse"], ["compass", "Boussole"], ["clock", "Horloge"],
    ["map", "Carte"], ["spyglass", "Longue-vue"], ["brush", "Pinceau"], ["heart_of_the_sea", "Coeur de la mer"],
    ["nether_star", "Ã‰toile du Nether"], ["dragon_egg", "Oeuf de dragon"], ["shulker_box", "BoÃ®te de Shulker"],
    ["beacon", "Balise"], ["conduit", "Conduit"], ["spawner", "GÃ©nÃ©rateur de monstres"],
  ].map(([id, label]) => ({ id: `minecraft:${id}`, label })),
  effect: [
    ["speed", "Vitesse"], ["slowness", "Lenteur"], ["haste", "CÃ©lÃ©ritÃ©"], ["mining_fatigue", "Fatigue miniÃ¨re"],
    ["strength", "Force"], ["instant_health", "Soin instantanÃ©"], ["instant_damage", "DÃ©gÃ¢ts instantanÃ©s"],
    ["jump_boost", "Saut amÃ©liorÃ©"], ["nausea", "NausÃ©e"], ["regeneration", "RÃ©gÃ©nÃ©ration"], ["resistance", "RÃ©sistance"],
    ["fire_resistance", "RÃ©sistance au feu"], ["water_breathing", "ApnÃ©e"], ["invisibility", "InvisibilitÃ©"],
    ["blindness", "CÃ©citÃ©"], ["night_vision", "Vision nocturne"], ["hunger", "Faim"], ["weakness", "Faiblesse"],
    ["poison", "Poison"], ["wither", "Wither"], ["health_boost", "Bonus de vie"], ["absorption", "Absorption"],
    ["saturation", "Saturation"], ["glowing", "Lueur"], ["levitation", "LÃ©vitation"], ["luck", "Chance"],
    ["unluck", "Malchance"], ["slow_falling", "Chute lente"], ["conduit_power", "Pouvoir du conduit"],
    ["dolphins_grace", "GrÃ¢ce du dauphin"], ["bad_omen", "Mauvais prÃ©sage"], ["hero_of_the_village", "HÃ©ros du village"],
    ["darkness", "ObscuritÃ©"], ["trial_omen", "PrÃ©sage funeste"], ["raid_omen", "PrÃ©sage de raid"],
    ["wind_charged", "Charge de vent"], ["weaving", "Tissage"], ["oozing", "Suintement"], ["infested", "Infestation"],
  ].map(([id, label]) => ({ id: `minecraft:${id}`, label })),
};

function readConnection() {
  try {
    return JSON.parse(sessionStorage.getItem("minehub:connection")) || { mode: "local", base: "", token: "", name: "Cet appareil" };
  } catch {
    return { mode: "local", base: "", token: "", name: "Cet appareil" };
  }
}

function saveConnection(connection) {
  state.connection = connection;
  sessionStorage.setItem("minehub:connection", JSON.stringify(connection));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
}

<<<<<<< HEAD
function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111513" : "#171a1d");
  const button = $("#theme-toggle");
  if (button) {
    button.setAttribute("aria-label", dark ? "Activer le thème clair" : "Activer le mode sombre");
    button.setAttribute("aria-pressed", String(dark));
    button.title = dark ? "Activer le thème clair" : "Activer le mode sombre";
    button.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}"></i>`;
    refreshIcons();
  }
}

function toggleTheme() {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("minehub:theme", theme);
  } catch {}
  applyTheme(theme);
}

=======
>>>>>>> 77abf2e (0.5.1)
async function api(path, options = {}, connection = state.connection) {
  const base = String(connection.base || "").replace(/\/$/, "");
  const headers = { Accept: "application/json", ...options.headers };
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (connection.token) headers.Authorization = `Bearer ${connection.token}`;
  const response = await fetch(`${base}${path}`, { ...options, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Erreur HTTP ${response.status}`);
  return data;
}

function selectedServer() {
  return state.servers.find((server) => server.id === state.selectedId) || null;
}

function toast(title, message = "", kind = "success") {
  const item = document.createElement("div");
  item.className = `toast ${kind}`;
  item.innerHTML = `
    <i data-lucide="${kind === "error" ? "circle-alert" : "circle-check"}"></i>
    <div><strong>${escapeHtml(title)}</strong>${message ? `<span>${escapeHtml(message)}</span>` : ""}</div>
  `;
  $("#toast-region").append(item);
  refreshIcons();
  setTimeout(() => item.remove(), 4200);
}

function setButtonLoading(button, loading, label) {
  if (!button) return;
  if (loading) {
    button.dataset.original = button.innerHTML;
    button.innerHTML = `<i data-lucide="loader-circle"></i>${escapeHtml(label || "Chargement…")}`;
    button.classList.add("is-loading");
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.original || button.innerHTML;
    button.classList.remove("is-loading");
    button.disabled = false;
  }
  refreshIcons();
}

function formatMemory(megabytes) {
  return megabytes >= 1024 ? `${(megabytes / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Go` : `${megabytes} Mo`;
}

function formatDownloads(value) {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function formatUptime(date) {
  if (!date) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function updateConnectionUI() {
  const remote = state.connection.mode === "remote";
  $("#connection-name").textContent = remote ? state.connection.name || "Serveur distant" : "Cet appareil";
  $("#connection-status").textContent = state.health ? "Agent connecté" : "Agent indisponible";
  const dot = $("#open-connection .status-dot");
  dot.classList.toggle("online", Boolean(state.health));
}

async function loadHealth() {
  try {
    state.health = await api("/api/health");
  } catch (error) {
    state.health = null;
    if (state.connection.mode === "remote") toast("Connexion distante impossible", error.message, "error");
  }
  updateConnectionUI();
}

<<<<<<< HEAD
async function loadGeneralSettings() {
  state.generalSettingsLoading = true;
  state.generalSettingsError = null;
  try {
    state.generalSettings = await api("/api/general-settings");
  } catch (error) {
    state.generalSettingsError = error.message;
  } finally {
    state.generalSettingsLoading = false;
  }
}

=======
>>>>>>> 77abf2e (0.5.1)
async function loadServers({ silent = false } = {}) {
  try {
    const data = await api("/api/servers");
    state.servers = data.servers || [];
    if (!state.selectedId || !state.servers.some((server) => server.id === state.selectedId)) {
      state.selectedId = state.servers[0]?.id || null;
    }
    if (state.selectedId) localStorage.setItem("minehub:selected", state.selectedId);
    else localStorage.removeItem("minehub:selected");
    if (!silent) state.loading = false;
  } catch (error) {
    state.loading = false;
    if (!silent) toast("Impossible de charger les serveurs", error.message, "error");
  }
}

async function loadLogs() {
  const server = selectedServer();
  if (!server) return;
  try {
<<<<<<< HEAD
    const params = new URLSearchParams({ search: state.logSearch, level: state.logLevel });
    state.logs = (await api(`/api/servers/${server.id}/logs?${params}`)).logs || [];
  } catch {
    state.logs = [];
  }
  const output = $("#console-output");
  if (output) output.innerHTML = renderConsoleLines(server);
}

function renderConsoleLines(server) {
  return state.logs.length
    ? state.logs.map((line) => `<div class="console-line"><time class="console-time">${escapeHtml(line.time)}</time><span>${escapeHtml(line.text)}</span></div>`).join("")
    : `<div class="console-empty"><span>${state.logSearch || state.logLevel !== "all" ? "Aucune ligne ne correspond aux filtres." : server.status === "offline" ? "La console apparaîtra au démarrage du serveur." : "En attente des premières lignes…"}</span></div>`;
}

async function exportLogs(button) {
  const server = selectedServer();
  if (!server) return;
  try {
    const base = String(state.connection.base || "").replace(/\/$/, "");
    const headers = state.connection.token ? { Authorization: `Bearer ${state.connection.token}` } : {};
    const response = await fetch(`${base}/api/servers/${server.id}/logs/export`, { headers, cache: "no-store" });
    if (!response.ok) throw new Error("Téléchargement impossible");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${server.id}-console.log`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    toast("Export impossible", error.message, "error");
  }
=======
    state.logs = (await api(`/api/servers/${server.id}/logs`)).logs || [];
  } catch {
    state.logs = [];
  }
>>>>>>> 77abf2e (0.5.1)
}

async function loadPlayers() {
  const server = selectedServer();
  if (!server) return;
  try {
    const data = await api(`/api/servers/${server.id}/players`);
    state.players = data.players || [];
    state.accessLists = data.accessLists || { ops: [], whitelist: [], banned: [] };
<<<<<<< HEAD
    state.playerStats = data.playerStats || [];
=======
>>>>>>> 77abf2e (0.5.1)
    state.playersMeta = { online: data.online || 0, max: data.max || server.settings.maxPlayers, refreshedAt: data.refreshedAt };
    if (!state.selectedPlayer || !state.players.some((player) => player.name === state.selectedPlayer)) {
      state.selectedPlayer = state.players[0]?.name || null;
    }
  } catch {
    state.players = [];
    state.accessLists = { ops: [], whitelist: [], banned: [] };
<<<<<<< HEAD
    state.playerStats = [];
=======
>>>>>>> 77abf2e (0.5.1)
    state.playersMeta = { online: 0, max: server.settings.maxPlayers };
  }
}

async function loadEvents() {
  const server = selectedServer();
  if (!server) return;
  const query = new URLSearchParams({ type: state.eventFilter, player: state.eventPlayerFilter, limit: "300" });
  try {
    const data = await api(`/api/servers/${server.id}/events?${query}`);
    state.events = data.events || [];
    state.eventCounts = data.counts || {};
  } catch {
    state.events = [];
    state.eventCounts = {};
  }
}

async function loadBackups() {
  const server = selectedServer();
  if (!server) return;
  try {
    const data = await api(`/api/servers/${server.id}/backups`);
    state.backups = data.backups || [];
    state.backupRunning = Boolean(data.running);
    state.backupsLoadedAt = Date.now();
  } catch (error) {
    state.backups = [];
    state.backupsLoadedAt = Date.now();
    toast("Sauvegardes indisponibles", error.message, "error");
  }
}

async function loadBackupSchedule() {
  const server = selectedServer();
  if (!server) return;
  try {
    const data = await api(`/api/servers/${server.id}/schedule`);
    state.backupSchedule = data.backup || state.backupSchedule;
  } catch (error) {
    toast("Planification indisponible", error.message, "error");
  }
}

async function loadUpdateCheck() {
  const server = selectedServer();
  if (!server) return;
  try {
    state.updateInfo = await api(`/api/servers/${server.id}/update-check`);
  } catch (error) {
    state.updateInfo = { error: error.message };
  }
}

<<<<<<< HEAD
=======
async function loadAppUpdateSettings({ force = false, notify = false } = {}) {
  if (state.appUpdateSettingsLoaded && !force) return;
  try {
    state.appUpdateSettings = await api("/api/app-updates/settings");
    state.appUpdateSettingsLoaded = true;
    if (state.appUpdateSettings.repository) {
      state.appUpdateInfo = await api("/api/app-updates/check");
      if (notify && state.appUpdateInfo.updateAvailable) {
        toast("Mise à jour MineHub disponible", `La version ${state.appUpdateInfo.latest.version} peut être installée.`);
      }
    } else state.appUpdateInfo = null;
  } catch (error) {
    state.appUpdateSettings = { repository: "", error: error.message };
    state.appUpdateSettingsLoaded = true;
  } finally {
    render();
  }
}

async function checkAppUpdate() {
  state.appUpdateLoading = true;
  state.appUpdateInfo = null;
  render();
  try {
    state.appUpdateInfo = await api("/api/app-updates/check");
  } catch (error) {
    state.appUpdateInfo = { error: error.message };
  } finally {
    state.appUpdateLoading = false;
    render();
  }
}

async function installAppUpdate() {
  const version = state.appUpdateInfo?.latest?.version;
  const busyServers = state.servers.some((server) => ["online", "external", "starting", "stopping", "installing"].includes(server.status));
  if (!version || !state.appUpdateInfo?.updateAvailable || state.appUpdateInstalling || busyServers) return;
  if (!window.confirm(`Installer MineHub ${version} ? L'agent va redemarrer. Les donnees et mondes Minecraft seront conserves.`)) return;
  state.appUpdateInstalling = true;
  render();
  try {
    await api("/api/app-updates/install", { method: "POST", body: "{}" });
    const deadline = Date.now() + 90_000;
    let health = null;
    while (Date.now() < deadline) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 1200));
      try {
        health = await api("/api/health");
        if (health.version === version) break;
        health = null;
      } catch {
        health = null;
      }
    }
    if (!health) throw new Error("L'agent ne repond pas encore. Consulte les journaux de mise a jour puis relance MineHub si besoin.");
    state.health = health;
    state.appUpdateInfo = { ...state.appUpdateInfo, currentVersion: version, updateAvailable: false };
    toast("MineHub mis a jour", `Version ${version} installee et agent redemarre.`);
  } catch (error) {
    toast("Mise a jour automatique impossible", error.message, "error");
  } finally {
    state.appUpdateInstalling = false;
    render();
  }
}

async function saveAppUpdateSettings(form) {
  const button = $("button[type=submit]", form);
  setButtonLoading(button, true, "Enregistrement…");
  try {
    state.appUpdateSettings = await api("/api/app-updates/settings", {
      method: "PATCH",
      body: JSON.stringify({ repository: new FormData(form).get("repository") }),
    });
    state.appUpdateSettingsLoaded = true;
    toast("Source GitHub enregistrée", state.appUpdateSettings.repository || "Source supprimée");
    if (state.appUpdateSettings.repository) await checkAppUpdate();
    else state.appUpdateInfo = null;
  } catch (error) {
    toast("Enregistrement impossible", error.message, "error");
  } finally {
    render();
    if (button.isConnected) setButtonLoading(button, false);
  }
}

>>>>>>> 77abf2e (0.5.1)
async function applyServerUpdate(button) {
  const server = selectedServer();
  if (!server || state.updateRunning || server.status !== "offline") return;
  const target = state.updateInfo?.latest?.version || "la dernière version stable";
  if (!window.confirm(`Créer une sauvegarde complète puis mettre ${server.name} à jour vers ${target} ? Le serveur doit rester arrêté pendant l'opération.`)) return;
  state.updateRunning = true;
  render();
  try {
    const result = await api(`/api/servers/${server.id}/update`, { method: "POST", body: "{}" });
    toast("Mise à jour terminée", `${result.current.version} · sauvegarde ${result.backup.id}`);
    await loadServers({ silent: true });
    await loadUpdateCheck();
  } catch (error) {
    toast("Mise à jour impossible", error.message, "error");
    await loadServers({ silent: true });
    await loadUpdateCheck();
  } finally {
    state.updateRunning = false;
    render();
  }
}

async function rollbackServerUpdate() {
  const server = selectedServer();
  if (!server || state.updateRunning || server.status !== "offline") return;
  if (!window.confirm(`Revenir à la version précédente de ${server.name} ? Les fichiers actuels seront remplacés.`)) return;
  state.updateRunning = true;
  render();
  try {
    const result = await api(`/api/servers/${server.id}/rollback-update`, { method: "POST", body: "{}" });
    toast("Retour arrière terminé", `Version ${result.backup.version} restaurée`);
    await loadServers({ silent: true });
    await loadUpdateCheck();
  } catch (error) {
    toast("Retour arrière impossible", error.message, "error");
  } finally {
    state.updateRunning = false;
    render();
  }
}

async function loadMetrics({ notify = false } = {}) {
  const server = selectedServer();
  if (!server) return;
  try {
    const data = await api(`/api/servers/${server.id}/metrics`);
    state.metrics = data.current;
    state.metricsHistory = data.history || [];
    state.metricsLoadedAt = Date.now();
  } catch (error) {
    state.metrics = null;
    state.metricsLoadedAt = Date.now();
    if (notify) toast("Surveillance indisponible", error.message, "error");
  }
}

async function loadPrerequisites({ notify = false } = {}) {
<<<<<<< HEAD
  try {
    state.prerequisites = await api("/api/prerequisites");
  } catch (error) {
    state.prerequisites = { error: error.message };
    if (notify) toast("Vérification impossible", error.message, "error");
=======
  state.prerequisitesLoading = true;
  try {
    state.prerequisites = await api("/api/prerequisites");
    state.prerequisitesError = null;
  } catch (error) {
    state.prerequisites = null;
    state.prerequisitesError = error.message;
    if (notify) toast("Vérification impossible", error.message, "error");
  } finally {
    state.prerequisitesLoading = false;
>>>>>>> 77abf2e (0.5.1)
  }
}

async function loadProperties() {
  const server = selectedServer();
  if (!server) return;
  try {
    const data = await api(`/api/servers/${server.id}/properties`);
    state.serverProperties = data.properties || {};
    state.settingsSchema = { groups: data.groups || [], properties: data.schema || [] };
  } catch (error) {
    state.serverProperties = null;
    toast("Configuration indisponible", error.message, "error");
  }
}

function renderSidebar() {
  const list = $("#server-list");
  if (!state.servers.length) {
    list.innerHTML = `<div class="server-list-empty">Aucune instance installée.</div>`;
    return;
  }
  list.innerHTML = state.servers.map((server) => `
    <button class="server-item ${server.id === state.selectedId ? "is-active" : ""}" data-select-server="${server.id}">
      <span class="server-tile">${escapeHtml(server.type.slice(0, 1))}</span>
      <span class="server-item-copy">
        <strong>${escapeHtml(server.name)}</strong>
        <small>${escapeHtml(typeLabels[server.type])} ${escapeHtml(server.version)}</small>
      </span>
      <span class="status-dot ${escapeHtml(server.status)}" title="${escapeHtml(statusLabels[server.status] || server.status)}"></span>
    </button>
  `).join("");
}

function renderEmpty() {
  const health = state.health || {};
  return `
    <section class="empty-dashboard">
      <div class="empty-primary">
        <div class="block-scene" aria-hidden="true">
          <span class="block grass"></span><span class="block stone"></span><span class="block dirt"></span><span class="block copper"></span><span class="block-shadow"></span>
        </div>
        <h2>Votre premier serveur</h2>
        <p>Choisissez une distribution et une version. MineHub prépare les fichiers, la configuration et le lancement Java.</p>
        <button class="button primary" data-open-create><i data-lucide="plus"></i>Créer un serveur</button>
      </div>
      <aside class="empty-aside">
        <h3>Agent actif</h3>
        <div class="agent-fact"><span>Connexion</span><strong>${state.connection.mode === "remote" ? "Distante" : "Locale"}</strong></div>
        <div class="agent-fact"><span>Node.js</span><strong>${escapeHtml(health.node || "Indisponible")}</strong></div>
        <div class="agent-fact"><span>Sécurité</span><strong>${health.secured ? "Jeton requis" : "Accès local"}</strong></div>
        <div class="agent-fact"><span>Stockage</span><strong title="${escapeHtml(health.root || "")}">${escapeHtml(health.root ? health.root.split(/[\\/]/).slice(-2).join("/") : "—")}</strong></div>
        <div class="agent-ready"><span class="status-dot online"></span>Prêt à installer une instance</div>
      </aside>
    </section>
  `;
}

function statusPill(server) {
  const kind = server.status === "online" ? "success" : server.status === "error" ? "danger" : ["installing", "starting", "stopping", "external"].includes(server.status) ? "warning" : "";
  return `<span class="pill ${kind}"><span class="status-dot ${escapeHtml(server.status)}"></span>${escapeHtml(statusLabels[server.status] || server.status)}</span>`;
}

function serverActions(server) {
  const ready = server.installation?.status === "ready";
  if (server.status === "external") return `<span class="pill warning"><i data-lucide="triangle-alert"></i>Port utilisé hors de MineHub</span>`;
  if (server.status === "online" || server.status === "starting") {
    return `
      <button class="button secondary" data-action="restart" ${server.status !== "online" ? "disabled" : ""}><i data-lucide="rotate-cw"></i>Redémarrer</button>
      <button class="button danger" data-action="stop"><i data-lucide="square"></i>Arrêter</button>
    `;
  }
  return `<button class="button primary" data-action="start" ${ready ? "" : "disabled"}><i data-lucide="play"></i>Démarrer</button>`;
}

function renderServerHero(server) {
  return `
    <section class="server-hero">
      <div class="server-identity">
        <span class="server-avatar">${escapeHtml(server.name.slice(0, 1))}</span>
        <div>
          <h2>${escapeHtml(server.name)}</h2>
          <div class="server-meta">${statusPill(server)}<span>${escapeHtml(typeLabels[server.type])} ${escapeHtml(server.version)}</span><span>Port ${server.settings.port}</span></div>
        </div>
      </div>
      <div class="server-actions">${serverActions(server)}</div>
    </section>
  `;
}

function renderInstallation(server) {
  if (server.installation?.status === "ready") return "";
  const isError = server.installation?.status === "error";
  return `
    <section class="install-panel" style="${isError ? "border-color:#efcbc6;background:#fff6f5" : ""}">
      <div class="install-head">
        <div><strong>${isError ? "Installation interrompue" : "Installation en cours"}</strong><small>${escapeHtml(server.installation?.message || "Préparation de l’instance")}</small></div>
        <span class="pill ${isError ? "danger" : "warning"}">${isError ? "Erreur" : `${server.installation?.progress || 0} %`}</span>
      </div>
      ${isError ? "" : `<div class="progress-track"><span style="width:${Number(server.installation?.progress || 0)}%"></span></div>`}
    </section>
  `;
}

function renderConsole(server, expanded = false) {
<<<<<<< HEAD
  const lines = renderConsoleLines(server);
=======
  const lines = state.logs.length
    ? state.logs.map((line) => `<div class="console-line"><span class="console-time">${escapeHtml(line.time)}</span><span>${escapeHtml(line.text)}</span></div>`).join("")
    : `<div class="console-empty"><span>${server.status === "offline" ? "La console apparaîtra au démarrage du serveur." : "En attente des premières lignes…"}</span></div>`;
>>>>>>> 77abf2e (0.5.1)
  return `
    <section class="panel console" ${expanded ? "style=\"min-height:calc(100vh - 220px)\"" : ""}>
      <header class="panel-header">
        <div><h2>Console</h2><p>${server.status === "online" ? "Flux Java actif" : statusLabels[server.status] || "Serveur arrêté"}</p></div>
        ${expanded ? "" : `<button class="button compact ghost" data-view-link="console">Agrandir<i data-lucide="maximize-2"></i></button>`}
      </header>
<<<<<<< HEAD
      <div class="console-tools">
        <label class="console-search"><i data-lucide="search"></i><input id="console-search" type="search" value="${escapeHtml(state.logSearch)}" placeholder="Rechercher dans les journaux" aria-label="Rechercher dans les journaux" /></label>
        <select id="console-level" aria-label="Filtrer par niveau">
          <option value="all" ${state.logLevel === "all" ? "selected" : ""}>Tous les niveaux</option>
          <option value="info" ${state.logLevel === "info" ? "selected" : ""}>Info</option>
          <option value="warning" ${state.logLevel === "warning" ? "selected" : ""}>Avertissements</option>
          <option value="error" ${state.logLevel === "error" ? "selected" : ""}>Erreurs</option>
        </select>
        <button class="icon-button" type="button" data-export-logs aria-label="Télécharger les journaux" title="Télécharger les journaux"><i data-lucide="download"></i></button>
      </div>
=======
>>>>>>> 77abf2e (0.5.1)
      <div class="console-output" id="console-output">${lines}</div>
      <form class="console-form" id="console-form">
        <span>&gt;</span>
        <input id="console-command" autocomplete="off" placeholder="say Bonjour !" ${server.status === "online" ? "" : "disabled"} aria-label="Commande serveur" />
        <button class="icon-button" type="submit" ${server.status === "online" ? "" : "disabled"} aria-label="Envoyer la commande" title="Envoyer"><i data-lucide="send"></i></button>
      </form>
    </section>
  `;
}

function renderOverview(server) {
  const installedCount = server.mods?.length || 0;
  return `
    ${renderServerHero(server)}
    ${renderInstallation(server)}
    <section class="metrics-grid">
      <div class="metric"><span class="metric-icon"><i data-lucide="users"></i></span><div class="metric-copy"><span>Joueurs</span><strong>${server.onlinePlayers || 0} / ${server.settings.maxPlayers}</strong><small>${server.onlinePlayers ? `${server.onlinePlayers} connecté(s)` : "Aucun joueur connecté"}</small></div></div>
      <div class="metric"><span class="metric-icon"><i data-lucide="clock-3"></i></span><div class="metric-copy"><span>En ligne depuis</span><strong>${formatUptime(server.startedAt)}</strong><small>${server.status === "online" ? "Session active" : "Serveur arrêté"}</small></div></div>
      <div class="metric"><span class="metric-icon"><i data-lucide="memory-stick"></i></span><div class="metric-copy"><span>Mémoire max.</span><strong>${formatMemory(server.memory.max)}</strong><small>${formatMemory(server.memory.min)} au démarrage</small></div></div>
      <div class="metric"><span class="metric-icon"><i data-lucide="blocks"></i></span><div class="metric-copy"><span>${server.type === "paper" ? "Plugins" : "Mods"}</span><strong>${installedCount}</strong><small>${installedCount ? "Installés" : "Aucun installé"}</small></div></div>
    </section>
    <div class="dashboard-grid">
      ${renderConsole(server)}
      <div class="dashboard-side">
      <section class="panel">
        <header class="panel-header"><div><h2>Instance</h2><p>Paramètres actifs</p></div><button class="icon-button" data-view-link="settings" aria-label="Ouvrir la configuration" title="Configurer"><i data-lucide="settings"></i></button></header>
        <div class="details-list">
          <div class="detail-row"><span>Distribution</span><strong>${escapeHtml(typeLabels[server.type])}</strong></div>
          <div class="detail-row"><span>Version</span><strong>${escapeHtml(server.version)}${server.build ? ` · ${escapeHtml(server.build)}` : ""}</strong></div>
          <div class="detail-row"><span>Mode de jeu</span><strong>${escapeHtml(gamemodeLabels[server.settings.gamemode])}</strong></div>
          <div class="detail-row"><span>Difficulté</span><strong>${escapeHtml(difficultyLabels[server.settings.difficulty])}</strong></div>
          <div class="detail-row"><span>Authentification</span><strong>${server.settings.onlineMode ? "Officielle" : "Mode crack"}</strong></div>
          <div class="detail-row"><span>Liste blanche</span><strong>${server.settings.whitelist ? "Activée" : "Désactivée"}</strong></div>
        </div>
      </section>
      <section class="panel world-panel">
        <header class="panel-header"><div><h2>Monde</h2><p>Commandes rapides</p></div><i data-lucide="globe-2"></i></header>
        <div class="world-control-group"><span>Heure</span><div><button class="button compact secondary" data-world-action="time" data-value="day" ${server.status === "online" ? "" : "disabled"}><i data-lucide="sun"></i>Jour</button><button class="button compact secondary" data-world-action="time" data-value="night" ${server.status === "online" ? "" : "disabled"}><i data-lucide="moon"></i>Nuit</button></div></div>
        <div class="world-control-group"><span>Météo</span><div><button class="button compact secondary" data-world-action="weather" data-value="clear" ${server.status === "online" ? "" : "disabled"}><i data-lucide="sun-medium"></i>Claire</button><button class="button compact secondary" data-world-action="weather" data-value="rain" ${server.status === "online" ? "" : "disabled"}><i data-lucide="cloud-rain"></i>Pluie</button></div></div>
        <div class="world-control-group"><span>Sauvegarde</span><div><button class="button compact secondary" data-world-action="save" data-value="" ${server.status === "online" ? "" : "disabled"}><i data-lucide="save"></i>Forcer la sauvegarde</button></div></div>
      </section>
      </div>
    </div>
  `;
}

function formatSession(seconds) {
<<<<<<< HEAD
  const totalMinutes = Math.floor((seconds || 0) / 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days} j ${hours} h`;
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
=======
  const minutes = Math.floor((seconds || 0) / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
>>>>>>> 77abf2e (0.5.1)
}

function normalizedSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function autocompleteOptions(type, query) {
  const options = playerCatalogues[type] || [];
  const normalized = normalizedSearch(query).trim();
  if (!normalized) return options.slice(0, 8);
  return options.filter((option) => normalizedSearch(`${option.label} ${option.id}`).includes(normalized)).slice(0, 10);
}

function updatePlayerAutocomplete(input) {
  const wrapper = input.closest(".player-autocomplete");
  const menu = $(".autocomplete-menu", wrapper);
  const options = autocompleteOptions(input.dataset.playerAutocomplete, input.value);
  wrapper.dataset.activeIndex = "-1";
  menu.innerHTML = options.length
    ? options.map((option, index) => `<button type="button" class="autocomplete-option" id="${input.dataset.playerAutocomplete}-option-${index}" role="option" aria-selected="false" data-autocomplete-option="${index}" data-value="${escapeHtml(option.id)}"><span>${escapeHtml(option.label)}</span><code>${escapeHtml(option.id)}</code></button>`).join("")
    : `<div class="autocomplete-empty">Aucune suggestion. L'identifiant saisi sera conservé.</div>`;
  menu.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function closePlayerAutocomplete(input) {
  const wrapper = input.closest(".player-autocomplete");
  const menu = $(".autocomplete-menu", wrapper);
  menu.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  wrapper.dataset.activeIndex = "-1";
}

function selectPlayerAutocomplete(input, option) {
  input.value = option.dataset.value;
  closePlayerAutocomplete(input);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function hydratePlayerAutocompletes() {
  for (const [type, formId, fieldName] of [["item", "player-give-form", "item"], ["effect", "player-effect-form", "effect"]]) {
    const input = $(`#${formId} input[name="${fieldName}"]`);
    if (!input || input.closest(".player-autocomplete")) continue;
    const wrapper = document.createElement("div");
    wrapper.className = "player-autocomplete";
    wrapper.dataset.autocomplete = type;
    input.parentElement.insertBefore(wrapper, input);
    wrapper.append(input);
    const menu = document.createElement("div");
    menu.className = "autocomplete-menu";
    menu.id = `${type}-suggestions`;
    menu.setAttribute("role", "listbox");
    menu.hidden = true;
    wrapper.append(menu);
    input.dataset.playerAutocomplete = type;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", menu.id);
    input.setAttribute("aria-label", type === "item" ? "Objet à donner" : "Effet à appliquer");
    input.setAttribute("autocomplete", "off");
  }
}

function renderPlayerInspector(player) {
  if (!player) {
    return `<div class="player-inspector-empty"><i data-lucide="mouse-pointer-2"></i><p>Sélectionnez un joueur pour ouvrir ses actions.</p></div>`;
  }
  const targets = state.players.filter((item) => item.name !== player.name);
  return `
    <div class="player-profile-head">
      <span class="player-avatar large">${escapeHtml(player.name.slice(0, 2))}</span>
      <div><h3>${escapeHtml(player.name)}</h3><p>Session ${formatSession(player.sessionSeconds)}</p></div>
      <div class="player-badges">${player.operator ? `<span class="pill warning">OP</span>` : ""}${player.whitelisted ? `<span class="pill success">Whitelist</span>` : ""}</div>
    </div>
    <section class="action-section">
      <h4>Actions rapides</h4>
      <div class="quick-action-grid">
        <button class="quick-action" data-player-action="heal-feed" data-player="${escapeHtml(player.name)}"><i data-lucide="heart-pulse"></i><span>Soigner</span><small>PV + nourriture</small></button>
        <button class="quick-action" data-player-action="spawnpoint" data-player="${escapeHtml(player.name)}"><i data-lucide="map-pin-check"></i><span>Point d’apparition</span><small>Position actuelle</small></button>
        <button class="quick-action" data-player-action="clear-effects" data-player="${escapeHtml(player.name)}"><i data-lucide="sparkles"></i><span>Retirer les effets</span><small>Positifs et négatifs</small></button>
        <button class="quick-action danger" data-player-action="kill" data-player="${escapeHtml(player.name)}" data-confirm="Tuer ${escapeHtml(player.name)} ?"><i data-lucide="skull"></i><span>Tuer</span><small>Mort immédiate</small></button>
      </div>
    </section>
    <section class="action-section">
      <h4>Mode de jeu</h4>
      <div class="mode-buttons">
        ${Object.entries(gamemodeLabels).map(([value, label]) => `<button class="button compact secondary" data-player-action="gamemode" data-value="${value}" data-player="${escapeHtml(player.name)}">${label}</button>`).join("")}
      </div>
    </section>
    <section class="action-section">
      <h4>Téléportation</h4>
      <form class="compact-form" id="player-teleport-form" data-player="${escapeHtml(player.name)}">
        <label class="field"><span>Vers un joueur</span><select name="target"><option value="">Coordonnées personnalisées</option>${targets.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <div class="coordinate-grid"><input name="x" placeholder="X ou ~" /><input name="y" placeholder="Y ou ~" /><input name="z" placeholder="Z ou ~" /></div>
        <div class="inline-form-row"><select name="dimension"><option value="minecraft:overworld">Monde normal</option><option value="minecraft:the_nether">Nether</option><option value="minecraft:the_end">End</option></select><button class="button secondary" type="submit"><i data-lucide="locate-fixed"></i>Téléporter</button></div>
      </form>
    </section>
    <section class="action-section split-actions">
      <form class="compact-form" id="player-give-form" data-player="${escapeHtml(player.name)}">
        <h4>Donner un objet</h4>
        <div class="inline-form-row"><input name="item" required placeholder="minecraft:diamond" /><input class="count-input" name="count" type="number" min="1" max="6400" value="1" /><button class="icon-button primary-icon" type="submit" title="Donner" aria-label="Donner l’objet"><i data-lucide="package-plus"></i></button></div>
      </form>
      <form class="compact-form" id="player-xp-form" data-player="${escapeHtml(player.name)}">
        <h4>Niveaux d’expérience</h4>
        <div class="inline-form-row"><input name="levels" type="number" value="1" /><button class="button compact secondary" type="submit"><i data-lucide="sparkle"></i>Ajouter</button></div>
      </form>
    </section>
    <section class="action-section">
      <h4>Effet</h4>
      <form class="compact-form effect-form" id="player-effect-form" data-player="${escapeHtml(player.name)}">
        <input name="effect" required placeholder="speed" /><input name="duration" type="number" min="1" value="60" title="Durée en secondes" /><input name="amplifier" type="number" min="0" max="255" value="0" title="Amplificateur" /><button class="button compact secondary" type="submit">Appliquer</button>
      </form>
    </section>
    <section class="action-section">
      <h4>Message privé</h4>
      <form class="compact-form inline-form-row" id="player-message-form" data-player="${escapeHtml(player.name)}"><input name="message" required maxlength="160" placeholder="Message de l’administration…" /><button class="icon-button primary-icon" type="submit" aria-label="Envoyer" title="Envoyer"><i data-lucide="send"></i></button></form>
    </section>
    <section class="action-section">
      <h4>Permissions et modération</h4>
      <div class="mode-buttons">
        <button class="button compact secondary" data-player-action="${player.operator ? "deop" : "op"}" data-player="${escapeHtml(player.name)}"><i data-lucide="crown"></i>${player.operator ? "Retirer OP" : "Rendre OP"}</button>
        <button class="button compact secondary" data-player-action="${player.whitelisted ? "whitelist-remove" : "whitelist-add"}" data-player="${escapeHtml(player.name)}"><i data-lucide="list-checks"></i>${player.whitelisted ? "Retirer whitelist" : "Ajouter whitelist"}</button>
        <button class="button compact danger" data-player-action="kick" data-player="${escapeHtml(player.name)}"><i data-lucide="log-out"></i>Expulser</button>
        <button class="button compact danger" data-player-action="ban" data-player="${escapeHtml(player.name)}" data-confirm="Bannir ${escapeHtml(player.name)} ?"><i data-lucide="ban"></i>Bannir</button>
      </div>
    </section>
  `;
}

function renderAccessList(list, title, description, icon, entries) {
  return `
    <section class="panel access-group">
      <header class="panel-header"><div><h3><i data-lucide="${icon}"></i>${title}</h3><p>${description}</p></div><span class="pill">${entries.length}</span></header>
      <form class="access-add-form" data-access-form data-list="${list}">
        <input name="name" required maxlength="16" pattern="[A-Za-z0-9_]{1,16}" placeholder="Nom du joueur" aria-label="Nom du joueur" />
        ${list === "banned" ? `<input name="reason" maxlength="160" placeholder="Motif (facultatif)" aria-label="Motif du bannissement" />` : ""}
        <button class="icon-button primary-icon" type="submit" aria-label="Ajouter à ${title}" title="Ajouter"><i data-lucide="user-plus"></i></button>
      </form>
      ${entries.length ? `<ul class="access-entry-list">${entries.map((entry) => `<li><span><strong>${escapeHtml(entry.name)}</strong><small>${list === "ops" ? `Niveau ${Number(entry.level) || 4}` : list === "banned" ? escapeHtml(entry.reason || "Banni") : "Autorisé"}</small></span><button class="icon-button danger" data-access-remove data-list="${list}" data-name="${escapeHtml(entry.name)}" aria-label="Retirer ${escapeHtml(entry.name)}" title="Retirer"><i data-lucide="user-minus"></i></button></li>`).join("")}</ul>` : `<div class="access-empty">Aucun joueur dans cette liste.</div>`}
    </section>`;
}

function renderPlayers(server) {
  const online = state.players.length;
  const operators = state.players.filter((player) => player.operator).length;
  const selected = state.players.find((player) => player.name === state.selectedPlayer) || null;
  const accessLists = state.accessLists || { ops: [], whitelist: [], banned: [] };
  return `
    <section class="players-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Joueurs en ligne</h2><p>État temps réel et commandes ciblées.</p></div><button class="button secondary" data-refresh-players><i data-lucide="refresh-cw"></i>Actualiser</button></div>
      <div class="player-summary-grid">
        <div class="metric"><span class="metric-icon"><i data-lucide="users"></i></span><div class="metric-copy"><span>Connectés</span><strong>${online} / ${server.settings.maxPlayers}</strong><small>${server.status === "online" ? "Serveur disponible" : "Serveur arrêté"}</small></div></div>
        <div class="metric"><span class="metric-icon"><i data-lucide="crown"></i></span><div class="metric-copy"><span>Opérateurs en ligne</span><strong>${operators}</strong><small>Permissions élevées</small></div></div>
        <div class="metric"><span class="metric-icon"><i data-lucide="shield-check"></i></span><div class="metric-copy"><span>Whitelist</span><strong>${server.settings.whitelist ? "Active" : "Inactive"}</strong><small>${server.settings.onlineMode ? "Comptes vérifiés" : "Mode crack"}</small></div></div>
      </div>
      <div class="players-layout panel">
        <div class="players-roster">
          <header class="column-heading"><strong>Session actuelle</strong><span>${online} joueur(s)</span></header>
          ${online ? `<div class="player-list">${state.players.map((player) => `
            <button class="player-row ${player.name === state.selectedPlayer ? "is-active" : ""}" data-select-player="${escapeHtml(player.name)}">
              <span class="player-avatar">${escapeHtml(player.name.slice(0, 2))}</span><span class="player-row-copy"><strong>${escapeHtml(player.name)}</strong><small>Connecté depuis ${formatSession(player.sessionSeconds)}</small></span>${player.operator ? `<span class="pill warning">OP</span>` : ""}<i data-lucide="chevron-right"></i>
            </button>`).join("")}</div>` : `<div class="list-empty"><div><i data-lucide="user-round-x"></i><p>${server.status === "online" ? "Aucun joueur connecté." : "Démarrez le serveur pour gérer les joueurs."}</p></div></div>`}
        </div>
        <aside class="player-inspector">${renderPlayerInspector(selected)}</aside>
      </div>
<<<<<<< HEAD
      ${renderPlayerStats()}
=======
>>>>>>> 77abf2e (0.5.1)
      <div class="page-heading access-heading"><div><h2>Accès et modération</h2><p>Les listes restent consultables et modifiables serveur arrêté.</p></div></div>
      <div class="access-grid">
        ${renderAccessList("ops", "Opérateurs", "Permissions d'administration", "crown", accessLists.ops || [])}
        ${renderAccessList("whitelist", "Liste blanche", "Joueurs autorisés à rejoindre", "list-checks", accessLists.whitelist || [])}
        ${renderAccessList("banned", "Bannissements", "Comptes bloqués du serveur", "ban", accessLists.banned || [])}
      </div>
    </section>
  `;
}

<<<<<<< HEAD
function renderFriendAccess(server) {
  const address = server.publicAddress || "";
  const [agentMajor = 0, agentMinor = 0] = String(state.health?.version || "0.0.0").split(".").map(Number);
  const accessApiReady = agentMajor > 0 || agentMinor >= 9;
  return `
    <section class="friend-access-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Inviter des amis</h2><p>Publiez ce serveur avec un tunnel sécurisé, sans ouvrir de port sur votre box.</p></div><span class="pill ${server.status === "online" ? "success" : "warning"}">${server.status === "online" ? "Serveur en ligne" : "Serveur arrêté"}</span></div>
      <section class="panel friend-address-panel">
        <header class="panel-header"><div><h2>Adresse à partager</h2><p>À saisir dans Minecraft : Multijoueur → Connexion directe.</p></div><i data-lucide="copy"></i></header>
        ${address ? `<div class="public-address-value"><code>${escapeHtml(address)}</code><button class="button secondary" type="button" data-copy-public-address="${escapeHtml(address)}"><i data-lucide="copy"></i>Copier</button></div>` : `<div class="public-address-empty"><i data-lucide="link-2"></i><span>Ajoutez ici l’adresse attribuée par Playit.</span></div>`}
        <form class="public-address-form" id="public-address-form">
          <label class="field"><span>Adresse publique Minecraft</span><input name="publicAddress" value="${escapeHtml(address)}" maxlength="280" placeholder="mon-serveur.gl.joinmc.link:12345" autocomplete="url" ${accessApiReady ? "" : "disabled"} /></label>
          <button class="button primary" type="submit" ${accessApiReady ? "" : "disabled"}><i data-lucide="save"></i>Enregistrer</button>
        </form>
      </section>
      ${accessApiReady ? "" : `<div class="notice"><i data-lucide="rotate-cw"></i><span>L’agent MineHub doit être redémarré pour activer l’enregistrement de l’adresse. Je le laisse en route pendant que le serveur Minecraft est actif.</span></div>`}
      <section class="panel tunnel-setup-panel">
        <header class="panel-header"><div><h2>Créer le tunnel Playit</h2><p>L’agent tourne sur la machine qui héberge ce serveur. Tes amis n’ont rien à installer.</p></div><a class="icon-button" href="https://playit.gg/download" target="_blank" rel="noreferrer" aria-label="Télécharger Playit" title="Télécharger Playit"><i data-lucide="external-link"></i></a></header>
        <ol class="tunnel-steps">
          <li><span class="tunnel-step-number">1</span><div><strong>Installer et lancer l’agent</strong><p>Sur l’hôte Minecraft, télécharge Playit, lance-le puis associe l’agent à ton compte via le lien de revendication affiché.</p><a href="https://playit.gg/download" target="_blank" rel="noreferrer">Télécharger l’agent Playit <i data-lucide="arrow-up-right"></i></a></div></li>
          <li><span class="tunnel-step-number">2</span><div><strong>Créer un tunnel Minecraft Java</strong><p>Dans le tableau de bord Playit, ajoute un tunnel <b>Minecraft Java</b> pour cet agent. Destination locale : <code>127.0.0.1:${server.settings.port}</code>.</p><a href="https://playit.gg/account/setup/new-tunnel" target="_blank" rel="noreferrer">Ouvrir la création de tunnel <i data-lucide="arrow-up-right"></i></a></div></li>
          <li><span class="tunnel-step-number">3</span><div><strong>Partager l’adresse fournie</strong><p>Copie l’hôte et le port publics du tunnel, colle-les dans le champ ci-dessus, puis partage l’adresse avec tes amis.</p></div></li>
        </ol>
        <footer class="tunnel-footnote">Le tunnel Java est indiqué comme gratuit par Playit. L’agent doit rester actif pour que les amis puissent rejoindre. <a href="https://playit.gg/support/host-247-with-playit/" target="_blank" rel="noreferrer">Guide officiel pour le laisser actif</a>.</footer>
      </section>
      ${!server.settings.onlineMode ? `<div class="notice danger"><i data-lucide="shield-alert"></i><span>Le mode crack est activé. Pour une adresse publique, le mode authentifié et une liste blanche réduisent les risques d’usurpation et de connexions non désirées.</span></div>` : `<div class="notice"><i data-lucide="shield-check"></i><span>Ne partage cette adresse qu’avec les personnes que tu souhaites inviter. La liste blanche reste disponible dans la page Joueurs.</span></div>`}
    </section>
  `;
}

function renderGeneralSettings() {
  const settings = state.generalSettings;
  const [agentMajor = 0, agentMinor = 0] = String(state.health?.version || "0.0.0").split(".").map(Number);
  const apiReady = agentMajor > 0 || agentMinor >= 10;
  const defaultPath = state.health?.root ? `${state.health.root}${state.health.root.includes("\\") ? "\\" : "/"}servers` : "";
  const currentPath = settings?.instanceDirectory || defaultPath;
  const placeholder = currentPath.includes("\\") ? "C:\\Minecraft\\instances" : "/srv/minecraft/instances";

  return `
    <section class="general-settings-page">
      <div class="page-heading"><div><h2>Paramètres généraux</h2><p>Emplacement des fichiers d’instances Minecraft sur l’hôte MineHub.</p></div></div>
      ${state.generalSettingsLoading ? `<div class="skeleton"><div class="spinner"></div></div>` : `
        <section class="panel instance-location-panel">
          <header class="panel-header"><div><h2>Dossier des instances</h2><p>Chaque nouveau serveur sera créé dans ce dossier.</p></div><i data-lucide="folder-cog"></i></header>
          <form class="instance-location-form" id="instance-location-form">
            <label class="field"><span>Chemin absolu sur l’hôte MineHub</span><input name="instanceDirectory" value="${escapeHtml(currentPath)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" ${apiReady ? "" : "disabled"} /></label>
            <button class="button primary" type="submit" ${apiReady ? "" : "disabled"}><i data-lucide="save"></i>Appliquer</button>
          </form>
          <div class="instance-location-facts">
            <div><span>Emplacement actuel</span><code>${escapeHtml(currentPath || "—")}</code></div>
            <div><span>Données MineHub</span><code>${escapeHtml(settings?.dataDirectory || state.health?.root || "—")}</code></div>
          </div>
        </section>
        <div class="notice"><i data-lucide="folder-sync"></i><span>Le changement copie les instances existantes vers le nouveau dossier et conserve les fichiers d’origine comme copie de secours. Toutes les instances doivent être arrêtées et le dossier choisi doit être vide ou inexistant. Le chemin est celui de la machine qui exécute l’agent MineHub.</span></div>
        ${!apiReady || state.generalSettingsError ? `<div class="notice"><i data-lucide="rotate-cw"></i><span>L’agent MineHub doit être redémarré après l’arrêt des serveurs Minecraft pour activer ce réglage.</span></div>` : ""}
      `}
    </section>
  `;
}

function renderPlayerStats() {
  const rows = state.playerStats || [];
  return `
    <section class="panel player-stats-panel">
      <header class="panel-header"><div><h2>Statistiques joueurs</h2><p>Compteurs cumulés du monde, complétés par l’activité MineHub.</p></div><span class="pill">${rows.length} joueur(s)</span></header>
      ${rows.length ? `<div class="player-stats-scroll"><table class="player-stats-table">
        <thead><tr><th>Joueur</th><th>Temps de jeu</th><th>Morts</th><th>Kills PvP</th><th>Mobs</th><th>Succès</th><th>Blocs minés</th><th>Messages</th><th>Dernière activité</th></tr></thead>
        <tbody>${rows.map((player) => `<tr>
          <th scope="row"><span class="stats-player-name">${escapeHtml(player.name)}${player.online ? `<span class="online-dot" title="En ligne"></span>` : ""}</span></th>
          <td>${escapeHtml(formatSession(player.playTimeSeconds + (player.hasNativeStats ? player.currentSessionSeconds : 0)))}</td>
          <td>${Number(player.deaths).toLocaleString("fr-FR")}</td>
          <td>${Number(player.playerKills).toLocaleString("fr-FR")}</td>
          <td>${Number(player.mobKills).toLocaleString("fr-FR")}</td>
          <td>${Number(player.advancements).toLocaleString("fr-FR")}</td>
          <td>${Number(player.blocksMined).toLocaleString("fr-FR")}</td>
          <td>${Number(player.chatMessages).toLocaleString("fr-FR")}</td>
          <td>${player.online ? "En ligne" : player.lastSeenAt || player.lastActivityAt ? escapeHtml(formatShortDate(player.lastSeenAt || player.lastActivityAt)) : "—"}</td>
        </tr>`).join("")}</tbody>
      </table></div>` : `<div class="list-empty"><div><i data-lucide="activity"></i><p>Les statistiques apparaîtront après la première connexion des joueurs.</p></div></div>`}
      <footer class="player-stats-footnote">Temps de jeu, morts, kills, mobs, blocs et succès proviennent des stats Minecraft. Les connexions et messages sont comptés par MineHub.</footer>
    </section>
  `;
}

=======
>>>>>>> 77abf2e (0.5.1)
const eventMeta = {
  join: { label: "Connexions", icon: "log-in", tone: "green" },
  leave: { label: "Déconnexions", icon: "log-out", tone: "muted" },
  death: { label: "Morts", icon: "skull", tone: "red" },
  pvp: { label: "PvP", icon: "swords", tone: "red" },
  advancement: { label: "Succès", icon: "trophy", tone: "amber" },
  chat: { label: "Chat", icon: "message-square", tone: "blue" },
<<<<<<< HEAD
  crash: { label: "Arrêt anormal", icon: "triangle-alert", tone: "red" },
=======
>>>>>>> 77abf2e (0.5.1)
  admin: { label: "Administration", icon: "shield", tone: "violet" },
  system: { label: "Système", icon: "server-cog", tone: "muted" },
};

function formatEventDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function renderActivity(server) {
<<<<<<< HEAD
  const filters = ["all", "join", "leave", "death", "pvp", "advancement", "chat", "crash", "admin", "system"];
=======
  const filters = ["all", "join", "death", "pvp", "advancement", "chat", "admin", "system"];
>>>>>>> 77abf2e (0.5.1)
  return `
    <section class="activity-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Activité globale</h2><p>Historique persistant des événements importants.</p></div><button class="button secondary" data-refresh-events><i data-lucide="refresh-cw"></i>Actualiser</button></div>
      <section class="activity-stats">
<<<<<<< HEAD
        <div><span>Morts</span><strong>${state.eventCounts.death || 0}</strong></div><div><span>Éliminations PvP</span><strong>${state.eventCounts.pvp || 0}</strong></div><div><span>Succès</span><strong>${state.eventCounts.advancement || 0}</strong></div><div><span>Connexions</span><strong>${state.eventCounts.join || 0}</strong></div><div><span>Messages</span><strong>${state.eventCounts.chat || 0}</strong></div>
=======
        <div><span>Morts</span><strong>${state.eventCounts.death || 0}</strong></div><div><span>Éliminations PvP</span><strong>${state.eventCounts.pvp || 0}</strong></div><div><span>Succès</span><strong>${state.eventCounts.advancement || 0}</strong></div><div><span>Connexions</span><strong>${state.eventCounts.join || 0}</strong></div>
>>>>>>> 77abf2e (0.5.1)
      </section>
      <section class="panel activity-panel">
        <div class="activity-toolbar">
          <div class="filter-tabs">${filters.map((type) => `<button class="${state.eventFilter === type ? "is-active" : ""}" data-event-filter="${type}">${type === "all" ? "Tout" : eventMeta[type]?.label || type}</button>`).join("")}</div>
          <label class="search-box"><i data-lucide="search"></i><input id="event-player-filter" value="${escapeHtml(state.eventPlayerFilter)}" placeholder="Filtrer par joueur…" /></label>
        </div>
        <div class="event-list">
          ${state.events.length ? state.events.map((event) => {
            const meta = eventMeta[event.type] || eventMeta.system;
            return `<article class="event-row"><span class="event-icon ${meta.tone}"><i data-lucide="${meta.icon}"></i></span><div class="event-copy"><div><strong>${escapeHtml(event.title)}</strong><span class="pill">${escapeHtml(meta.label)}</span></div><p>${escapeHtml(event.detail)}</p></div><time>${escapeHtml(formatEventDate(event.timestamp))}</time></article>`;
          }).join("") : `<div class="list-empty"><div><i data-lucide="activity"></i><p>Aucun événement ne correspond à ce filtre.</p></div></div>`}
        </div>
      </section>
    </section>
  `;
}

function formatBytes(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go", "To"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${units[unit]}`;
}

function formatShortDate(value) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function renderMetricChart(history) {
  const width = 900;
  const height = 250;
  const insetX = 42;
  const insetY = 18;
  const plotWidth = width - insetX - 12;
  const plotHeight = height - insetY * 2;
  const cpu = history.map((sample) => Number(sample.process?.cpuPercent || 0));
  const memory = history.map((sample) => sample.process?.memoryLimitBytes
    ? Number(sample.process.memoryBytes || 0) / Number(sample.process.memoryLimitBytes) * 100
    : 0);
  const line = (values) => values.map((value, index) => {
    const x = insetX + (values.length < 2 ? plotWidth : index / (values.length - 1) * plotWidth);
    const y = insetY + plotHeight - Math.min(100, Math.max(0, value)) / 100 * plotHeight;
    return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const grid = [0, 25, 50, 75, 100].map((value) => {
    const y = insetY + plotHeight - value / 100 * plotHeight;
    return `<line x1="${insetX}" y1="${y}" x2="${width - 12}" y2="${y}" class="chart-grid" /><text x="0" y="${y + 4}" class="chart-label">${value}%</text>`;
  }).join("");
  if (!history.length) return `<div class="chart-empty"><i data-lucide="chart-no-axes-combined"></i><span>Les mesures apparaîtront après le premier échantillon.</span></div>`;
  return `<svg class="metric-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Évolution du processeur et de la mémoire Java sur 24 heures">${grid}<path d="${line(cpu)}" class="chart-line cpu-line" /><path d="${line(memory)}" class="chart-line memory-line" /></svg>`;
}

function renderMonitoring(server) {
  const current = state.metrics;
  const process = current?.process;
  const host = current?.host;
  const memoryPercent = process?.memoryLimitBytes ? Math.min(100, process.memoryBytes / process.memoryLimitBytes * 100) : 0;
  const alerts = [];
  if (process?.cpuPercent >= 90) alerts.push({ tone: "warning", text: `Le processus Java utilise ${process.cpuPercent.toLocaleString("fr-FR")} % du processeur.` });
  if (memoryPercent >= 90) alerts.push({ tone: "warning", text: `La mémoire Java est utilisée à ${memoryPercent.toFixed(0)} %.` });
  if (host?.disk?.freeBytes < 5 * 1024 ** 3) alerts.push({ tone: "danger", text: `Il reste moins de 5 Go sur le disque de l’agent (${formatBytes(host.disk.freeBytes)}).` });
  const nextRun = state.backupSchedule?.nextRunAt;
<<<<<<< HEAD
  const prerequisites = state.prerequisites;
  const node = prerequisites?.node;
  const java = prerequisites?.java;
=======
  const node = state.prerequisites?.node;
  const java = state.prerequisites?.java;
  const prerequisitesRows = [
    {
      icon: "box",
      name: "Node.js",
      value: node?.version || "Non vérifié",
      detail: node?.executable || "Runtime utilisé par MineHub",
      status: node?.compatible ? "Compatible" : node ? `Requis : ${node.minimumMajor}+` : "En attente",
      tone: node?.compatible ? "success" : node ? "danger" : "",
    },
    {
      icon: "coffee",
      name: "Java",
      value: java?.installed ? java.version : java ? "Non installé" : "Non vérifié",
      detail: java?.executable || "Nécessaire pour démarrer Minecraft",
      status: java?.installed ? "Détecté" : java ? "Installation requise" : "En attente",
      tone: java?.installed ? "success" : java ? "danger" : "",
    },
  ];
>>>>>>> 77abf2e (0.5.1)
  return `
    <section class="monitoring-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Surveillance</h2><p>État du processus Java et de la machine hôte.</p></div><button class="button secondary" data-refresh-monitoring><i data-lucide="refresh-cw"></i>Actualiser</button></div>
<<<<<<< HEAD
      <section class="panel prerequisite-panel">
        <header class="panel-header"><div><h2>Prérequis de l’agent</h2><p>Versions détectées sur cette machine</p></div><span class="pill ${node?.compatible && java?.installed ? "success" : prerequisites ? "warning" : ""}">${prerequisites ? node?.compatible && java?.installed ? "Opérationnel" : "À vérifier" : "Vérification…"}</span></header>
        ${prerequisites?.error ? `<div class="prerequisite-error">${escapeHtml(prerequisites.error)}</div>` : `<div class="prerequisite-list">
          <div><span class="prerequisite-icon"><i data-lucide="box"></i></span><div><strong>Node.js</strong><small>${node ? `${escapeHtml(node.version)} · requis : ${node.minimumMajor}+` : "Non détecté"}</small></div><span class="pill ${node?.compatible ? "success" : "danger"}">${node?.compatible ? "Compatible" : node ? "Mise à jour requise" : "Indisponible"}</span></div>
          <div><span class="prerequisite-icon"><i data-lucide="coffee"></i></span><div><strong>Java</strong><small>${java?.installed ? `${escapeHtml(java.version)} · ${escapeHtml(java.executable)}` : "Introuvable · installe Java ou configure JAVA_HOME / JAVA_PATH"}</small></div><span class="pill ${java?.installed ? "success" : "danger"}">${java?.installed ? "Détecté" : "Absent"}</span></div>
        </div>`}
      </section>
      ${alerts.length ? `<div class="monitor-alerts">${alerts.map((alert) => `<div class="notice ${alert.tone}"><i data-lucide="${alert.tone === "danger" ? "triangle-alert" : "activity"}"></i><span>${escapeHtml(alert.text)}</span></div>`).join("")}</div>` : `<div class="monitor-ok"><i data-lucide="circle-check"></i><span>Aucune alerte de ressources.</span></div>`}
=======
      ${alerts.length ? `<div class="monitor-alerts">${alerts.map((alert) => `<div class="notice ${alert.tone}"><i data-lucide="${alert.tone === "danger" ? "triangle-alert" : "activity"}"></i><span>${escapeHtml(alert.text)}</span></div>`).join("")}</div>` : `<div class="monitor-ok"><i data-lucide="circle-check"></i><span>Aucune alerte de ressources.</span></div>`}
      <section class="panel prerequisite-panel">
        <header class="panel-header"><div><h2>Prérequis de l’hôte</h2><p>Contrôle de Node.js et de Java sur la machine qui exécute MineHub.</p></div><button class="icon-button" data-refresh-prerequisites aria-label="Vérifier Node.js et Java" title="Vérifier"><i data-lucide="refresh-cw"></i></button></header>
        ${state.prerequisitesLoading ? `<div class="chart-empty"><div class="spinner"></div></div>` : state.prerequisitesError ? `<div class="notice danger"><i data-lucide="circle-alert"></i><span>${escapeHtml(state.prerequisitesError)}</span></div>` : `
          <div class="prerequisite-list">${prerequisitesRows.map((item) => `<article class="prerequisite-row"><span class="prerequisite-icon"><i data-lucide="${item.icon}"></i></span><div class="prerequisite-copy"><strong>${item.name}</strong><span>${escapeHtml(item.value)}</span><code>${escapeHtml(item.detail)}</code></div><span class="pill ${item.tone}">${item.status}</span></article>`).join("")}</div>
          <div class="prerequisite-footnote">La compatibilité Java requise dépend de la version Minecraft et de sa distribution.</div>
        `}
      </section>
>>>>>>> 77abf2e (0.5.1)
      <div class="monitor-grid">
        <section class="monitor-card"><div><span>CPU Java</span><i data-lucide="cpu"></i></div><strong>${process ? `${process.cpuPercent.toLocaleString("fr-FR")} %` : "—"}</strong><small>${host ? `Hôte : ${host.cpuPercent.toLocaleString("fr-FR")} %` : "Processus arrêté"}</small><div class="meter"><span style="width:${Math.min(100, process?.cpuPercent || 0)}%"></span></div></section>
        <section class="monitor-card"><div><span>Mémoire Java</span><i data-lucide="memory-stick"></i></div><strong>${process ? formatBytes(process.memoryBytes) : "—"}</strong><small>${process ? `${formatBytes(process.memoryLimitBytes)} alloués · ${memoryPercent.toFixed(0)} %` : "Processus arrêté"}</small><div class="meter"><span style="width:${memoryPercent}%"></span></div></section>
        <section class="monitor-card"><div><span>Joueurs connectés</span><i data-lucide="users"></i></div><strong>${current?.onlinePlayers ?? 0} / ${server.settings.maxPlayers}</strong><small>${statusLabels[current?.status] || "Mesure en attente"}</small><div class="meter blue"><span style="width:${Math.min(100, ((current?.onlinePlayers || 0) / Math.max(1, server.settings.maxPlayers)) * 100)}%"></span></div></section>
        <section class="monitor-card"><div><span>Disque agent</span><i data-lucide="hard-drive"></i></div><strong>${host?.disk ? formatBytes(host.disk.freeBytes) : "—"}</strong><small>${host?.disk ? `${formatBytes(host.disk.usedBytes)} utilisés sur ${formatBytes(host.disk.totalBytes)}` : "Mesure indisponible"}</small><div class="meter amber"><span style="width:${host?.disk?.totalBytes ? Math.min(100, host.disk.usedBytes / host.disk.totalBytes * 100) : 0}%"></span></div></section>
      </div>
      <section class="panel monitor-history">
        <header class="panel-header"><div><h2>Processeur et mémoire Java</h2><p>Historique des dernières 24 heures · échantillon chaque minute</p></div><span class="pill">${state.metricsHistory.length} mesures</span></header>
        <div class="chart-legend"><span><i class="legend-dot cpu-dot"></i>CPU Java</span><span><i class="legend-dot memory-dot"></i>Mémoire Java utilisée</span><small>${current?.sampledAt ? `Actualisé ${formatShortDate(current.sampledAt)}` : "En attente"}</small></div>
        ${renderMetricChart(state.metricsHistory)}
      </section>
      <section class="panel monitor-summary">
        <div><span>Dernière mesure</span><strong>${current?.sampledAt ? formatShortDate(current.sampledAt) : "Aucune"}</strong></div>
        <div><span>Sauvegarde planifiée</span><strong>${nextRun ? formatShortDate(nextRun) : "Désactivée"}</strong></div>
        <button class="button compact secondary" data-view-link="backups"><i data-lucide="archive"></i>Ouvrir les sauvegardes</button>
      </section>
    </section>`;
}

function renderBackups(server) {
  const totalBytes = state.backups.reduce((sum, backup) => sum + Number(backup.sizeBytes || 0), 0);
  const schedule = state.backupSchedule;
  const scheduleOptions = [6, 12, 24, 48, 168];
  const retentionOptions = [1, 3, 5, 10, 20];
  const typeLabels = { manual: "Manuelle", scheduled: "Planifiée", "pre-restore": "Avant restauration", "pre-update": "Avant mise à jour" };
  return `
    <section class="backups-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Sauvegardes</h2><p>Snapshots complets de l’instance, du monde et des fichiers de configuration.</p></div><button class="button primary" data-create-backup ${state.backupRunning ? "disabled" : ""}><i data-lucide="archive-restore"></i>${state.backupRunning ? "Sauvegarde en cours…" : "Créer une sauvegarde"}</button></div>
      <div class="backup-summary">
        <div><span>Sauvegardes</span><strong>${state.backups.length}</strong></div>
        <div><span>Espace occupé</span><strong>${formatBytes(totalBytes)}</strong></div>
        <div><span>Prochaine automatique</span><strong>${schedule.nextRunAt ? formatShortDate(schedule.nextRunAt) : "Désactivée"}</strong></div>
      </div>
      <section class="panel backup-schedule">
        <header class="panel-header"><div><h2>Planification automatique</h2><p>Une copie est créée même si le serveur est arrêté.</p></div><span class="pill ${schedule.enabled ? "success" : ""}">${schedule.enabled ? "Active" : "Désactivée"}</span></header>
        <form id="backup-schedule-form" class="schedule-form">
          <label class="toggle-row schedule-toggle"><span><strong>Activer les sauvegardes planifiées</strong><small>La première sauvegarde sera créée après l’intervalle choisi.</small></span><input name="enabled" type="checkbox" ${schedule.enabled ? "checked" : ""} /><span class="switch"></span></label>
          <label class="field"><span>Fréquence</span><select name="intervalHours">${scheduleOptions.map((hours) => `<option value="${hours}" ${Number(schedule.intervalHours) === hours ? "selected" : ""}>${hours < 24 ? `Toutes les ${hours} h` : hours === 24 ? "Chaque jour" : hours === 48 ? "Tous les 2 jours" : "Chaque semaine"}</option>`).join("")}</select></label>
          <label class="field"><span>Conserver</span><select name="retention">${retentionOptions.map((count) => `<option value="${count}" ${Number(schedule.retention) === count ? "selected" : ""}>${count} sauvegarde${count > 1 ? "s" : ""}</option>`).join("")}</select></label>
          <button class="button secondary" type="submit"><i data-lucide="calendar-check"></i>Enregistrer</button>
        </form>
      </section>
      <section class="panel backup-list-panel">
        <header class="panel-header"><div><h2>Historique</h2><p>La restauration remplace les fichiers du serveur et nécessite son arrêt. Une copie de récupération est créée avant l’opération.</p></div><button class="icon-button" data-refresh-backups aria-label="Actualiser les sauvegardes" title="Actualiser"><i data-lucide="refresh-cw"></i></button></header>
        ${state.backups.length ? `<div class="backup-list">${state.backups.map((backup) => `<article class="backup-row"><span class="backup-icon"><i data-lucide="archive"></i></span><div class="backup-copy"><strong>${escapeHtml(formatShortDate(backup.createdAt))}</strong><small>${escapeHtml(backup.serverName)} · ${escapeHtml(backup.version)} · ${escapeHtml(formatBytes(backup.sizeBytes))}</small></div><span class="pill ${backup.type === "scheduled" ? "success" : ""}">${escapeHtml(typeLabels[backup.type] || backup.type)}</span><div class="backup-actions"><button class="button compact secondary" data-restore-backup="${escapeHtml(backup.id)}" ${server.status === "online" || state.backupRunning ? "disabled" : ""}><i data-lucide="rotate-ccw"></i>Restaurer</button><button class="icon-button danger" data-delete-backup="${escapeHtml(backup.id)}" aria-label="Supprimer la sauvegarde" title="Supprimer"><i data-lucide="trash-2"></i></button></div></article>`).join("")}</div>` : `<div class="list-empty"><div><i data-lucide="archive"></i><p>Aucune sauvegarde pour cette instance.</p></div></div>`}
      </section>
    </section>`;
}

<<<<<<< HEAD
=======
function renderAppUpdates() {
  const info = state.appUpdateInfo;
  const repository = state.appUpdateSettings.repository || "";
  const busyServers = state.servers.some((server) => ["online", "external", "starting", "stopping", "installing"].includes(server.status));
  const statusTitle = state.appUpdateLoading
    ? "Recherche de la dernière Release"
    : info?.error
      ? "Vérification impossible"
      : info?.updateAvailable
        ? "Mise à jour de MineHub disponible"
        : info
          ? "MineHub est à jour"
          : "Mise à jour de MineHub";
  const releaseNotes = info?.latest?.notes
    ? escapeHtml(info.latest.notes).replace(/\r?\n/g, "<br>")
    : "Aucune note de version fournie.";

  return `
    <section class="panel app-update-panel">
      <header class="panel-header"><div><h2>${statusTitle}</h2><p>Version installée : ${escapeHtml(state.health?.version || "inconnue")}${info?.latest ? ` · Version GitHub : ${escapeHtml(info.latest.version)}` : ""}</p></div><span class="pill ${info?.updateAvailable ? "warning" : info && !info.error ? "success" : ""}">${info?.updateAvailable ? "Disponible" : info && !info.error ? "À jour" : "MineHub"}</span></header>
      <form class="app-update-source" id="app-update-source-form">
        <label class="field"><span>Dépôt GitHub public (owner/repo)</span><input name="repository" value="${escapeHtml(repository)}" placeholder="ex. owner/MineHub" autocomplete="off" /></label>
        <button class="button secondary" type="submit"><i data-lucide="save"></i>Enregistrer</button>
        <button class="button primary" type="button" data-check-app-update ${!repository || state.appUpdateLoading ? "disabled" : ""}><i data-lucide="refresh-cw"></i>${state.appUpdateLoading ? "Vérification…" : "Vérifier"}</button>
      </form>
      ${state.appUpdateSettings.error ? `<div class="notice"><i data-lucide="circle-alert"></i><span>${escapeHtml(state.appUpdateSettings.error)}</span></div>` : ""}
      ${info?.error ? `<div class="notice"><i data-lucide="circle-alert"></i><span>${escapeHtml(info.error)}</span></div>` : ""}
      ${info?.latest ? `
        <div class="app-update-release">
          <div><span>Publication</span><strong>${escapeHtml(info.latest.name || info.latest.version)}</strong><small>${info.latest.publishedAt ? escapeHtml(formatShortDate(info.latest.publishedAt)) : "Date inconnue"}</small></div>
          <a class="button ${info.updateAvailable ? "primary" : "secondary"}" href="${escapeHtml(info.latest.url)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i>${info.updateAvailable ? "Ouvrir la mise à jour" : "Voir la Release"}</a>
        </div>
        <div class="app-update-notes">${releaseNotes}</div>
      ` : `<div class="app-update-empty"><i data-lucide="github"></i><span>${repository ? "Lance une vérification pour consulter la dernière Release publiée." : "Configure ton dépôt GitHub pour activer la vérification des versions."}</span></div>`}
      ${info?.updateAvailable ? `<div class="app-update-install"><button class="button primary" type="button" data-install-app-update ${state.appUpdateInstalling || busyServers ? "disabled" : ""}><i data-lucide="download"></i>${state.appUpdateInstalling ? "Installation et redémarrage…" : "Installer et redémarrer MineHub"}</button><small>${busyServers ? "Arrête tous les serveurs Minecraft avant la mise à jour." : "L'agent redémarre automatiquement. Les mondes et paramètres restent en place."}</small></div>` : ""}
      <div class="notice"><i data-lucide="shield-check"></i><span>La mise à jour remplace les fichiers de l’application, jamais le dossier <code>data/</code>.</span></div>
    </section>
  `;
}

>>>>>>> 77abf2e (0.5.1)
function renderUpdates(server) {
  const info = state.updateInfo;
  const canOperate = server.status === "offline" && !state.updateRunning;
  return `
    <section class="backups-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Mises à jour</h2><p>Vérifiez la distribution et revenez à la version précédente si nécessaire.</p></div><button class="button secondary" data-refresh-update ${state.updateRunning ? "disabled" : ""}><i data-lucide="refresh-cw"></i>Vérifier</button></div>
<<<<<<< HEAD
=======
      ${renderAppUpdates()}
>>>>>>> 77abf2e (0.5.1)
      <section class="panel backup-schedule">
        <header class="panel-header"><div><h2>${info?.error ? "Vérification impossible" : info?.updateAvailable ? "Mise à jour disponible" : info ? "Serveur à jour" : "Recherche des mises à jour"}</h2><p>${info?.error ? escapeHtml(info.error) : "Une sauvegarde complète est créée avant toute mise à jour."}</p></div><span class="pill ${info?.updateAvailable ? "warning" : info && !info.error ? "success" : ""}">${info?.updateAvailable ? "Disponible" : info && !info.error ? "À jour" : ""}</span></header>
        <div class="backup-summary"><div><span>Version installée</span><strong>${escapeHtml(info?.current?.version || server.version)}${info?.current?.build ? ` · ${escapeHtml(info.current.build)}` : ""}</strong></div><div><span>Dernière version stable</span><strong>${escapeHtml(info?.latest?.version || "—")}${info?.latest?.build ? ` · ${escapeHtml(info.latest.build)}` : ""}</strong></div></div>
        <div class="update-actions">
          <button class="button primary" data-apply-update ${!canOperate || !info?.updateAvailable ? "disabled" : ""}><i data-lucide="download"></i>${state.updateRunning ? "Mise à jour…" : "Sauvegarder et mettre à jour"}</button>
          ${server.updateRollback ? `<button class="button secondary" data-rollback-update ${!canOperate ? "disabled" : ""}><i data-lucide="undo-2"></i>Revenir à la version précédente</button>` : ""}
          ${server.status !== "offline" ? `<span class="field-hint">Arrêtez le serveur pour effectuer cette opération.</span>` : ""}
        </div>
      </section>
    </section>`;
}

function propertyInput(definition, value) {
  const key = escapeHtml(definition.key);
  const current = String(value ?? definition.default ?? "");
  if (definition.type === "boolean") {
    return `<label class="toggle-row property-toggle"><span><strong>${escapeHtml(definition.label)}</strong><small>${escapeHtml(definition.description)}</small><code>${key}</code></span><input data-property-key="${key}" type="checkbox" ${current === "true" ? "checked" : ""} /><span class="switch"></span></label>`;
  }
  let control;
  if (definition.type === "select") {
    control = `<select data-property-key="${key}">${definition.options.map((option) => `<option value="${escapeHtml(option)}" ${current === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
  } else {
    const type = definition.secret ? "password" : definition.type === "number" ? "number" : "text";
    const bounds = definition.type === "number" ? `min="${definition.min}" max="${definition.max}"` : "";
    control = `<input data-property-key="${key}" type="${type}" ${bounds} value="${escapeHtml(current)}" autocomplete="${definition.secret ? "new-password" : "off"}" />`;
  }
  return `<label class="property-field ${definition.wide ? "wide" : ""}"><span><strong>${escapeHtml(definition.label)}</strong><code>${key}</code></span><small>${escapeHtml(definition.description)}</small>${control}</label>`;
}

function renderSettings(server) {
  if (!state.settingsSchema || !state.serverProperties) {
    return `${renderServerHero(server)}<div class="skeleton"><div class="spinner"></div></div>`;
  }
  const group = state.settingsGroup === "custom"
    ? { id: "custom", label: "Personnalisé", description: "Clés spécifiques à votre version ou distribution." }
    : state.settingsSchema.groups.find((item) => item.id === state.settingsGroup) || state.settingsSchema.groups[0];
  const definitions = state.settingsSchema.properties.filter((property) => property.group === group.id);
  const knownKeys = new Set(state.settingsSchema.properties.map((property) => property.key));
  const customProperties = Object.entries(state.serverProperties).filter(([key]) => !knownKeys.has(key));
  return `
    <section class="settings-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>Configuration complète</h2><p>${state.settingsSchema.properties.length} paramètres catalogués, plus les clés propres à votre distribution.</p></div></div>
      <form class="settings-workbench panel" id="properties-form">
        <nav class="settings-tabs" aria-label="Catégories de paramètres">
          ${state.settingsSchema.groups.map((item) => `<button type="button" class="${item.id === group.id ? "is-active" : ""}" data-settings-group="${item.id}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.label)}</span><small>${state.settingsSchema.properties.filter((property) => property.group === item.id).length}</small></button>`).join("")}
          <button type="button" class="${group.id === "custom" ? "is-active" : ""}" data-settings-group="custom"><i data-lucide="braces"></i><span>Personnalisé</span><small>${customProperties.length}</small></button>
        </nav>
        <div class="settings-editor">
          <header class="settings-editor-head"><div><h3>${group.id === "custom" ? "Propriétés personnalisées" : escapeHtml(group.label)}</h3><p>${group.id === "custom" ? "Clés non cataloguées conservées dans server.properties." : escapeHtml(group.description)}</p></div><span class="pill warning"><i data-lucide="rotate-cw"></i>Redémarrage requis</span></header>
          ${group.id === "custom" ? `
            <div class="custom-properties" id="custom-properties">
              ${customProperties.map(([key, value]) => `<div class="custom-property-row"><input data-custom-key value="${escapeHtml(key)}" aria-label="Clé" /><input data-custom-value value="${escapeHtml(value)}" aria-label="Valeur" /><button type="button" class="icon-button" data-remove-custom aria-label="Retirer" title="Retirer"><i data-lucide="x"></i></button></div>`).join("")}
              <div class="custom-property-row"><input data-custom-key placeholder="ma-propriete" aria-label="Nouvelle clé" /><input data-custom-value placeholder="valeur" aria-label="Nouvelle valeur" /><button type="button" class="icon-button" data-add-custom aria-label="Ajouter une ligne" title="Ajouter"><i data-lucide="plus"></i></button></div>
            </div>` : `
            <div class="property-grid">${definitions.map((definition) => propertyInput(definition, state.serverProperties[definition.key])).join("")}</div>
            ${group.id === "performance" ? `<section class="memory-settings"><div><h4>Mémoire Java</h4><p>Allocation appliquée au processus au prochain démarrage.</p></div><label class="field"><span>Initiale</span><div class="input-suffix"><input name="memoryMin" type="number" min="512" step="512" value="${server.memory.min}" /><span>Mo</span></div></label><label class="field"><span>Maximale</span><div class="input-suffix"><input name="memoryMax" type="number" min="1024" step="512" value="${server.memory.max}" /><span>Mo</span></div></label></section>` : ""}
          `}
          ${state.serverProperties["online-mode"] === "false" && group.id === "access" ? `<div class="inline-warning"><i data-lucide="shield-alert"></i><span>Le mode crack est actif. Utilisez une whitelist et protégez l’agent avec un jeton robuste.</span></div>` : ""}
        </div>
        <footer class="settings-footer"><span>Les valeurs non affichées sont conservées.</span><button class="button primary" type="submit"><i data-lucide="save"></i>Enregistrer cette catégorie</button></footer>
      </form>
    </section>
  `;
}

function modIcon(mod) {
  return mod.iconUrl
    ? `<span class="mod-icon"><img src="${escapeHtml(mod.iconUrl)}" alt="" loading="lazy" /></span>`
    : `<span class="mod-icon">${escapeHtml((mod.title || mod.name || "M").slice(0, 1))}</span>`;
}

function renderInstalledMods(server) {
  if (!server.mods?.length) {
    return `<div class="list-empty"><div><i data-lucide="package-open"></i><p>Aucun ${server.type === "paper" ? "plugin" : "mod"} installé.</p></div></div>`;
  }
<<<<<<< HEAD
  const updates = state.modUpdates || [];
  const available = updates.filter((item) => item.updateAvailable).length;
  const canUpdate = server.status === "offline" && !state.modUpdating;
  return `<div class="mod-list">${server.mods.map((mod) => `
    <div class="mod-row">
      ${modIcon(mod)}
      <div class="mod-copy"><strong>${escapeHtml(mod.name)}</strong><span>Version ${escapeHtml(mod.version)} · ${mod.enabled ? "Actif" : "Désactivé"}${updates.find((item) => item.id === mod.id)?.updateAvailable ? ` · Disponible : ${escapeHtml(updates.find((item) => item.id === mod.id).latestVersion)}` : ""}</span></div>
      <div class="mod-actions">
        ${updates.find((item) => item.id === mod.id)?.updateAvailable ? `<button class="button compact secondary mod-update-button" data-update-mod="${escapeHtml(mod.id)}" ${canUpdate ? "" : "disabled"}><i data-lucide="download"></i>MAJ</button>` : ""}
        <label class="toggle-row" style="min-height:36px;padding:4px;border:0" title="${mod.enabled ? "Désactiver" : "Activer"}"><input type="checkbox" data-mod-toggle="${escapeHtml(mod.id)}" ${mod.enabled ? "checked" : ""} ${canUpdate ? "" : "disabled"} /><span class="switch"></span></label>
        <button class="icon-button" data-remove-mod="${escapeHtml(mod.id)}" aria-label="Supprimer ${escapeHtml(mod.name)}" title="Supprimer" ${canUpdate ? "" : "disabled"}><i data-lucide="trash-2"></i></button>
=======
  return `<div class="mod-list">${server.mods.map((mod) => `
    <div class="mod-row">
      ${modIcon(mod)}
      <div class="mod-copy"><strong>${escapeHtml(mod.name)}</strong><span>Version ${escapeHtml(mod.version)} · ${mod.enabled ? "Actif" : "Désactivé"}</span></div>
      <div class="mod-actions">
        <label class="toggle-row" style="min-height:36px;padding:4px;border:0" title="${mod.enabled ? "Désactiver" : "Activer"}"><input type="checkbox" data-mod-toggle="${escapeHtml(mod.id)}" ${mod.enabled ? "checked" : ""} /><span class="switch"></span></label>
        <button class="icon-button" data-remove-mod="${escapeHtml(mod.id)}" aria-label="Supprimer ${escapeHtml(mod.name)}" title="Supprimer"><i data-lucide="trash-2"></i></button>
>>>>>>> 77abf2e (0.5.1)
      </div>
    </div>
  `).join("")}</div>`;
}

function renderModResults() {
  if (state.modSearching) return `<div class="list-empty"><div class="spinner"></div></div>`;
  if (state.modResults === null) return `<div class="list-empty"><div><i data-lucide="search"></i><p>Recherchez un projet compatible dans Modrinth.</p></div></div>`;
  if (!state.modResults.length) return `<div class="list-empty"><div><i data-lucide="circle-slash"></i><p>Aucun résultat compatible.</p></div></div>`;
<<<<<<< HEAD
  const canInstall = selectedServer()?.status === "offline";
=======
>>>>>>> 77abf2e (0.5.1)
  return `<div class="mod-list">${state.modResults.map((mod) => `
    <div class="mod-row">
      ${modIcon(mod)}
      <div class="mod-copy"><strong>${escapeHtml(mod.title)}</strong><span>${escapeHtml(mod.description)} · ${formatDownloads(mod.downloads)} téléchargements</span></div>
<<<<<<< HEAD
      <button class="button compact secondary" data-install-mod="${escapeHtml(mod.id)}" ${canInstall ? "" : "disabled"}><i data-lucide="download"></i>Installer</button>
=======
      <button class="button compact secondary" data-install-mod="${escapeHtml(mod.id)}"><i data-lucide="download"></i>Installer</button>
>>>>>>> 77abf2e (0.5.1)
    </div>
  `).join("")}</div>`;
}

function renderMods(server) {
  const unsupported = server.type === "vanilla";
<<<<<<< HEAD
  const available = (state.modUpdates || []).filter((item) => item.updateAvailable).length;
  const canUpdate = server.status === "offline" && !state.modUpdating;
=======
>>>>>>> 77abf2e (0.5.1)
  return `
    <section class="mods-page">
      ${renderServerHero(server)}
      <div class="page-heading"><div><h2>${server.type === "paper" ? "Plugins" : "Mods"}</h2><p>Catalogue filtré pour ${escapeHtml(typeLabels[server.type])} ${escapeHtml(server.version)}.</p></div></div>
      ${unsupported ? `<div class="notice"><i data-lucide="circle-alert"></i><span>Vanilla ne charge pas de mods. Créez une instance Fabric ou Paper pour utiliser le catalogue.</span></div>` : `
        <section class="panel">
          <form class="mod-toolbar" id="mod-search-form">
            <label class="search-box"><i data-lucide="search"></i><input id="mod-search" placeholder="Rechercher Sodium, Lithium, LuckPerms…" autocomplete="off" /></label>
            <button class="button secondary" type="submit"><i data-lucide="search"></i>Rechercher</button>
          </form>
          <div class="mod-layout">
            <div class="mod-column"><div class="column-heading"><strong>Catalogue Modrinth</strong><span>${state.modResults?.length || 0} résultat(s)</span></div><div id="mod-results">${renderModResults()}</div></div>
<<<<<<< HEAD
            <div class="mod-column">
              <div class="column-heading mod-installed-heading"><strong>Installés · ${server.mods?.length || 0}</strong><div class="mod-update-actions">
                ${state.modUpdateChecking ? "Vérification…" : state.modUpdateError ? "Vérification indisponible" : state.modUpdates ? `${state.modUpdates.filter((item) => item.updateAvailable).length} mise(s) à jour` : ""}
                <button class="icon-button" type="button" data-check-mod-updates aria-label="Vérifier les mises à jour" title="Vérifier les mises à jour" ${state.modUpdateChecking ? "disabled" : ""}><i data-lucide="${state.modUpdateChecking ? "loader-circle" : "refresh-cw"}"></i></button>
                ${available ? `<button class="button compact secondary" data-update-mods ${canUpdate ? "" : "disabled"}><i data-lucide="download"></i>Tout mettre à jour</button>` : ""}
              </div></div>
              ${server.status !== "offline" ? `<div class="mod-update-notice">Arrêtez le serveur avant de modifier les fichiers des mods.</div>` : ""}
              ${renderInstalledMods(server)}
            </div>
=======
            <div class="mod-column"><div class="column-heading"><strong>Installés</strong><span>${server.mods?.length || 0} élément(s)</span></div>${renderInstalledMods(server)}</div>
>>>>>>> 77abf2e (0.5.1)
          </div>
        </section>
      `}
    </section>
  `;
}

function render() {
  renderSidebar();
  const server = selectedServer();
  $("#page-title").textContent = pageTitles[state.activeView] || pageTitles.overview;
  $("#breadcrumb-server").textContent = server?.name || "Accueil";
  $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === state.activeView));

  if (state.loading) {
    $("#page-content").innerHTML = `<div class="skeleton"><div class="spinner"></div></div>`;
<<<<<<< HEAD
  } else if (state.activeView === "generalSettings") {
    $("#page-content").innerHTML = renderGeneralSettings();
=======
>>>>>>> 77abf2e (0.5.1)
  } else if (!server) {
    $("#page-content").innerHTML = renderEmpty();
  } else if (state.activeView === "players") {
    $("#page-content").innerHTML = renderPlayers(server);
<<<<<<< HEAD
  } else if (state.activeView === "access") {
    $("#page-content").innerHTML = renderFriendAccess(server);
=======
>>>>>>> 77abf2e (0.5.1)
  } else if (state.activeView === "activity") {
    $("#page-content").innerHTML = renderActivity(server);
  } else if (state.activeView === "backups") {
    $("#page-content").innerHTML = renderBackups(server);
  } else if (state.activeView === "updates") {
    $("#page-content").innerHTML = renderUpdates(server);
  } else if (state.activeView === "monitoring") {
    $("#page-content").innerHTML = renderMonitoring(server);
  } else if (state.activeView === "settings") {
    $("#page-content").innerHTML = renderSettings(server);
  } else if (state.activeView === "mods") {
    $("#page-content").innerHTML = renderMods(server);
  } else if (state.activeView === "console") {
    $("#page-content").innerHTML = `${renderServerHero(server)}${renderConsole(server, true)}`;
  } else {
    $("#page-content").innerHTML = renderOverview(server);
  }
  if (state.activeView === "players" && server) hydratePlayerAutocompletes();
  refreshIcons();
  requestAnimationFrame(() => {
    const output = $("#console-output");
    if (output) output.scrollTop = output.scrollHeight;
  });
}

async function selectServer(serverId) {
  state.selectedId = serverId;
  state.logs = [];
  state.players = [];
  state.accessLists = { ops: [], whitelist: [], banned: [] };
  state.selectedPlayer = null;
  state.events = [];
  state.backups = [];
  state.backupRunning = false;
  state.backupsLoadedAt = 0;
  state.backupSchedule = { enabled: false, intervalHours: 24, retention: 5, nextRunAt: null };
  state.updateInfo = null;
  state.metrics = null;
  state.metricsHistory = [];
  state.metricsLoadedAt = 0;
  state.serverProperties = null;
  state.modResults = null;
<<<<<<< HEAD
  state.modUpdates = null;
  state.modUpdateError = null;
=======
>>>>>>> 77abf2e (0.5.1)
  localStorage.setItem("minehub:selected", serverId);
  await Promise.all([
    loadLogs(),
    state.activeView === "players" ? loadPlayers() : Promise.resolve(),
    state.activeView === "activity" ? loadEvents() : Promise.resolve(),
    state.activeView === "backups" ? Promise.all([loadBackups(), loadBackupSchedule()]) : Promise.resolve(),
<<<<<<< HEAD
    state.activeView === "updates" ? loadUpdateCheck() : Promise.resolve(),
    state.activeView === "monitoring" ? Promise.all([loadMetrics(), loadBackupSchedule(), loadPrerequisites()]) : Promise.resolve(),
    state.activeView === "settings" ? loadProperties() : Promise.resolve(),
    state.activeView === "mods" ? loadModUpdates() : Promise.resolve(),
    state.activeView === "generalSettings" ? loadGeneralSettings() : Promise.resolve(),
=======
    state.activeView === "updates" ? Promise.all([loadUpdateCheck(), loadAppUpdateSettings()]) : Promise.resolve(),
    state.activeView === "monitoring" ? Promise.all([loadMetrics(), loadBackupSchedule(), loadPrerequisites()]) : Promise.resolve(),
    state.activeView === "settings" ? loadProperties() : Promise.resolve(),
>>>>>>> 77abf2e (0.5.1)
  ]);
  render();
  document.body.classList.remove("sidebar-open");
}

async function setView(view) {
  if (!pageTitles[view]) return;
  state.activeView = view;
  localStorage.setItem("minehub:view", view);
  if (view === "players") await loadPlayers();
  if (view === "activity") await loadEvents();
  if (view === "backups") await Promise.all([loadBackups(), loadBackupSchedule()]);
<<<<<<< HEAD
  if (view === "updates") await loadUpdateCheck();
  if (view === "monitoring") await Promise.all([loadMetrics(), loadBackupSchedule(), loadPrerequisites()]);
  if (view === "settings" && !state.serverProperties) await loadProperties();
  if (view === "mods") await loadModUpdates();
  if (view === "generalSettings") await loadGeneralSettings();
=======
  if (view === "updates") await Promise.all([loadUpdateCheck(), loadAppUpdateSettings({ force: true })]);
  if (view === "monitoring") await Promise.all([loadMetrics(), loadBackupSchedule(), loadPrerequisites()]);
  if (view === "settings" && !state.serverProperties) await loadProperties();
>>>>>>> 77abf2e (0.5.1)
  render();
  document.body.classList.remove("sidebar-open");
}

async function runServerAction(action, button) {
  const server = selectedServer();
  if (!server) return;
  setButtonLoading(button, true, action === "start" ? "Démarrage…" : action === "stop" ? "Arrêt…" : "Redémarrage…");
  try {
    await api(`/api/servers/${server.id}/action`, { method: "POST", body: JSON.stringify({ action }) });
    toast(action === "start" ? "Démarrage demandé" : action === "stop" ? "Arrêt demandé" : "Redémarrage demandé", server.name);
    await loadServers({ silent: true });
    await loadLogs();
    render();
  } catch (error) {
    toast("Action impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

<<<<<<< HEAD
async function savePublicAddress(form) {
  const server = selectedServer();
  if (!server) return;
  const button = $("button[type=submit]", form);
  setButtonLoading(button, true, "Enregistrement…");
  try {
    const result = await api(`/api/servers/${server.id}/access`, {
      method: "PATCH",
      body: JSON.stringify({ publicAddress: new FormData(form).get("publicAddress") }),
    });
    Object.assign(server, result.server);
    toast("Adresse enregistrée", "Elle est conservée pour ce serveur.");
    render();
  } catch (error) {
    toast("Adresse invalide", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function copyPublicAddress(address) {
  try {
    await navigator.clipboard.writeText(address);
  } catch {
    const field = document.createElement("textarea");
    field.value = address;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
  toast("Adresse copiée", "Tu peux l’envoyer à tes amis.");
}

async function saveGeneralSettings(form) {
  const button = $("button[type=submit]", form);
  setButtonLoading(button, true, "Copie en cours…");
  try {
    state.generalSettings = await api("/api/general-settings", {
      method: "PATCH",
      body: JSON.stringify({ instanceDirectory: new FormData(form).get("instanceDirectory") }),
    });
    toast("Emplacement mis à jour", "Les instances existantes ont été copiées vers le nouveau dossier.");
    render();
  } catch (error) {
    toast("Changement impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

=======
>>>>>>> 77abf2e (0.5.1)
async function saveProperties(form) {
  const server = selectedServer();
  if (!server) return;
  const button = $("button[type=submit]", form);
  setButtonLoading(button, true, "Enregistrement…");
  const properties = {};
  $$('[data-property-key]', form).forEach((input) => {
    properties[input.dataset.propertyKey] = input.type === "checkbox" ? String(input.checked) : input.value;
  });
  const customRows = $$(".custom-property-row", form);
  for (const row of customRows) {
    const key = $("[data-custom-key]", row)?.value.trim();
    const value = $("[data-custom-value]", row)?.value ?? "";
    if (key) properties[key] = value;
  }
  const knownKeys = new Set(state.settingsSchema?.properties.map((property) => property.key) || []);
  const originalCustomKeys = Object.keys(state.serverProperties || {}).filter((key) => !knownKeys.has(key));
  const submittedCustomKeys = new Set(customRows.map((row) => $("[data-custom-key]", row)?.value.trim()).filter(Boolean));
  const removedKeys = state.settingsGroup === "custom" ? originalCustomKeys.filter((key) => !submittedCustomKeys.has(key)) : [];
  const memoryMin = $("[name=memoryMin]", form);
  const memoryMax = $("[name=memoryMax]", form);
  const payload = {
    properties,
    removedKeys,
    memory: {
      min: memoryMin ? Number(memoryMin.value) : server.memory.min,
      max: memoryMax ? Number(memoryMax.value) : server.memory.max,
    },
  };
  try {
    const result = await api(`/api/servers/${server.id}/properties`, { method: "PATCH", body: JSON.stringify(payload) });
    state.servers = state.servers.map((item) => item.id === server.id ? result.server : item);
    state.serverProperties = result.properties;
    toast("Configuration enregistrée", "Les paramètres seront appliqués au prochain démarrage.");
    render();
  } catch (error) {
    toast("Enregistrement impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function sendCommand(form) {
  const server = selectedServer();
  const input = $("#console-command", form);
  const command = input?.value.trim();
  if (!server || !command) return;
  input.value = "";
  try {
    await api(`/api/servers/${server.id}/command`, { method: "POST", body: JSON.stringify({ command }) });
    await loadLogs();
    render();
  } catch (error) {
    toast("Commande refusée", error.message, "error");
  }
}

async function runPlayerAction(player, action, extra = {}, button = null) {
  const server = selectedServer();
  if (!server) return;
  setButtonLoading(button, true, "Action…");
  try {
    await api(`/api/servers/${server.id}/players/${encodeURIComponent(player)}/action`, {
      method: "POST",
      body: JSON.stringify({ action, ...extra }),
    });
    toast("Action envoyée", `${player} · ${action}`);
    setTimeout(async () => {
      await Promise.all([loadPlayers(), loadEvents()]);
      if (state.activeView === "players") render();
    }, 500);
  } catch (error) {
    toast("Action impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function changePlayerAccess(list, action, name, reason = "", button = null) {
  const server = selectedServer();
  if (!server) return;
  setButtonLoading(button, true, action === "add" ? "Ajout…" : "Retrait…");
  try {
    const result = await api(`/api/servers/${server.id}/players/access`, {
      method: "POST",
      body: JSON.stringify({ list, action, name, reason }),
    });
    const listNames = { ops: "Opérateurs", whitelist: "Whitelist", banned: "Bannissements" };
    toast(result.queued ? "Commande envoyée" : "Liste mise à jour", `${result.name} · ${listNames[list]}`);
    if (result.queued) await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
    await loadPlayers();
    render();
  } catch (error) {
    toast("Modification impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

function submitAccessForm(form) {
  const data = new FormData(form);
  return changePlayerAccess(form.dataset.list, "add", String(data.get("name") || "").trim(), String(data.get("reason") || ""), $("button[type=submit]", form));
}

async function submitPlayerForm(form) {
  const data = new FormData(form);
  const player = form.dataset.player;
  const button = $("button[type=submit]", form);
  if (form.id === "player-teleport-form") {
    return runPlayerAction(player, "teleport", {
      target: data.get("target"), x: data.get("x"), y: data.get("y"), z: data.get("z"), dimension: data.get("dimension"),
    }, button);
  }
  if (form.id === "player-give-form") return runPlayerAction(player, "give", { item: data.get("item"), count: data.get("count") }, button);
  if (form.id === "player-xp-form") return runPlayerAction(player, "xp", { levels: data.get("levels") }, button);
  if (form.id === "player-effect-form") return runPlayerAction(player, "effect", { effect: data.get("effect"), duration: data.get("duration"), amplifier: data.get("amplifier") }, button);
  if (form.id === "player-message-form") return runPlayerAction(player, "message", { message: data.get("message") }, button);
}

async function runWorldAction(action, value, button) {
  const server = selectedServer();
  if (!server) return;
  setButtonLoading(button, true, "Action…");
  try {
    await api(`/api/servers/${server.id}/world/action`, { method: "POST", body: JSON.stringify({ action, value }) });
    toast("Monde mis à jour", `${action} · ${value || "exécuté"}`);
    setButtonLoading(button, false);
  } catch (error) {
    toast("Action impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function createBackup(button) {
  const server = selectedServer();
  if (!server || state.backupRunning) return;
  state.backupRunning = true;
  setButtonLoading(button, true, "Sauvegarde…");
  try {
    const result = await api(`/api/servers/${server.id}/backups`, { method: "POST", body: "{}" });
    toast("Sauvegarde créée", `${formatBytes(result.backup.sizeBytes)} · ${formatShortDate(result.backup.createdAt)}`);
    await loadBackups();
    if (state.activeView === "backups") render();
  } catch (error) {
    toast("Sauvegarde impossible", error.message, "error");
  } finally {
    state.backupRunning = false;
    if (state.activeView === "backups") render();
  }
}

async function restoreBackup(backupId, button) {
  const server = selectedServer();
  const backup = state.backups.find((item) => item.id === backupId);
  if (!server || !backup) return;
  if (!window.confirm(`Restaurer la sauvegarde du ${formatShortDate(backup.createdAt)} ? Les fichiers actuels seront remplacés. MineHub créera d’abord une copie de récupération.`)) return;
  setButtonLoading(button, true, "Restauration…");
  try {
    const result = await api(`/api/servers/${server.id}/backups/${encodeURIComponent(backupId)}/restore`, { method: "POST", body: "{}" });
    toast("Restauration terminée", `Copie de récupération : ${result.recovery.id}`);
    await Promise.all([loadBackups(), loadServers({ silent: true })]);
    render();
  } catch (error) {
    toast("Restauration impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function removeBackup(backupId, button) {
  const server = selectedServer();
  const backup = state.backups.find((item) => item.id === backupId);
  if (!server || !backup || !window.confirm(`Supprimer la sauvegarde du ${formatShortDate(backup.createdAt)} ?`)) return;
  setButtonLoading(button, true, "Suppression…");
  try {
    await api(`/api/servers/${server.id}/backups/${encodeURIComponent(backupId)}`, { method: "DELETE" });
    toast("Sauvegarde supprimée");
    await loadBackups();
    render();
  } catch (error) {
    toast("Suppression impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function saveBackupSchedule(form) {
  const server = selectedServer();
  if (!server) return;
  const button = $("button[type=submit]", form);
  const data = new FormData(form);
  setButtonLoading(button, true, "Enregistrement…");
  try {
    const result = await api(`/api/servers/${server.id}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ backup: { enabled: data.has("enabled"), intervalHours: Number(data.get("intervalHours")), retention: Number(data.get("retention")) } }),
    });
    state.backupSchedule = result.backup;
    toast("Planification enregistrée", result.backup.nextRunAt ? `Prochaine sauvegarde : ${formatShortDate(result.backup.nextRunAt)}` : "Les sauvegardes automatiques sont désactivées.");
    render();
  } catch (error) {
    toast("Planification impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function searchMods(form) {
  const server = selectedServer();
  const query = $("#mod-search", form)?.value.trim() || "";
  if (!server) return;
  state.modSearching = true;
  render();
  try {
    const loader = server.type === "paper" ? "paper" : "fabric";
    const result = await api(`/api/mods/search?q=${encodeURIComponent(query)}&loader=${loader}&version=${encodeURIComponent(server.version)}`);
    state.modResults = result.mods || [];
  } catch (error) {
    state.modResults = [];
    toast("Recherche impossible", error.message, "error");
  } finally {
    state.modSearching = false;
    render();
    const input = $("#mod-search");
    if (input) input.value = query;
  }
}

<<<<<<< HEAD
async function loadModUpdates() {
  const server = selectedServer();
  if (!server || server.type === "vanilla") return;
  try {
    const result = await api(`/api/servers/${server.id}/mods/updates`);
    state.modUpdates = result.updates || [];
    state.modUpdateError = null;
  } catch (error) {
    state.modUpdates = [];
    state.modUpdateError = error.message;
  }
}

async function checkInstalledModUpdates() {
  if (state.modUpdateChecking) return;
  state.modUpdateChecking = true;
  render();
  await loadModUpdates();
  state.modUpdateChecking = false;
  const errors = (state.modUpdates || []).filter((item) => item.error).length;
  const available = (state.modUpdates || []).filter((item) => item.updateAvailable).length;
  if (state.modUpdateError) toast("Vérification impossible", state.modUpdateError, "error");
  else toast("Vérification terminée", errors ? `${errors} projet(s) non vérifié(s)` : `${available} mise(s) à jour disponible(s)`);
  state.modUpdateError = null;
  render();
}

async function updateInstalledMods(modId = null) {
  const server = selectedServer();
  if (!server || server.status !== "offline" || state.modUpdating) return;
  state.modUpdating = modId || "all";
  render();
  try {
    const result = await api(`/api/servers/${server.id}/mods/update`, {
      method: "POST",
      body: JSON.stringify(modId ? { modId } : {}),
    });
    await loadServers({ silent: true });
    await loadModUpdates();
    if (result.failed?.length) {
      const backupNote = result.backup ? `Sauvegarde : ${result.backup.id}. ` : "";
      toast("Mises à jour partielles", `${backupNote}${result.updated.length} réussi(s), ${result.failed.length} en échec`, "error");
    } else if (!result.updated?.length) {
      toast("Mods à jour", "Aucune nouvelle version compatible n’a été trouvée.");
    } else {
      const backupNote = result.backup ? `Sauvegarde : ${result.backup.id}. ` : "";
      toast("Mise à jour terminée", `${backupNote}${result.updated.length} projet(s) actualisé(s). Redémarrez le serveur avant de jouer.`);
    }
  } catch (error) {
    toast("Mise à jour impossible", error.message, "error");
  } finally {
    state.modUpdating = null;
    render();
  }
}

=======
>>>>>>> 77abf2e (0.5.1)
async function installMod(projectId, button) {
  const server = selectedServer();
  if (!server) return;
  setButtonLoading(button, true, "Installation…");
  try {
    await api(`/api/servers/${server.id}/mods`, { method: "POST", body: JSON.stringify({ projectId }) });
    await loadServers({ silent: true });
    toast("Projet installé", "Un redémarrage du serveur peut être nécessaire.");
    render();
  } catch (error) {
    toast("Installation impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

async function toggleMod(modId, enabled, input) {
  const server = selectedServer();
  if (!server) return;
  input.disabled = true;
  try {
    await api(`/api/servers/${server.id}/mods/${encodeURIComponent(modId)}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
    await loadServers({ silent: true });
    toast(enabled ? "Projet activé" : "Projet désactivé", "Redémarrez le serveur pour appliquer ce changement.");
    render();
  } catch (error) {
    input.checked = !enabled;
    input.disabled = false;
    toast("Modification impossible", error.message, "error");
  }
}

async function removeMod(modId, button) {
  const server = selectedServer();
  if (!server) return;
  setButtonLoading(button, true, "");
  try {
    await api(`/api/servers/${server.id}/mods/${encodeURIComponent(modId)}`, { method: "DELETE" });
    await loadServers({ silent: true });
    toast("Projet supprimé", "Le fichier a été retiré de l’instance.");
    render();
  } catch (error) {
    toast("Suppression impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

function openConnectionDialog() {
  const dialog = $("#connection-dialog");
  const mode = state.connection.mode || "local";
  $$("#connection-mode button").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === mode));
  $("#connection-local").hidden = mode !== "local";
  $("#connection-remote").hidden = mode !== "remote";
  $("#remote-url").value = state.connection.base || "";
  $("#remote-token").value = state.connection.token || "";
  $("#local-agent-detail").textContent = state.health ? `${state.health.name} · ${state.health.node}` : "Agent indisponible";
  $("#connection-feedback").hidden = true;
  dialog.showModal();
  refreshIcons();
}

async function connectAgent(form, submitter) {
  const mode = $("#connection-mode button.is-active")?.dataset.mode || "local";
  const feedback = $("#connection-feedback");
  let connection;
  if (mode === "local") {
    connection = { mode: "local", base: "", token: "", name: "Cet appareil" };
  } else {
    const rawUrl = $("#remote-url").value.trim().replace(/\/$/, "");
    if (!rawUrl) {
      feedback.className = "connection-feedback error";
      feedback.textContent = "Indiquez l’adresse de l’agent distant.";
      feedback.hidden = false;
      return;
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      feedback.className = "connection-feedback error";
      feedback.textContent = "L'adresse de l'agent n'est pas une URL valide.";
      feedback.hidden = false;
      return;
    }
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname.toLowerCase());
    if (parsedUrl.protocol !== "https:" && !isLocal) {
      feedback.className = "connection-feedback error";
      feedback.textContent = "Une connexion distante doit utiliser HTTPS. Placez l'agent derrière un proxy HTTPS.";
      feedback.hidden = false;
      return;
    }
    const token = $("#remote-token").value.trim();
    if (!token) {
      feedback.className = "connection-feedback error";
      feedback.textContent = "Le jeton MCM_TOKEN est obligatoire pour une connexion distante.";
      feedback.hidden = false;
      return;
    }
    connection = { mode: "remote", base: rawUrl, token, name: parsedUrl.host };
  }
  setButtonLoading(submitter, true, "Connexion…");
  try {
    const health = await api("/api/health", {}, connection);
    saveConnection(connection);
    state.health = health;
    state.loading = true;
    state.selectedId = null;
    state.logs = [];
    feedback.className = "connection-feedback success";
    feedback.textContent = `${health.name} répond correctement.`;
    feedback.hidden = false;
    await loadServers();
    updateConnectionUI();
    render();
    setTimeout(() => $("#connection-dialog").close(), 350);
    toast("Agent connecté", connection.name);
  } catch (error) {
    feedback.className = "connection-feedback error";
    feedback.textContent = error.message;
    feedback.hidden = false;
    setButtonLoading(submitter, false);
  }
}

function resetCreateForm() {
  $("#create-form").reset();
  $("#create-online-mode").checked = true;
  $("#create-pvp").checked = true;
  $("#create-max-players").value = 20;
  $("#create-memory-min").value = 1024;
  $("#create-memory-max").value = 4096;
  state.createStep = 1;
  state.createType = "paper";
  state.selectedVersion = "";
  state.versions = [];
  $$(".distribution-card").forEach((card) => card.classList.toggle("is-selected", card.dataset.type === "paper"));
  updateWizard();
}

async function openCreateDialog() {
  resetCreateForm();
  $("#create-dialog").showModal();
  refreshIcons();
  await loadVersions("paper");
}

async function loadVersions(type) {
  state.versionType = type;
  state.versions = [];
  state.selectedVersion = "";
  $("#create-version").value = "";
  $("#version-search").value = "";
  $("#version-options").hidden = false;
  $("#version-options").innerHTML = `<div class="versions-loading">Synchronisation du catalogue…</div>`;
  try {
    const data = await api(`/api/versions?type=${encodeURIComponent(type)}`);
    state.versions = data.versions || [];
    const first = state.versions.find((version) => !version.includes("-")) || state.versions[0] || "";
    selectVersion(first);
    renderVersionOptions("");
  } catch (error) {
    $("#version-options").innerHTML = `<div class="versions-loading">${escapeHtml(error.message)}</div>`;
  }
}

function renderVersionOptions(search = "") {
  const needle = search.trim().toLowerCase();
  const filtered = state.versions.filter((version) => version.toLowerCase().includes(needle));
  $("#version-options").innerHTML = filtered.length
    ? filtered.map((version, index) => `<button type="button" class="version-option ${version === state.selectedVersion ? "is-selected" : ""}" data-version="${escapeHtml(version)}"><span>${escapeHtml(version)}</span>${index === 0 && !needle ? "<small>Dernière</small>" : ""}</button>`).join("")
    : `<div class="versions-loading">Aucune version trouvée.</div>`;
  refreshIcons();
}

function selectVersion(version) {
  if (!version) return;
  state.selectedVersion = version;
  $("#create-version").value = version;
  $("#version-search").value = version;
  $("#version-options").hidden = true;
}

function validateCreateStep(step) {
  if (step === 1) {
    if (!$("#create-name").value.trim()) {
      $("#create-name").focus();
      toast("Nom requis", "Donnez un nom à cette instance.", "error");
      return false;
    }
    if (!state.selectedVersion) {
      $("#version-search").focus();
      toast("Version requise", "Sélectionnez une version dans le catalogue.", "error");
      return false;
    }
  }
  if (step === 2 && Number($("#create-memory-min").value) > Number($("#create-memory-max").value)) {
    $("#create-memory-max").focus();
    toast("Allocation invalide", "La mémoire maximale doit dépasser la mémoire initiale.", "error");
    return false;
  }
  return true;
}

function updateReview() {
  const name = $("#create-name").value.trim() || "Sans nom";
  const online = $("#create-online-mode").checked;
  $("#create-review").innerHTML = `
    <div class="review-head"><span class="server-avatar">${escapeHtml(name.slice(0, 1))}</span><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(typeLabels[state.createType])} ${escapeHtml(state.selectedVersion)}</p></div></div>
    <div class="review-grid">
      <div class="review-item"><span>Mode</span><strong>${escapeHtml(gamemodeLabels[$("#create-gamemode").value])}</strong></div>
      <div class="review-item"><span>Joueurs max.</span><strong>${escapeHtml($("#create-max-players").value)}</strong></div>
      <div class="review-item"><span>Mémoire</span><strong>${formatMemory(Number($("#create-memory-max").value))}</strong></div>
      <div class="review-item"><span>Authentification</span><strong>${online ? "Officielle" : "Mode crack"}</strong></div>
      <div class="review-item"><span>Liste blanche</span><strong>${$("#create-whitelist").checked ? "Activée" : "Désactivée"}</strong></div>
      <div class="review-item"><span>PvP</span><strong>${$("#create-pvp").checked ? "Activé" : "Désactivé"}</strong></div>
    </div>
  `;
  refreshIcons();
}

function updateWizard() {
  $$(".wizard-panel").forEach((panel) => panel.classList.toggle("is-active", Number(panel.dataset.step) === state.createStep));
  $$(".wizard-step").forEach((step) => {
    const number = Number(step.dataset.goStep);
    step.classList.toggle("is-active", number === state.createStep);
    step.classList.toggle("is-complete", number < state.createStep);
  });
  $("#wizard-back").hidden = state.createStep === 1;
  $("#wizard-next").hidden = state.createStep === 3;
  $("#wizard-create").hidden = state.createStep !== 3;
  if (state.createStep === 3) updateReview();
}

function goWizardStep(next) {
  if (next > state.createStep && !validateCreateStep(state.createStep)) return;
  state.createStep = Math.min(3, Math.max(1, next));
  updateWizard();
}

async function createServer(form, button) {
  if (!$("#create-eula").checked) {
    toast("EULA non acceptée", "L’acceptation est nécessaire pour installer le serveur.", "error");
    return;
  }
  const payload = {
    name: $("#create-name").value.trim(),
    type: state.createType,
    version: state.selectedVersion,
    memoryMin: Number($("#create-memory-min").value),
    memoryMax: Number($("#create-memory-max").value),
    eula: true,
    settings: {
      motd: `Bienvenue sur ${$("#create-name").value.trim()}`,
      port: 25565,
      maxPlayers: Number($("#create-max-players").value),
      gamemode: $("#create-gamemode").value,
      difficulty: $("#create-difficulty").value,
      onlineMode: $("#create-online-mode").checked,
      whitelist: $("#create-whitelist").checked,
      pvp: $("#create-pvp").checked,
      viewDistance: 10,
      simulationDistance: 8,
    },
  };
  setButtonLoading(button, true, "Installation…");
  try {
    const result = await api("/api/servers", { method: "POST", body: JSON.stringify(payload) });
    state.servers.push(result.server);
    state.selectedId = result.server.id;
    state.activeView = "overview";
    localStorage.setItem("minehub:selected", result.server.id);
    $("#create-dialog").close();
    toast("Instance créée", "La distribution est en cours de téléchargement.");
    render();
  } catch (error) {
    toast("Création impossible", error.message, "error");
    setButtonLoading(button, false);
  }
}

function bindEvents() {
<<<<<<< HEAD
  $("#theme-toggle").addEventListener("click", toggleTheme);
=======
>>>>>>> 77abf2e (0.5.1)
  document.addEventListener("click", (event) => {
    const createButton = event.target.closest("[data-open-create]");
    if (createButton) openCreateDialog();
  });

  $("#server-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-server]");
    if (button) selectServer(button.dataset.selectServer);
  });

  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  $("#mobile-menu").addEventListener("click", () => document.body.classList.add("sidebar-open"));
  $("#sidebar-close").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  $("#sidebar-scrim").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  $("#open-connection").addEventListener("click", openConnectionDialog);

  $("#page-content").addEventListener("focusin", (event) => {
    if (event.target.matches("[data-player-autocomplete]")) updatePlayerAutocomplete(event.target);
  });

  $("#page-content").addEventListener("input", (event) => {
    if (event.target.matches("[data-player-autocomplete]")) updatePlayerAutocomplete(event.target);
<<<<<<< HEAD
    if (event.target.id === "console-search") {
      state.logSearch = event.target.value;
      clearTimeout(state.logSearchTimer);
      state.logSearchTimer = setTimeout(loadLogs, 250);
    }
=======
>>>>>>> 77abf2e (0.5.1)
  });

  $("#page-content").addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-player-autocomplete]");
    if (!input) return;
    const wrapper = input.closest(".player-autocomplete");
    const menu = $(".autocomplete-menu", wrapper);
    const options = $$(".autocomplete-option", menu);
    let activeIndex = Number(wrapper.dataset.activeIndex || -1);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (menu.hidden) updatePlayerAutocomplete(input);
      if (!options.length) return;
      activeIndex = event.key === "ArrowDown"
        ? (activeIndex + 1) % options.length
        : (activeIndex <= 0 ? options.length - 1 : activeIndex - 1);
      wrapper.dataset.activeIndex = String(activeIndex);
      options.forEach((option, index) => {
        option.classList.toggle("is-active", index === activeIndex);
        option.setAttribute("aria-selected", String(index === activeIndex));
      });
      input.setAttribute("aria-activedescendant", options[activeIndex].id);
    } else if (event.key === "Enter" && !menu.hidden && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      selectPlayerAutocomplete(input, options[activeIndex]);
    } else if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      closePlayerAutocomplete(input);
    }
  });

  $("#page-content").addEventListener("mousedown", (event) => {
    if (event.target.closest(".autocomplete-option")) event.preventDefault();
  });

  $("#page-content").addEventListener("click", (event) => {
    const autocompleteOption = event.target.closest(".autocomplete-option");
    if (autocompleteOption) {
      const input = autocompleteOption.closest(".player-autocomplete").querySelector("[data-player-autocomplete]");
      selectPlayerAutocomplete(input, autocompleteOption);
      return;
    }
<<<<<<< HEAD
    const copyAddress = event.target.closest("[data-copy-public-address]");
    if (copyAddress) copyPublicAddress(copyAddress.dataset.copyPublicAddress);
=======
>>>>>>> 77abf2e (0.5.1)
    $$("[data-player-autocomplete]").forEach((input) => {
      if (!input.closest(".player-autocomplete").contains(event.target)) closePlayerAutocomplete(input);
    });
    const action = event.target.closest("[data-action]");
    if (action) runServerAction(action.dataset.action, action);
    const view = event.target.closest("[data-view-link]");
    if (view) setView(view.dataset.viewLink);
    const install = event.target.closest("[data-install-mod]");
    if (install) installMod(install.dataset.installMod, install);
<<<<<<< HEAD
    const checkModUpdatesButton = event.target.closest("[data-check-mod-updates]");
    if (checkModUpdatesButton) checkInstalledModUpdates();
    const updateAllMods = event.target.closest("[data-update-mods]");
    if (updateAllMods) updateInstalledMods();
    const updateMod = event.target.closest("[data-update-mod]");
    if (updateMod) updateInstalledMods(updateMod.dataset.updateMod);
=======
>>>>>>> 77abf2e (0.5.1)
    const remove = event.target.closest("[data-remove-mod]");
    if (remove) removeMod(remove.dataset.removeMod, remove);
    const playerRow = event.target.closest("[data-select-player]");
    if (playerRow) {
      state.selectedPlayer = playerRow.dataset.selectPlayer;
      render();
    }
    const playerAction = event.target.closest("[data-player-action]");
    if (playerAction) {
      if (playerAction.dataset.confirm && !window.confirm(playerAction.dataset.confirm)) return;
      const extra = playerAction.dataset.playerAction === "gamemode" ? { gamemode: playerAction.dataset.value } : {};
      runPlayerAction(playerAction.dataset.player, playerAction.dataset.playerAction, extra, playerAction);
    }
    const refreshPlayers = event.target.closest("[data-refresh-players]");
    if (refreshPlayers) loadPlayers().then(render);
    const removeAccess = event.target.closest("[data-access-remove]");
    if (removeAccess) {
      const listName = { ops: "les opérateurs", whitelist: "la liste blanche", banned: "les bannissements" }[removeAccess.dataset.list];
      if (window.confirm(`Retirer ${removeAccess.dataset.name} de ${listName} ?`)) {
        changePlayerAccess(removeAccess.dataset.list, "remove", removeAccess.dataset.name, "", removeAccess);
      }
    }
    const refreshEvents = event.target.closest("[data-refresh-events]");
    if (refreshEvents) loadEvents().then(render);
    const createBackupButton = event.target.closest("[data-create-backup]");
    if (createBackupButton) createBackup(createBackupButton);
    const refreshBackups = event.target.closest("[data-refresh-backups]");
    if (refreshBackups) loadBackups().then(render);
    const restoreButton = event.target.closest("[data-restore-backup]");
    if (restoreButton) restoreBackup(restoreButton.dataset.restoreBackup, restoreButton);
    const deleteBackupButton = event.target.closest("[data-delete-backup]");
    if (deleteBackupButton) removeBackup(deleteBackupButton.dataset.deleteBackup, deleteBackupButton);
    const refreshMonitoring = event.target.closest("[data-refresh-monitoring]");
<<<<<<< HEAD
    if (refreshMonitoring) Promise.all([loadMetrics({ notify: true }), loadPrerequisites({ notify: true })]).then(render);
    const refreshUpdates = event.target.closest("[data-refresh-update]");
    if (refreshUpdates) loadUpdateCheck().then(render);
=======
    if (refreshMonitoring) loadMetrics({ notify: true }).then(render);
    const refreshPrerequisites = event.target.closest("[data-refresh-prerequisites]");
    if (refreshPrerequisites) loadPrerequisites({ notify: true }).then(render);
    const refreshUpdates = event.target.closest("[data-refresh-update]");
    if (refreshUpdates) loadUpdateCheck().then(render);
    const checkAppUpdateButton = event.target.closest("[data-check-app-update]");
    if (checkAppUpdateButton) checkAppUpdate();
    const installAppUpdateButton = event.target.closest("[data-install-app-update]");
    if (installAppUpdateButton) installAppUpdate();
>>>>>>> 77abf2e (0.5.1)
    const applyUpdate = event.target.closest("[data-apply-update]");
    if (applyUpdate) applyServerUpdate(applyUpdate);
    const rollbackUpdate = event.target.closest("[data-rollback-update]");
    if (rollbackUpdate) rollbackServerUpdate();
    const eventFilter = event.target.closest("[data-event-filter]");
    if (eventFilter) {
      state.eventFilter = eventFilter.dataset.eventFilter;
      loadEvents().then(render);
    }
    const settingsGroup = event.target.closest("[data-settings-group]");
    if (settingsGroup) {
      state.settingsGroup = settingsGroup.dataset.settingsGroup;
      render();
    }
    const removeCustom = event.target.closest("[data-remove-custom]");
    if (removeCustom) removeCustom.closest(".custom-property-row")?.remove();
    const addCustom = event.target.closest("[data-add-custom]");
    if (addCustom) {
      addCustom.removeAttribute("data-add-custom");
      addCustom.setAttribute("data-remove-custom", "");
      addCustom.setAttribute("aria-label", "Retirer");
      addCustom.setAttribute("title", "Retirer");
      addCustom.innerHTML = `<i data-lucide="x"></i>`;
      $("#custom-properties")?.insertAdjacentHTML("beforeend", `<div class="custom-property-row"><input data-custom-key placeholder="ma-propriete" aria-label="Nouvelle clé" /><input data-custom-value placeholder="valeur" aria-label="Nouvelle valeur" /><button type="button" class="icon-button" data-add-custom aria-label="Ajouter une ligne" title="Ajouter"><i data-lucide="plus"></i></button></div>`);
      refreshIcons();
    }
    const worldAction = event.target.closest("[data-world-action]");
    if (worldAction) runWorldAction(worldAction.dataset.worldAction, worldAction.dataset.value, worldAction);
<<<<<<< HEAD
    const exportButton = event.target.closest("[data-export-logs]");
    if (exportButton) exportLogs(exportButton);
=======
>>>>>>> 77abf2e (0.5.1)
  });

  $("#page-content").addEventListener("change", (event) => {
    if (event.target.matches("[data-mod-toggle]")) toggleMod(event.target.dataset.modToggle, event.target.checked, event.target);
<<<<<<< HEAD
    if (event.target.id === "console-level") {
      state.logLevel = event.target.value;
      loadLogs();
    }
=======
>>>>>>> 77abf2e (0.5.1)
    if (event.target.id === "event-player-filter") {
      state.eventPlayerFilter = event.target.value.trim();
      loadEvents().then(render);
    }
  });

  $("#page-content").addEventListener("submit", (event) => {
    event.preventDefault();
<<<<<<< HEAD
    if (event.target.id === "instance-location-form") saveGeneralSettings(event.target);
    if (event.target.id === "public-address-form") savePublicAddress(event.target);
=======
    if (event.target.id === "app-update-source-form") saveAppUpdateSettings(event.target);
>>>>>>> 77abf2e (0.5.1)
    if (event.target.id === "properties-form") saveProperties(event.target);
    if (event.target.id === "backup-schedule-form") saveBackupSchedule(event.target);
    if (event.target.id === "console-form") sendCommand(event.target);
    if (event.target.id === "mod-search-form") searchMods(event.target);
    if (event.target.matches("[data-access-form]")) submitAccessForm(event.target);
    if (event.target.matches("[id^=player-]")) submitPlayerForm(event.target);
  });

  $$("#connection-mode button").forEach((button) => button.addEventListener("click", () => {
    $$("#connection-mode button").forEach((item) => item.classList.toggle("is-active", item === button));
    $("#connection-local").hidden = button.dataset.mode !== "local";
    $("#connection-remote").hidden = button.dataset.mode !== "remote";
    $("#connection-feedback").hidden = true;
  }));

  $("#connection-form").addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    connectAgent(event.target, event.submitter);
  });

  $("#distribution-grid").addEventListener("click", (event) => {
    const card = event.target.closest("[data-type]");
    if (!card) return;
    state.createType = card.dataset.type;
    $$(".distribution-card").forEach((item) => item.classList.toggle("is-selected", item === card));
    loadVersions(state.createType);
  });

  $("#version-search").addEventListener("focus", () => {
    $("#version-options").hidden = false;
    renderVersionOptions($("#version-search").value === state.selectedVersion ? "" : $("#version-search").value);
  });
  $("#version-search").addEventListener("input", (event) => {
    state.selectedVersion = "";
    $("#create-version").value = "";
    $("#version-options").hidden = false;
    renderVersionOptions(event.target.value);
  });
  $("#version-options").addEventListener("click", (event) => {
    const option = event.target.closest("[data-version]");
    if (option) selectVersion(option.dataset.version);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#version-combobox")) $("#version-options").hidden = true;
  });

  $("#create-online-mode").addEventListener("change", (event) => {
    $("#crack-warning").hidden = event.target.checked;
  });
  $("#wizard-next").addEventListener("click", () => goWizardStep(state.createStep + 1));
  $("#wizard-back").addEventListener("click", () => goWizardStep(state.createStep - 1));
  $$("[data-go-step]").forEach((button) => button.addEventListener("click", () => {
    const requested = Number(button.dataset.goStep);
    if (requested <= state.createStep) goWizardStep(requested);
  }));
  $("#create-form").addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    createServer(event.target, event.submitter);
  });
}

async function poll() {
  const previous = new Map(state.servers.map((server) => [server.id, `${server.status}:${server.installation?.status}:${server.installation?.progress}:${server.mods?.length}`]));
  await loadServers({ silent: true });
  const changed = state.servers.some((server) => previous.get(server.id) !== `${server.status}:${server.installation?.status}:${server.installation?.progress}:${server.mods?.length}`);
  if (["overview", "console"].includes(state.activeView)) await loadLogs();
  if (state.activeView === "players") await loadPlayers();
  if (state.activeView === "activity") await loadEvents();
  if (state.activeView === "backups" && Date.now() - state.backupsLoadedAt >= 15_000) await loadBackups();
  if (state.activeView === "monitoring" && Date.now() - state.metricsLoadedAt >= 15_000) await loadMetrics();
  const editing = Boolean(document.activeElement?.matches("input, select, textarea"));
  if ((changed || ["overview", "console", "players", "activity", "backups", "monitoring"].includes(state.activeView)) && !editing) render();
  else renderSidebar();
}

async function init() {
<<<<<<< HEAD
  applyTheme(document.documentElement.dataset.theme);
=======
>>>>>>> 77abf2e (0.5.1)
  bindEvents();
  render();
  await Promise.all([loadHealth(), loadServers()]);
  await Promise.all([
    loadLogs(),
    state.activeView === "players" ? loadPlayers() : Promise.resolve(),
    state.activeView === "activity" ? loadEvents() : Promise.resolve(),
    state.activeView === "backups" ? Promise.all([loadBackups(), loadBackupSchedule()]) : Promise.resolve(),
<<<<<<< HEAD
    state.activeView === "updates" ? loadUpdateCheck() : Promise.resolve(),
    state.activeView === "monitoring" ? Promise.all([loadMetrics(), loadBackupSchedule(), loadPrerequisites()]) : Promise.resolve(),
    state.activeView === "settings" ? loadProperties() : Promise.resolve(),
    state.activeView === "generalSettings" ? loadGeneralSettings() : Promise.resolve(),
  ]);
  render();
=======
    state.activeView === "updates" ? Promise.all([loadUpdateCheck(), loadAppUpdateSettings()]) : Promise.resolve(),
    state.activeView === "monitoring" ? Promise.all([loadMetrics(), loadBackupSchedule(), loadPrerequisites()]) : Promise.resolve(),
    state.activeView === "settings" ? loadProperties() : Promise.resolve(),
  ]);
  render();
  if (!state.appUpdateSettingsLoaded) void loadAppUpdateSettings({ notify: true });
>>>>>>> 77abf2e (0.5.1)
  setInterval(poll, 5_000);
}

init();
