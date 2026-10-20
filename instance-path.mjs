import { isAbsolute, parse, resolve, sep } from "node:path";

function comparable(path, platform) {
  const normalized = resolve(path);
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

function contains(parent, child, platform) {
  const base = comparable(parent, platform).replace(/[\\/]+$/, "");
  const candidate = comparable(child, platform);
  return candidate === base || candidate.startsWith(`${base}${sep}`);
}

export function resolveInstanceDirectory(value, currentDirectory, platform = process.platform) {
  const input = String(value || "").trim();
  if (!isAbsolute(input)) throw new Error("Le chemin doit être absolu et être saisi sur l’hôte MineHub.");
  const destination = resolve(input);
  const root = parse(destination).root;
  if (comparable(destination, platform) === comparable(root, platform)) {
    throw new Error("Choisissez un sous-dossier pour les instances, pas la racine du disque.");
  }
  if (contains(currentDirectory, destination, platform) || contains(destination, currentDirectory, platform)) {
    if (comparable(destination, platform) !== comparable(currentDirectory, platform)) {
      throw new Error("Le nouveau dossier ne peut pas être imbriqué dans l’ancien (ni l’inverse).");
    }
  }
  return destination;
}
