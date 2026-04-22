export function fmt(n: number | undefined | null, opts: Intl.NumberFormatOptions = {}): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', opts).format(n);
}

export function fmtPrice(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  return `$${fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function fmtChange(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${fmtPrice(n)}`;
}

export function fmtVolume(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function fmtMarketCap(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmt(n)}`;
}

export function changeColor(n: number | undefined | null): string {
  if (n == null) return 'var(--text-3)';
  if (n > 0) return 'var(--green)';
  if (n < 0) return 'var(--red)';
  return 'var(--text-3)';
}

export function changeBg(n: number | undefined | null): string {
  if (n == null) return 'transparent';
  if (n > 0) return 'var(--green-dim)';
  if (n < 0) return 'var(--red-dim)';
  return 'transparent';
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  } catch { return iso; }
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export function subDays(d: Date, n: number): string {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - n);
  return copy.toISOString().split('T')[0];
}
