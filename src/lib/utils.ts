export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(ts: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function formatMatchClock(phase: string, kickoffOffsetMin = 75) {
  if (phase === "pre-match") {
    return `T-${kickoffOffsetMin}`;
  }
  if (phase === "first-half") return "1H";
  if (phase === "halftime") return "HT";
  if (phase === "second-half") return "2H";
  if (phase === "post-match") return "FT";
  return phase;
}
