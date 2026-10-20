const versionPattern = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

function parseVersion(value) {
  const match = versionPattern.exec(String(value || "").trim());
  if (!match) throw new Error(`Version semantique invalide : ${value}`);
  return {
    core: match.slice(1, 4).map(Number),
    prerelease: match[4] ? match[4].split(".") : null,
  };
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
  }
  if (!a.prerelease && !b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index += 1) {
    const leftPart = a.prerelease[index];
    const rightPart = b.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric && rightNumeric) return Number(leftPart) > Number(rightPart) ? 1 : -1;
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

export function normalizeGitHubRepository(value) {
  let input = String(value || "").trim();
  if (/^https?:\/\//i.test(input)) {
    let url;
    try {
      url = new URL(input);
    } catch {
      throw new Error("Saisissez owner/repo ou une URL GitHub valide.");
    }
    if (url.hostname.toLowerCase() !== "github.com") throw new Error("Le dépôt doit être hébergé sur github.com.");
    input = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input)) {
    throw new Error("Saisissez le dépôt au format owner/repo.");
  }
  if (input.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("Le nom du dépôt GitHub est invalide.");
  }
  return input;
}
