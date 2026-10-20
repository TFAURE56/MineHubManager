export const PROPERTY_GROUPS = [
  { id: "general", label: "Général", icon: "sliders-horizontal", description: "Identité, partie et règles principales." },
  { id: "world", label: "Monde", icon: "globe-2", description: "Génération, dimensions et créatures." },
  { id: "performance", label: "Performances", icon: "gauge", description: "Distances, réseau et limites de calcul." },
  { id: "access", label: "Accès", icon: "shield-check", description: "Authentification, permissions et sécurité." },
  { id: "network", label: "Réseau", icon: "network", description: "Écoute, Query, RCON et supervision." },
  { id: "resources", label: "Ressources", icon: "package-open", description: "Pack de ressources imposé ou proposé." },
  { id: "advanced", label: "Avancé", icon: "wrench", description: "Packs de données et options spécifiques." },
];

const bool = (key, group, label, defaultValue, description, extra = {}) => ({
  key, group, label, type: "boolean", default: String(defaultValue), description, restart: true, ...extra,
});
const number = (key, group, label, defaultValue, min, max, description, extra = {}) => ({
  key, group, label, type: "number", default: String(defaultValue), min, max, description, restart: true, ...extra,
});
const text = (key, group, label, defaultValue, description, extra = {}) => ({
  key, group, label, type: "text", default: String(defaultValue), description, restart: true, ...extra,
});
const select = (key, group, label, defaultValue, options, description, extra = {}) => ({
  key, group, label, type: "select", default: String(defaultValue), options, description, restart: true, ...extra,
});

export const PROPERTY_SCHEMA = [
  text("motd", "general", "Message du serveur", "Un serveur MineHub", "Texte affiché dans la liste multijoueur."),
  number("server-port", "general", "Port Minecraft", 25565, 1, 65535, "Port TCP utilisé par les joueurs."),
  number("max-players", "general", "Joueurs maximum", 20, 1, 1000, "Nombre maximal de connexions simultanées."),
  select("gamemode", "general", "Mode de jeu", "survival", ["survival", "creative", "adventure", "spectator"], "Mode attribué aux nouveaux joueurs."),
  bool("force-gamemode", "general", "Forcer le mode de jeu", false, "Réapplique le mode par défaut à chaque connexion."),
  select("difficulty", "general", "Difficulté", "normal", ["peaceful", "easy", "normal", "hard"], "Difficulté globale du monde."),
  bool("hardcore", "general", "Mode Hardcore", false, "Les joueurs passent en spectateur après leur mort."),
  bool("pvp", "general", "Combat entre joueurs", true, "Autorise les dégâts entre joueurs."),
  bool("allow-flight", "general", "Autoriser le vol", false, "Évite l’expulsion des joueurs détectés en vol."),
  number("player-idle-timeout", "general", "Inactivité avant expulsion", 0, 0, 10080, "Durée en minutes, 0 désactive l’expulsion."),
  number("pause-when-empty-seconds", "general", "Pause lorsque vide", 60, -1, 86400, "Met en pause les ticks quand aucun joueur n’est connecté."),
  number("spawn-protection", "general", "Protection du spawn", 16, 0, 29999984, "Rayon protégé autour du point d’apparition."),

  text("level-name", "world", "Nom du monde", "world", "Nom du dossier principal du monde."),
  text("level-seed", "world", "Graine", "", "Graine utilisée lors de la génération initiale."),
  select("level-type", "world", "Type de monde", "minecraft:normal", ["minecraft:normal", "minecraft:flat", "minecraft:large_biomes", "minecraft:amplified", "minecraft:single_biome_surface"], "Générateur de monde utilisé."),
  text("generator-settings", "world", "Réglages du générateur", "{}", "Objet JSON utilisé notamment par les mondes plats.", { wide: true }),
  bool("generate-structures", "world", "Générer les structures", true, "Villages, monuments, forteresses et autres structures."),
  bool("allow-nether", "world", "Autoriser le Nether", true, "Active la dimension du Nether."),
  bool("spawn-animals", "world", "Faire apparaître les animaux", true, "Active l’apparition naturelle des animaux."),
  bool("spawn-monsters", "world", "Faire apparaître les monstres", true, "Active l’apparition naturelle des créatures hostiles."),
  bool("spawn-npcs", "world", "Faire apparaître les PNJ", true, "Active les villageois et autres PNJ."),
  number("max-world-size", "world", "Taille maximale du monde", 29999984, 1, 29999984, "Limite des coordonnées accessibles."),

  number("view-distance", "performance", "Distance d’affichage", 10, 2, 32, "Nombre de chunks envoyés à chaque joueur."),
  number("simulation-distance", "performance", "Distance de simulation", 10, 2, 32, "Nombre de chunks dont les entités et blocs sont simulés."),
  number("entity-broadcast-range-percentage", "performance", "Portée de diffusion des entités", 100, 10, 1000, "Pourcentage de la portée normale d’envoi des entités."),
  number("network-compression-threshold", "performance", "Seuil de compression réseau", 256, -1, 65535, "Taille minimale des paquets compressés, -1 désactive."),
  number("max-tick-time", "performance", "Durée maximale d’un tick", 60000, -1, 3600000, "Délai du watchdog en millisecondes, -1 le désactive."),
  number("max-chained-neighbor-updates", "performance", "Mises à jour chaînées", 1000000, -1, 10000000, "Limite les cascades de mises à jour de blocs."),
  number("rate-limit", "performance", "Limite de paquets", 0, 0, 1000000, "Nombre maximal de paquets par seconde, 0 désactive."),
  number("chat-spam-threshold-seconds", "performance", "Seuil anti-spam du chat", 10, 0, 3600, "Fenêtre de détection du spam dans le chat."),
  number("command-spam-threshold-seconds", "performance", "Seuil anti-spam des commandes", 10, 0, 3600, "Fenêtre de détection du spam de commandes."),
  bool("sync-chunk-writes", "performance", "Écriture synchrone des chunks", true, "Synchronise les sauvegardes de chunks sur le disque."),
  bool("use-native-transport", "performance", "Transport réseau natif", true, "Utilise epoll/kqueue lorsque le système le permet."),
  select("region-file-compression", "performance", "Compression des régions", "deflate", ["deflate", "lz4", "none"], "Algorithme de compression des fichiers de région."),

  bool("online-mode", "access", "Authentification officielle", true, "Vérifie les comptes auprès des services Mojang/Microsoft."),
  bool("enforce-secure-profile", "access", "Profils sécurisés", true, "Exige une clé publique de profil signée."),
  bool("white-list", "access", "Liste blanche", false, "N’autorise que les joueurs présents dans la whitelist."),
  bool("enforce-whitelist", "access", "Appliquer immédiatement la whitelist", false, "Expulse les joueurs retirés de la whitelist."),
  bool("prevent-proxy-connections", "access", "Bloquer les connexions par proxy", false, "Compare le réseau déclaré du compte à la connexion."),
  bool("hide-online-players", "access", "Masquer les joueurs", false, "N’affiche pas la liste des joueurs dans le statut public."),
  bool("log-ips", "access", "Journaliser les adresses IP", true, "Inclut les adresses IP dans les journaux de connexion."),
  select("op-permission-level", "access", "Niveau des opérateurs", "4", ["1", "2", "3", "4"], "Niveau de permission accordé aux opérateurs."),
  select("function-permission-level", "access", "Niveau des fonctions", "2", ["1", "2", "3", "4"], "Niveau de permission des fonctions de datapacks."),
  bool("enable-command-block", "access", "Blocs de commande", false, "Autorise l’exécution des blocs de commande."),

  text("server-ip", "network", "Adresse d’écoute", "", "Adresse réseau locale à utiliser. Vide écoute sur toutes les interfaces."),
  bool("enable-status", "network", "Statut public", true, "Répond aux requêtes de statut de la liste multijoueur."),
  bool("enable-query", "network", "Protocole Query", false, "Expose les informations via le protocole GameSpy4."),
  number("query.port", "network", "Port Query", 25565, 1, 65535, "Port UDP utilisé par Query."),
  bool("enable-rcon", "network", "RCON", false, "Active l’administration distante RCON."),
  number("rcon.port", "network", "Port RCON", 25575, 1, 65535, "Port TCP du service RCON."),
  text("rcon.password", "network", "Mot de passe RCON", "", "Secret du service RCON.", { secret: true }),
  bool("broadcast-rcon-to-ops", "network", "Diffuser RCON aux opérateurs", true, "Affiche les commandes RCON aux opérateurs connectés."),
  bool("broadcast-console-to-ops", "network", "Diffuser la console aux opérateurs", true, "Affiche les commandes console aux opérateurs connectés."),
  bool("enable-jmx-monitoring", "network", "Supervision JMX", false, "Expose des métriques JVM via JMX."),
  number("status-heartbeat-interval", "network", "Heartbeat du statut", 0, 0, 86400, "Intervalle du signal de statut, 0 utilise la valeur par défaut."),
  bool("management-server-enabled", "network", "Serveur de gestion", false, "Active l’API de gestion native des versions récentes."),
  text("management-server-host", "network", "Hôte de gestion", "localhost", "Interface réseau du serveur de gestion."),
  number("management-server-port", "network", "Port de gestion", 0, 0, 65535, "Port de l’API de gestion, 0 choisit automatiquement."),
  text("management-server-allowed-origins", "network", "Origines autorisées", "", "Liste des origines web autorisées par le serveur de gestion.", { wide: true }),
  text("management-server-secret", "network", "Secret de gestion", "", "Secret généré pour authentifier les clients de gestion.", { secret: true, wide: true }),
  bool("management-server-tls-enabled", "network", "TLS du serveur de gestion", true, "Chiffre les connexions au serveur de gestion."),
  text("management-server-tls-keystore", "network", "Keystore TLS", "", "Chemin du keystore utilisé pour TLS.", { wide: true }),
  text("management-server-tls-keystore-password", "network", "Mot de passe du keystore", "", "Mot de passe protégeant le keystore TLS.", { secret: true }),

  text("resource-pack", "resources", "URL du pack", "", "URL HTTPS du pack de ressources.", { wide: true }),
  text("resource-pack-id", "resources", "Identifiant du pack", "", "UUID unique du pack de ressources."),
  text("resource-pack-sha1", "resources", "Empreinte SHA-1", "", "Empreinte du fichier téléchargé."),
  text("resource-pack-prompt", "resources", "Message du pack", "", "Composant texte JSON affiché avant le téléchargement.", { wide: true }),
  bool("require-resource-pack", "resources", "Pack obligatoire", false, "Refuse les joueurs qui déclinent le pack."),

  bool("accepts-transfers", "advanced", "Accepter les transferts", false, "Autorise les transferts de joueurs depuis un autre serveur."),
  bool("enable-code-of-conduct", "advanced", "Code de conduite", false, "Active la présentation du code de conduite du serveur."),
  bool("debug", "advanced", "Journalisation de débogage", false, "Active des informations de diagnostic très détaillées."),
  text("bug-report-link", "advanced", "Lien de signalement", "", "Lien proposé aux joueurs pour signaler un problème."),
  text("text-filtering-config", "advanced", "Filtrage du texte", "", "Configuration du service externe de filtrage."),
  number("text-filtering-version", "advanced", "Version du filtrage", 0, 0, 1000, "Version du protocole de filtrage de texte."),
  text("initial-enabled-packs", "advanced", "Datapacks activés", "vanilla", "Liste des packs activés à la création."),
  text("initial-disabled-packs", "advanced", "Datapacks désactivés", "", "Liste des packs désactivés à la création."),
];

export function defaultProperties() {
  return Object.fromEntries(PROPERTY_SCHEMA.map((property) => [property.key, property.default]));
}

function unescapeProperty(value) {
  return String(value)
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\([=:\\])/g, "$1");
}

function escapeProperty(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n");
}

export function parseProperties(source) {
  const properties = {};
  const logicalLines = [];
  let pending = "";
  for (const physicalLine of String(source || "").split(/\r?\n/)) {
    const line = pending + physicalLine;
    const trailingSlashes = line.match(/\\+$/)?.[0].length || 0;
    if (trailingSlashes % 2 === 1) {
      pending = line.slice(0, -1);
      continue;
    }
    logicalLines.push(line);
    pending = "";
  }
  if (pending) logicalLines.push(pending);

  for (const original of logicalLines) {
    const line = original.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    let separator = -1;
    let escaped = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (!escaped && (char === "=" || char === ":" || /\s/.test(char))) {
        separator = index;
        break;
      }
      escaped = !escaped && char === "\\";
      if (char !== "\\") escaped = false;
    }
    const key = unescapeProperty(separator < 0 ? line : line.slice(0, separator)).trim();
    const value = separator < 0 ? "" : line.slice(separator + 1).trimStart();
    if (key) properties[key] = unescapeProperty(value);
  }
  return properties;
}

export function serializeProperties(properties) {
  const knownKeys = new Set(PROPERTY_SCHEMA.map((property) => property.key));
  const orderedKeys = [
    ...PROPERTY_SCHEMA.map((property) => property.key).filter((key) => Object.hasOwn(properties, key)),
    ...Object.keys(properties).filter((key) => !knownKeys.has(key)).sort(),
  ];
  const lines = ["# Generated by MineHub Manager", `# Updated ${new Date().toISOString()}`];
  for (const key of orderedKeys) lines.push(`${escapeProperty(key)}=${escapeProperty(properties[key])}`);
  return `${lines.join("\n")}\n`;
}

export function legacyProperties(settings = {}) {
  const mappings = {
    motd: "motd",
    port: "server-port",
    maxPlayers: "max-players",
    onlineMode: "online-mode",
    whitelist: "white-list",
    pvp: "pvp",
    difficulty: "difficulty",
    gamemode: "gamemode",
    viewDistance: "view-distance",
    simulationDistance: "simulation-distance",
  };
  return Object.fromEntries(Object.entries(mappings)
    .filter(([legacyKey]) => settings[legacyKey] !== undefined)
    .map(([legacyKey, propertyKey]) => [propertyKey, String(settings[legacyKey])]));
}

export function settingsFromProperties(properties, current = {}) {
  const numberValue = (key, fallback) => Number.isFinite(Number(properties[key])) ? Number(properties[key]) : fallback;
  const booleanValue = (key, fallback) => properties[key] === undefined ? fallback : properties[key] === "true";
  return {
    ...current,
    motd: String(properties.motd ?? current.motd ?? "Un serveur MineHub"),
    port: numberValue("server-port", current.port ?? 25565),
    maxPlayers: numberValue("max-players", current.maxPlayers ?? 20),
    onlineMode: booleanValue("online-mode", current.onlineMode ?? true),
    whitelist: booleanValue("white-list", current.whitelist ?? false),
    pvp: booleanValue("pvp", current.pvp ?? true),
    difficulty: String(properties.difficulty ?? current.difficulty ?? "normal"),
    gamemode: String(properties.gamemode ?? current.gamemode ?? "survival"),
    viewDistance: numberValue("view-distance", current.viewDistance ?? 10),
    simulationDistance: numberValue("simulation-distance", current.simulationDistance ?? 10),
  };
}

export function normalizePropertyPatch(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Propriétés invalides");
  const normalized = {};
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = String(rawKey).trim();
    if (!/^[A-Za-z0-9_.-]{1,96}$/.test(key)) throw new Error(`Clé de propriété invalide : ${key}`);
    const value = String(rawValue ?? "");
    if (value.length > 4096 || /[\0\r]/.test(value)) throw new Error(`Valeur invalide pour ${key}`);
    normalized[key] = value;
  }
  if (Object.keys(normalized).length > 200) throw new Error("Trop de propriétés dans une seule modification");
  return normalized;
}
