import { useQuery } from '@tanstack/react-query';
import { X, ExternalLink, TrendingUp, TrendingDown, BookmarkPlus, BookmarkMinus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getAggregates, getSingleSnapshot, getTickerDetails, getTickerNews } from '../api/massive';
import { fmtPrice, fmtPct, fmtChange, fmtVolume, fmtMarketCap, changeColor, changeBg, subDays, formatDate, timeAgo } from '../api/format';
import { useStore } from '../store/workbench';

interface Props {
  ticker: string;
  onClose: () => void;
}

export function TickerDetail({ ticker, onClose }: Props) {
  const { addToPortfolio, removeFromPortfolio, isInPortfolio } = useStore();
  const inPortfolio = isInPortfolio(ticker);

  const today = new Date().toISOString().split('T')[0];
  const from = subDays(new Date(), 90);

  const { data: snapshot, isLoading: snapLoading } = useQuery({
    queryKey: ['snapshot', ticker],
    queryFn: () => getSingleSnapshot(ticker),
    staleTime: 60000,
  });

  const { data: details } = useQuery({
    queryKey: ['details', ticker],
    queryFn: () => getTickerDetails(ticker),
    staleTime: 10 * 60000,
  });

  const { data: agg } = useQuery({
    queryKey: ['agg', ticker, '90d'],
    queryFn: () => getAggregates(ticker, from, today, 'day'),
    staleTime: 5 * 60000,
  });

  const { data: news } = useQuery({
    queryKey: ['news', ticker],
    queryFn: () => getTickerNews(ticker, 4),
    staleTime: 5 * 60000,
  });

  const price = snapshot?.day?.c || snapshot?.lastTrade?.p || snapshot?.prevDay?.c;
  const change = snapshot?.todaysChangePerc ?? 0;
  const isUp = change >= 0;
  const color = isUp ? 'var(--green)' : 'var(--red)';
  const chartData = agg?.map(b => ({ t: new Date(b.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), c: b.c })) ?? [];

  const togglePortfolio = () => {
    if (inPortfolio) removeFromPortfolio(ticker);
    else addToPortfolio(ticker, details?.name || ticker);
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panel} className="animate-in">
        {/* Header */}
        <div style={header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={tickerH}>{ticker}</span>
              {details?.primary_exchange && (
                <span style={exchangeBadge}>{details.primary_exchange}</span>
              )}
            </div>
            {details?.name && <div style={nameH}>{details.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={togglePortfolio} style={actionBtn(inPortfolio)}>
              {inPortfolio ? <><BookmarkMinus size={14} /> Watchlisted</> : <><BookmarkPlus size={14} /> Add to Portfolio</>}
            </button>
            <button onClick={onClose} style={closeBtn}><X size={16} /></button>
          </div>
        </div>

        <div style={body}>
          {snapLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
            </div>
          ) : (
            <>
              {/* Price hero */}
              <div style={priceHero}>
                <span style={bigPrice}>{fmtPrice(price)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: 16 }}>
                    {isUp ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> : <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />}
                    {fmtChange(snapshot?.todaysChange)}
                  </span>
                  <span style={{ background: changeBg(change), color: changeColor(change), padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>
                    {fmtPct(change)}
                  </span>
                </div>
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div style={chartBox}>
                  <div style={sectionLabel}>90-Day Performance</div>
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
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(0)}`} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                        formatter={(v) => [fmtPrice(v as number), 'Close']}
                      />
                      <Area type="monotone" dataKey="c" stroke={color} strokeWidth={2} fill={`url(#detail-grad-${ticker})`} dot={false} activeDot={{ r: 4, fill: color }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Stats grid */}
              <div style={statsGrid}>
                {snapshot && [
                  { label: 'Open', value: fmtPrice(snapshot.day?.o) },
                  { label: 'High', value: fmtPrice(snapshot.day?.h) },
                  { label: 'Low', value: fmtPrice(snapshot.day?.l) },
                  { label: 'Prev Close', value: fmtPrice(snapshot.prevDay?.c) },
                  { label: 'Volume', value: fmtVolume(snapshot.day?.v) },
                  { label: 'VWAP', value: fmtPrice(snapshot.day?.vw) },
                ].map(({ label, value }) => (
                  <div key={label} style={statItem}>
                    <span style={statLabel}>{label}</span>
                    <span style={statValue}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Company info */}
              {details && (
                <div style={companySection}>
                  <div style={sectionLabel}>Company</div>
                  <div style={statsGrid}>
                    {details.market_cap && <div style={statItem}><span style={statLabel}>Mkt Cap</span><span style={statValue}>{fmtMarketCap(details.market_cap)}</span></div>}
                    {details.total_employees && <div style={statItem}><span style={statLabel}>Employees</span><span style={statValue}>{new Intl.NumberFormat().format(details.total_employees)}</span></div>}
                    {details.list_date && <div style={statItem}><span style={statLabel}>Listed</span><span style={statValue}>{formatDate(details.list_date)}</span></div>}
                    {details.sic_description && <div style={statItem}><span style={statLabel}>Sector</span><span style={statValue}>{details.sic_description}</span></div>}
                  </div>
                  {details.description && (
                    <p style={descText}>{details.description.slice(0, 300)}{details.description.length > 300 ? '…' : ''}</p>
                  )}
                  {details.homepage_url && (
                    <a href={details.homepage_url} target="_blank" rel="noreferrer" style={linkBtn}>
                      <ExternalLink size={12} /> {details.homepage_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                </div>
              )}

              {/* News */}
              {news && news.length > 0 && (
                <div>
                  <div style={sectionLabel}>Recent News</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {news.map(item => (
                      <a key={item.id} href={item.article_url} target="_blank" rel="noreferrer" style={newsItem}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>{item.title}</div>
                          <ExternalLink size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                          {item.publisher.name} · {timeAgo(item.published_utc)}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' };
const panel: React.CSSProperties = { width: '100%', maxWidth: 520, background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' };
const header: React.CSSProperties = { padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, position: 'sticky', top: 0, background: 'var(--surface-2)', zIndex: 1 };
const tickerH: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.04em' };
const nameH: React.CSSProperties = { fontSize: 13, color: 'var(--text-3)', marginTop: 2 };
const exchangeBadge: React.CSSProperties = { fontSize: 10, background: 'var(--gold-dim2)', color: 'var(--gold)', border: '1px solid var(--gold-dim)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' };
const body: React.CSSProperties = { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 };
const priceHero: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' };
const bigPrice: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 600, color: 'var(--text)' };
const chartBox: React.CSSProperties = {};
const sectionLabel: React.CSSProperties = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 };
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px' };
const statItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const statLabel: React.CSSProperties = { fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 };
const statValue: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 400 };
const companySection: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const descText: React.CSSProperties = { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 };
const linkBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--blue)', fontFamily: 'var(--font-mono)' };
const newsItem: React.CSSProperties = { background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'block', transition: 'border-color 0.15s' };

function actionBtn(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
    padding: '7px 12px', borderRadius: 8, border: `1px solid ${active ? 'var(--gold)' : 'var(--border-2)'}`,
    background: active ? 'var(--gold-dim)' : 'var(--surface-3)',
    color: active ? 'var(--gold)' : 'var(--text-2)',
    transition: 'all 0.15s', whiteSpace: 'nowrap'
  };
}

const closeBtn: React.CSSProperties = { background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' };
