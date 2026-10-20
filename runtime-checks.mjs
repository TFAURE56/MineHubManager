<<<<<<< HEAD
export function inspectNodeVersion(version, minimumMajor) {
  const match = String(version).match(/^v?(\d+)\./);
  const major = match ? Number(match[1]) : null;
  return {
    installed: major !== null,
    version: String(version),
    major,
    minimumMajor,
    compatible: major !== null && major >= minimumMajor,
  };
}

export function parseJavaVersion(output) {
  const match = String(output).match(/version\s+"([^"]+)"|openjdk\s+(\d+(?:\.\d+)?(?:\.\d+)?)/i);
  if (!match) return null;
  const version = match[1] || match[2];
  const major = version.startsWith("1.") ? Number(version.split(".")[1]) : Number(version.split(".")[0]);
  return { version, major };
=======
export function parseJavaVersion(output) {
  const text = String(output || "");
  const version = text.match(/version\s+["']([^"']+)["']/i)?.[1]
    || text.match(/(?:openjdk|java)\s+(?:version\s+)?([0-9]+(?:\.[0-9]+){0,3}(?:[_+.-][0-9A-Za-z.-]+)?)/i)?.[1];
  if (!version) return null;
  const parts = version.split(/[._+-]/).map(Number);
  const major = parts[0] === 1 ? parts[1] : parts[0];
  return Number.isInteger(major) ? { version, major } : null;
}

export function inspectNodeVersion(version, minimumMajor = 20) {
  const major = Number(String(version).replace(/^v/, "").split(".")[0]);
  return {
    installed: Number.isInteger(major),
    version: String(version),
    major: Number.isInteger(major) ? major : null,
    minimumMajor,
    compatible: Number.isInteger(major) && major >= minimumMajor,
  };
>>>>>>> 77abf2e (0.5.1)
}
