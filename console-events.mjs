const playerName = "([A-Za-z0-9_]{1,16})";

export function stripSystemChat(message) {
  return String(message || "").replace(/^System chat:\s*/i, "");
}

export function parseAdvancementMessage(message) {
  const pattern = new RegExp(`^${playerName} has (?:made (?:the )?advancement|completed (?:the )?challenge|reached (?:the )?goal) \\[(.+)\\]$`, "i");
  const match = stripSystemChat(message).match(pattern);
  return match ? { player: match[1], advancement: match[2] } : null;
}
