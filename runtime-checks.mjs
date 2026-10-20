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
}
