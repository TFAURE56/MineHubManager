import assert from "node:assert/strict";
import test from "node:test";

import {
  PROPERTY_SCHEMA,
  normalizePropertyPatch,
  parseProperties,
  serializeProperties,
  settingsFromProperties,
} from "../server-properties.mjs";

test("le catalogue ne contient aucune clé dupliquée", () => {
  const keys = PROPERTY_SCHEMA.map((property) => property.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.length >= 70);
});

test("le parseur ignore les commentaires et conserve les propriétés personnalisées", () => {
  const parsed = parseProperties(`
# Exemple
motd=Bienvenue\\nSur MineHub
online-mode=false
plugin.custom-value=actif
`);

  assert.deepEqual(parsed, {
    motd: "Bienvenue\nSur MineHub",
    "online-mode": "false",
    "plugin.custom-value": "actif",
  });
});

test("la sérialisation permet un aller-retour sans perdre les clés inconnues", () => {
  const properties = {
    motd: "MineHub",
    "max-players": "42",
    "paper.future-option": "enabled",
  };

  const roundTrip = parseProperties(serializeProperties(properties));
  assert.deepEqual(roundTrip, properties);
});

test("la conversion legacy respecte les nombres et booléens", () => {
  const settings = settingsFromProperties({
    "server-port": "25570",
    "max-players": "35",
    "online-mode": "false",
    "white-list": "true",
  });

  assert.equal(settings.port, 25570);
  assert.equal(settings.maxPlayers, 35);
  assert.equal(settings.onlineMode, false);
  assert.equal(settings.whitelist, true);
});

test("une clé ou une valeur dangereuse est refusée", () => {
  assert.throws(() => normalizePropertyPatch({ "bad key": "value" }), /invalide/i);
  assert.throws(() => normalizePropertyPatch({ motd: "hello\rstop" }), /invalide/i);
});
