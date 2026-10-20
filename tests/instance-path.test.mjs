import test from "node:test";
import assert from "node:assert/strict";
import { resolveInstanceDirectory } from "../instance-path.mjs";

test("accepte un dossier absolu distinct pour les instances", () => {
  assert.equal(resolveInstanceDirectory("C:\\Minecraft\\instances", "C:\\MineHub\\data\\servers", "win32"), "C:\\Minecraft\\instances");
});

test("refuse les chemins relatifs, racines et migrations imbriquées", () => {
  assert.throws(() => resolveInstanceDirectory("instances", "C:\\MineHub\\data\\servers", "win32"));
  assert.throws(() => resolveInstanceDirectory("C:\\", "C:\\MineHub\\data\\servers", "win32"));
  assert.throws(() => resolveInstanceDirectory("C:\\MineHub\\data\\servers\\new", "C:\\MineHub\\data\\servers", "win32"));
});
