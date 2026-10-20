import test from "node:test";
import assert from "node:assert/strict";
import { parseAdvancementMessage, stripSystemChat } from "../console-events.mjs";

test("reconnait les succès enveloppés par le chat système de Fabric", () => {
  assert.deepEqual(
    parseAdvancementMessage("System chat: DA3MOON has made the advancement [Getting an Upgrade]"),
    { player: "DA3MOON", advancement: "Getting an Upgrade" },
  );
});

test("reconnait aussi les formats vanilla sans enveloppe", () => {
  assert.deepEqual(
    parseAdvancementMessage("Alex has completed the challenge [The Next Generation]"),
    { player: "Alex", advancement: "The Next Generation" },
  );
  assert.equal(parseAdvancementMessage("Loaded 1866 advancements"), null);
});

test("retire l'enveloppe du chat système pour les autres événements joueur", () => {
  assert.equal(stripSystemChat("System chat: DA3MOON drowned"), "DA3MOON drowned");
  assert.equal(stripSystemChat("System chat: <DA3MOON> gg"), "<DA3MOON> gg");
});
