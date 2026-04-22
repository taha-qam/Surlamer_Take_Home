/**
 * components/TickerDetail.tsx
 * Slide-in detail panel for a single equity.
 * Uses <aside> (complementary content), <section>, <dl> for stats, <time> for
 * timestamps, and <address> for company links.
 */

import { X, ExternalLink, TrendingUp, TrendingDown, BookmarkPlus, BookmarkMinus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  useSingleSnapshot,
  useTickerDetails,
  useAggregates,
  useTickerNews,
} from '../hooks/useMarketData';
import { extractPrice } from '../services/market';
import {
  fmtPrice, fmtPct, fmtChange, fmtVolume, fmtMarketCap,
  changeColor, changeBg, formatDate, timeAgo,
} from '../api/format';
import { useStore } from '../store/workbench';

interface Props {
  ticker: string;
  onClose: () => void;
}

export function TickerDetail({ ticker, onClose }: Props) {
  const { addToPortfolio, removeFromPortfolio, isInPortfolio } = useStore();
  const inPortfolio = isInPortfolio(ticker);

  const { data: snapshot, isLoading: snapLoading, error: snapError } = useSingleSnapshot(ticker);
  const { data: details } = useTickerDetails(ticker);
  const { data: agg } = useAggregates(ticker, 90);
  const { data: news } = useTickerNews(ticker, 4);

  const price = snapshot ? extractPrice(snapshot) : undefined;
  const change = snapshot?.todaysChangePerc ?? 0;
  const isUp = change >= 0;
  const color = isUp ? 'var(--green)' : 'var(--red)';

  const chartData =
    agg?.map((b) => ({
      t: new Date(b.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      c: b.c,
    })) ?? [];

  const togglePortfolio = () => {
    if (inPortfolio) removeFromPortfolio(ticker);
    else addToPortfolio(ticker, details?.name ?? ticker);
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside style={panel} className="animate-in" aria-label={`Details for ${ticker}`}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header style={headerStyle}>
          <hgroup style={{ margin: 0 }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <span style={tickerH}>{ticker}</span>
              {details?.primary_exchange && (
                <span style={exchangeBadge}>{details.primary_exchange}</span>
              )}
            </p>
            {details?.name && <p style={nameH}>{details.name}</p>}
          </hgroup>

          <menu style={{ display: 'flex', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
            <li>
              <button onClick={togglePortfolio} style={actionBtn(inPortfolio)} aria-pressed={inPortfolio}>
                {inPortfolio
                  ? <><BookmarkMinus size={14} aria-hidden /> Watchlisted</>
                  : <><BookmarkPlus size={14} aria-hidden /> Add to Portfolio</>}
              </button>
            </li>
            <li>
              <button onClick={onClose} style={closeBtn} aria-label="Close detail panel">
                <X size={16} aria-hidden />
              </button>
            </li>
          </menu>
        </header>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={bodyStyle}>
          {snapLoading ? (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <li key={i} className="skeleton" style={{ height: 40, borderRadius: 6 }} />
              ))}
            </ul>
          ) : snapError ? (
            <p role="alert" style={{ color: 'var(--red)', fontSize: 13, padding: '12px 0' }}>
              {snapError instanceof Error ? snapError.message : 'Failed to load data.'}
            </p>
          ) : (
            <>
              {/* Price hero */}
              <p style={priceHero}>
                <span style={bigPrice}>{fmtPrice(price)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: 16 }}>
                    {isUp
                      ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} aria-hidden />
                      : <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} aria-hidden />}
                    {fmtChange(snapshot?.todaysChange)}
                  </span>
                  <span style={{ background: changeBg(change), color: changeColor(change), padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>
                    {fmtPct(change)}
                  </span>
                </span>
              </p>

              {/* Chart */}
              {chartData.length > 0 && (
                <section aria-label="90-day price performance">
                  <p style={sectionLabel}>90-Day Performance</p>
                  <figure style={{ margin: 0 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`detail-grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} interval={14} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v as number).toFixed(0)}`} />
                        <Tooltip
                          contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                          formatter={(v) => [fmtPrice(v as number), 'Close']}
                        />
                        <Area type="monotone" dataKey="c" stroke={color} strokeWidth={2} fill={`url(#detail-grad-${ticker})`} dot={false} activeDot={{ r: 4, fill: color }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </figure>
                </section>
              )}

              {/* Stats grid */}
              {snapshot && (
                <section aria-label="Today's market data">
                  <dl style={statsGrid}>
                    {[
                      { label: 'Open', value: fmtPrice(snapshot.day?.o) },
                      { label: 'High', value: fmtPrice(snapshot.day?.h) },
                      { label: 'Low', value: fmtPrice(snapshot.day?.l) },
                      { label: 'Prev Close', value: fmtPrice(snapshot.prevDay?.c) },
                      { label: 'Volume', value: fmtVolume(snapshot.day?.v) },
                      { label: 'VWAP', value: fmtPrice(snapshot.day?.vw) },
                    ].map(({ label, value }) => (
                      <div key={label} style={statItem}>
                        <dt style={statLabel}>{label}</dt>
                        <dd style={statValue}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Company info */}
              {details && (
                <section aria-label="Company information" style={companySection}>
                  <p style={sectionLabel}>Company</p>
                  <dl style={statsGrid}>
                    {details.market_cap && (
                      <div style={statItem}>
                        <dt style={statLabel}>Mkt Cap</dt>
                        <dd style={statValue}>{fmtMarketCap(details.market_cap)}</dd>
                      </div>
                    )}
                    {details.total_employees && (
                      <div style={statItem}>
                        <dt style={statLabel}>Employees</dt>
                        <dd style={statValue}>{new Intl.NumberFormat().format(details.total_employees)}</dd>
                      </div>
                    )}
                    {details.list_date && (
                      <div style={statItem}>
                        <dt style={statLabel}>Listed</dt>
                        <dd style={statValue}>
                          <time dateTime={details.list_date}>{formatDate(details.list_date)}</time>
                        </dd>
                      </div>
                    )}
                    {details.sic_description && (
                      <div style={statItem}>
                        <dt style={statLabel}>Sector</dt>
                        <dd style={statValue}>{details.sic_description}</dd>
                      </div>
                    )}
                  </dl>

                  {details.description && (
                    <p style={descText}>
                      {details.description.slice(0, 300)}
                      {details.description.length > 300 ? '…' : ''}
                    </p>
                  )}

                  {details.homepage_url && (
                    <address style={{ fontStyle: 'normal' }}>
                      <a href={details.homepage_url} target="_blank" rel="noreferrer" style={linkBtn}>
                        <ExternalLink size={12} aria-hidden />
                        {details.homepage_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </address>
                  )}
                </section>
              )}

              {/* News */}
              {news && news.length > 0 && (
                <section aria-label="Recent news">
                  <p style={sectionLabel}>Recent News</p>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {news.map((item) => (
                      <li key={item.id}>
                        <a href={item.article_url} target="_blank" rel="noreferrer" style={newsItem}>
                          <p style={{ display: 'flex', justifyContent: 'space-between', gap: 8, margin: 0 }}>
                            <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-4)', lineHeight: 1.4, flex: 1 }}>
                              {item.title}
                            </span>
                            <ExternalLink size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} aria-hidden />
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, marginBottom: 0 }}>
                            {item.publisher.name} ·{' '}
                            <time dateTime={item.published_utc}>{timeAgo(item.published_utc)}</time>
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  zIndex: 100, display: 'flex', justifyContent: 'flex-end',
};
const panel: React.CSSProperties = {
  width: '100%', maxWidth: 520,
  background: 'var(--surface-2)', borderLeft: '1px solid var(--border)',
  height: '100vh', overflow: 'auto',
  display: 'flex', flexDirection: 'column',
};
const headerStyle: React.CSSProperties = {
  padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
  position: 'sticky', top: 0, background: 'var(--surface-2)', zIndex: 1,
};
const tickerH: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600,
  color: 'var(--text-4)', letterSpacing: '0.04em',
};
const nameH: React.CSSProperties = { fontSize: 13, color: 'var(--text-4)', marginTop: 2 };
const exchangeBadge: React.CSSProperties = {
  fontSize: 10, background: 'var(--gold-dim2)', color: 'var(--gold)',
  border: '1px solid var(--gold-dim)', borderRadius: 4,
  padding: '2px 6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
};
const bodyStyle: React.CSSProperties = {
  padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24,
};
const priceHero: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', margin: 0,
};
const bigPrice: React.CSSProperties = {
  fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 600, color: 'var(--text-4)',
};
const sectionLabel: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'var(--text-3)', fontWeight: 600, marginBottom: 10, marginTop: 0,
};
const statsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px', margin: 0,
};
const statItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const statLabel: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
};
const statValue: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 400,
  margin: 0,
};
const companySection: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const descText: React.CSSProperties = {
  fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: 0,
};
const linkBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 12, color: 'var(--blue)', fontFamily: 'var(--font-mono)',
};
const newsItem: React.CSSProperties = {
  background: 'var(--surface-3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 12px', display: 'block', transition: 'border-color 0.15s',
};

function actionBtn(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
    padding: '7px 12px', borderRadius: 8,
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border-2)'}`,
    background: active ? 'var(--gold-dim)' : 'var(--surface-3)',
    color: active ? 'var(--gold)' : 'var(--text-2)',
    transition: 'all 0.15s', whiteSpace: 'nowrap', cursor: 'pointer',
  };
}

const closeBtn: React.CSSProperties = {
  background: 'var(--surface-3)', border: '1px solid var(--border)',
  color: 'var(--text-3)', borderRadius: 8, width: 34, height: 34,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
