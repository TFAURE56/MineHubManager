import test from "node:test";
import assert from "node:assert/strict";
import { buildPlayerStats } from "../player-stats.mjs";

test("agrege les sessions et l'activite MineHub par joueur", () => {
  const stats = buildPlayerStats({
    events: [
      { type: "join", player: "Alex", timestamp: "2026-01-01T10:00:00Z" },
      { type: "leave", player: "Alex", timestamp: "2026-01-01T10:01:00Z" },
      { type: "join", player: "Alex", timestamp: "2026-01-01T11:00:00Z" },
      { type: "pvp", player: "Alex", target: "Steve", timestamp: "2026-01-01T11:01:00Z" },
      { type: "chat", player: "Steve", timestamp: "2026-01-01T11:02:00Z" },
      { type: "advancement", player: "Alex", timestamp: "2026-01-01T11:03:00Z" },
    ],
    onlinePlayers: [{ name: "Alex", sessionSeconds: 180 }],
  });

  assert.deepEqual(stats.map(({ name }) => name), ["Alex", "Steve"]);
  assert.equal(stats[0].sessions, 2);
  assert.equal(stats[0].playTimeSeconds, 240);
  assert.equal(stats[0].deaths, 1);
  assert.equal(stats[0].advancements, 1);
  assert.equal(stats[1].playerKills, 1);
  assert.equal(stats[1].chatMessages, 1);
});

test("utilise les compteurs natifs Minecraft et conserve les stats d'avancements", () => {
  const stats = buildPlayerStats({
    profiles: [{ name: "Steve", uuid: "00000000-0000-0000-0000-000000000001" }],
    statFiles: {
      "00000000000000000000000000000001": {
        stats: {
          "minecraft:custom": {
            "minecraft:play_time": 4000,
            "minecraft:deaths": 7,
            "minecraft:player_kills": 3,
            "minecraft:mob_kills": 21,
            "minecraft:walk_one_cm": 12500,
          },
          "minecraft:mined": { "minecraft:stone": 10, "minecraft:dirt": 5 },
          "minecraft:crafted": { "minecraft:torch": 8 },
        },
      },
    },
    advancementFiles: {
      "00000000-0000-0000-0000-000000000001": { a: { done: true }, b: { done: false }, c: { done: true } },
    },
    events: [{ type: "death", player: "Steve", timestamp: "2026-01-01T10:00:00Z" }],
    onlinePlayers: [{ name: "Steve", sessionSeconds: 20 }],
  });

  assert.equal(stats[0].playTimeSeconds, 200);
  assert.equal(stats[0].deaths, 7);
  assert.equal(stats[0].playerKills, 3);
  assert.equal(stats[0].mobKills, 21);
  assert.equal(stats[0].advancements, 2);
  assert.equal(stats[0].blocksMined, 15);
  assert.equal(stats[0].itemsCrafted, 8);
  assert.equal(stats[0].walkedMeters, 125);
  assert.equal(stats[0].hasNativeStats, true);
});

test("ignore les noms invalides et supporte les profils seulement connus via l'historique", () => {
  const stats = buildPlayerStats({
    profiles: [{ name: "Bad Name", uuid: "id" }],
    events: [{ type: "join", player: "Builder_1", timestamp: "2026-01-01T10:00:00Z" }],
  });
  assert.equal(stats.length, 1);
  assert.equal(stats[0].name, "Builder_1");
  assert.equal(stats[0].sessions, 1);
});
