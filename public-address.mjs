export function normalizePublicAddress(value) {
  const address = String(value || "").trim().replace(/^minecraft:\/\//i, "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (!address) return "";
  if (address.length > 280 || /[\s/?#@]/.test(address)) throw new Error("Saisissez une adresse Minecraft sous la forme hote ou hote:port.");

  const match = address.match(/^(\[[0-9a-f:.]+\]|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*)(?::(\d{1,5}))?$/i);
  if (!match || (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 65535))) {
    throw new Error("Adresse invalide. Exemple : mon-serveur.gl.joinmc.link:12345");
  }
  return address;
}
