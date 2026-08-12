export function fmtUsd(value: number): string {
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `US$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(2).replace(/0$/, "")} billion`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `US$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/0$/, "")} million`;
  }
  return `US$${value.toLocaleString("en-US")}`;
}

export function fmtUsdCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "n.d.";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}
