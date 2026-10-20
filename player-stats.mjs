const number = (value) => Math.max(0, Number(value) || 0);
const uuidKey = (value) => String(value || "").replaceAll("-", "").toLowerCase();
const playerKey = (value) => String(value || "").toLowerCase();

function sumValues(value) {
  return Object.values(value || {}).reduce((total, item) => total + number(item), 0);
}

function eventTime(event) {
  const time = new Date(event.timestamp || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function buildPlayerStats({ profiles = [], statFiles = {}, advancementFiles = {}, events = [], onlinePlayers = [] } = {}) {
  const players = new Map();
  const byUuid = new Map();
  const ensure = (name) => {
    if (!/^[A-Za-z0-9_]{1,16}$/.test(String(name || ""))) return null;
    const key = playerKey(name);
    if (!players.has(key)) {
      players.set(key, {
        name,
        uuid: null,
        online: false,
        currentSessionSeconds: 0,
        _nativePlayTime: null,
        _sessionStart: null,
        _sessionSeconds: 0,
        _joins: 0,
        _deaths: 0,
        _playerKills: 0,
        _advancements: 0,
        _chatMessages: 0,
        _lastSeenAt: null,
        _lastActivityAt: null,
      });
    }
    return players.get(key);
  };

  for (const profile of profiles) {
    const player = ensure(profile.name);
    if (!player) continue;
    player.uuid = profile.uuid || player.uuid;
    if (profile.uuid) byUuid.set(uuidKey(profile.uuid), player);
  }

  for (const event of [...events].sort((a, b) => eventTime(a) - eventTime(b))) {
    const player = ensure(event.player);
    const target = ensure(event.target || event.meta?.killer);
    const time = eventTime(event);
    const timestamp = event.timestamp || null;
    if (player) {
      player._lastActivityAt = timestamp || player._lastActivityAt;
      if (["join", "leave"].includes(event.type)) player._lastSeenAt = timestamp || player._lastSeenAt;
      if (event.type === "join") {
        player._joins += 1;
        player._sessionStart = time || player._sessionStart;
      } else if (event.type === "leave") {
        const eventDuration = number(event.meta?.sessionSeconds);
        if (player._sessionStart) player._sessionSeconds += eventDuration || Math.max(0, Math.floor((time - player._sessionStart) / 1000));
        player._sessionStart = null;
      } else if (["death", "pvp"].includes(event.type)) {
        player._deaths += 1;
      } else if (event.type === "advancement") {
        player._advancements += 1;
      } else if (event.type === "chat") {
        player._chatMessages += 1;
      }
    }
    if (target) {
      target._lastActivityAt = timestamp || target._lastActivityAt;
      if (event.type === "pvp") target._playerKills += 1;
    }
  }

  for (const online of onlinePlayers) {
    const player = ensure(online.name);
    if (!player) continue;
    player.online = true;
    player.currentSessionSeconds = number(online.sessionSeconds);
    player._lastSeenAt = online.joinedAt || player._lastSeenAt;
    player._lastActivityAt = online.lastSeenAt || online.joinedAt || player._lastActivityAt;
  }

  for (const [id, statsFile] of Object.entries(statFiles)) {
    const player = byUuid.get(uuidKey(id));
    if (!player) continue;
    const stats = statsFile?.stats || {};
    const custom = stats["minecraft:custom"] || {};
    if (custom["minecraft:play_time"] !== undefined) player._nativePlayTime = Math.floor(number(custom["minecraft:play_time"]) / 20);
    player._deaths = Math.max(player._deaths, number(custom["minecraft:deaths"]));
    player._playerKills = Math.max(player._playerKills, number(custom["minecraft:player_kills"]));
    player.mobKills = number(custom["minecraft:mob_kills"]);
    player.blocksMined = sumValues(stats["minecraft:mined"]);
    player.itemsCrafted = sumValues(stats["minecraft:crafted"]);
    player.walkedMeters = Math.floor(number(custom["minecraft:walk_one_cm"]) / 100);
  }

  for (const [id, advancementFile] of Object.entries(advancementFiles)) {
    const player = byUuid.get(uuidKey(id));
    if (!player) continue;
    player._advancements = Math.max(
      player._advancements,
      Object.values(advancementFile || {}).filter((advancement) => advancement?.done).length,
    );
  }

  return [...players.values()].map((player) => ({
    name: player.name,
    uuid: player.uuid,
    online: player.online,
    playTimeSeconds: (player._nativePlayTime ?? player._sessionSeconds) + (player._nativePlayTime === null ? player.currentSessionSeconds : 0),
    currentSessionSeconds: player.currentSessionSeconds,
    sessions: player._joins,
    deaths: player._deaths,
    playerKills: player._playerKills,
    mobKills: player.mobKills || 0,
    advancements: player._advancements,
    chatMessages: player._chatMessages,
    blocksMined: player.blocksMined || 0,
    itemsCrafted: player.itemsCrafted || 0,
    walkedMeters: player.walkedMeters || 0,
    lastSeenAt: player._lastSeenAt,
    lastActivityAt: player._lastActivityAt,
    hasNativeStats: player._nativePlayTime !== null,
  })).sort((a, b) => b.playTimeSeconds - a.playTimeSeconds || a.name.localeCompare(b.name));
}
