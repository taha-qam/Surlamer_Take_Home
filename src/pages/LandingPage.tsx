import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp, TrendingDown, BarChart2, BookOpen, Shield, Activity } from 'lucide-react';
import { getGainersLosers, getMarketStatus, getMarketNews } from '../api/massive';
import { fmtPrice, fmtPct, changeColor, changeBg, timeAgo } from '../api/format';

export function LandingPage() {
  const navigate = useNavigate();

  const { data: gainers } = useQuery({
    queryKey: ['gainers'],
    queryFn: () => getGainersLosers('gainers'),
    staleTime: 2 * 60000,
  });

  const { data: losers } = useQuery({
    queryKey: ['losers'],
    queryFn: () => getGainersLosers('losers'),
    staleTime: 2 * 60000,
  });

  const { data: marketStatus } = useQuery({
    queryKey: ['market-status'],
    queryFn: getMarketStatus,
    staleTime: 60000,
  });

  const { data: news } = useQuery({
    queryKey: ['market-news'],
    queryFn: () => getMarketNews(4),
    staleTime: 5 * 60000,
  });

  const isOpen = (marketStatus as any)?.exchanges?.nasdaq === 'open';

  return (
    <div style={page}>
      {/* Nav */}
      <nav style={nav}>
        <div style={navInner}>
          <div style={logoGroup}>
            <span style={logoMark}>S</span>
            <span style={logoText}>Surlamer</span>
            <span style={logoSub}>Research</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {marketStatus && (
              <div style={statusPill(isOpen)}>
                <span style={statusDot(isOpen)} />
                {isOpen ? 'Market Open' : 'Market Closed'}
              </div>
            )}
            <button style={launchBtn} onClick={() => navigate('/workbench')}>
              Open Workbench <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={hero}>
        <div style={heroInner}>
          <div style={eyebrow}>Equity Research Platform</div>
          <h1 style={headline}>
            Where conviction<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>meets clarity.</em>
          </h1>
          <p style={subhead}>
            A research workbench for serious equity analysis. Browse markets, 
            track positions, and build conviction with live data from major US exchanges.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <button style={heroCta} onClick={() => navigate('/workbench')}>
              Launch Workbench <ArrowRight size={16} />
            </button>
            <button style={heroSecondary} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn more
            </button>
          </div>
        </div>

        {/* Live tickers marquee */}
        {gainers && gainers.length > 0 && (
          <div style={ticker}>
            <div style={tickerInner}>
              {[...gainers.slice(0, 10), ...(losers?.slice(0, 10) ?? [])].map(s => {
                const price = s.day?.c || s.lastTrade?.p;
                return (
                  <span key={s.ticker + Math.random()} style={tickerItem}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{s.ticker}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{fmtPrice(price)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: changeColor(s.todaysChangePerc), background: changeBg(s.todaysChangePerc), padding: '1px 5px', borderRadius: 3 }}>
                      {fmtPct(s.todaysChangePerc)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Movers */}
      <section style={section}>
        <div style={container}>
          <div style={sectionHead}>
            <div style={sectionTitle}>Today's Movers</div>
            <div style={sectionSub}>Live market data · refreshed every 2 minutes</div>
          </div>
          <div style={moversGrid}>
            <div>
              <div style={moversHeader(true)}><TrendingUp size={14} /> Top Gainers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {gainers?.slice(0, 5).map(s => (
                  <MoverRow key={s.ticker} snapshot={s} />
                )) ?? <Skeleton rows={5} />}
              </div>
            </div>
            <div>
              <div style={moversHeader(false)}><TrendingDown size={14} /> Top Losers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {losers?.slice(0, 5).map(s => (
                  <MoverRow key={s.ticker} snapshot={s} />
                )) ?? <Skeleton rows={5} />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ ...section, background: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={container}>
          <div style={sectionHead}>
            <div style={sectionTitle}>Built for Research</div>
            <div style={sectionSub}>Everything you need to do thorough equity research</div>
          </div>
          <div style={featGrid}>
            {[
              { icon: <BarChart2 size={20} />, title: 'Live Market Data', desc: 'Real-time prices, OHLCV data, and 90-day chart history sourced from all 19 major US exchanges.' },
              { icon: <BookOpen size={20} />, title: 'Portfolio Tracking', desc: 'Add tickers to your research portfolio with persistent notes. State survives page reloads.' },
              { icon: <Activity size={20} />, title: 'Company Deep Dives', desc: 'Market cap, employee count, sector classification, description, and recent news in one panel.' },
              { icon: <Shield size={20} />, title: 'Always-On Research', desc: 'Your portfolio and notes are saved locally. Return to your research exactly where you left off.' },
            ].map(f => (
              <div key={f.title} style={featCard}>
                <div style={featIcon}>{f.icon}</div>
                <div style={featTitle}>{f.title}</div>
                <div style={featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      {news && news.length > 0 && (
        <section style={section}>
          <div style={container}>
            <div style={sectionHead}>
              <div style={sectionTitle}>Market News</div>
            </div>
            <div style={newsGrid}>
              {news.map(item => (
                <a key={item.id} href={item.article_url} target="_blank" rel="noreferrer" style={newsCard}>
                  {item.image_url && <div style={newsImg(item.image_url)} />}
                  <div style={newsBody}>
                    <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 500, marginBottom: 6 }}>{item.publisher.name}</div>
                    <div style={newsTitle}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>{timeAgo(item.published_utc)}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ ...section, textAlign: 'center' as const, padding: '80px 24px' }}>
        <div style={{ ...container, maxWidth: 560 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
            Start your research now
          </h2>
          <p style={{ color: 'var(--text-3)', marginBottom: 28, fontSize: 15 }}>
            Browse equities, build your watchlist, and make better investment decisions.
          </p>
          <button style={heroCta} onClick={() => navigate('/workbench')}>
            Open Workbench <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={footer}>
        <div style={container}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={logoMark}>S</span>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-3)', fontSize: 13 }}>Surlamer Research · Equity Workbench</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Market data via Massive.com · For research purposes only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MoverRow({ snapshot }: { snapshot: any }) {
  const price = snapshot.day?.c || snapshot.lastTrade?.p;
  return (
    <div style={moverRow}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 13, color: 'var(--text)', minWidth: 64 }}>{snapshot.ticker}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{fmtPrice(price)}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(snapshot.todaysChangePerc), background: changeBg(snapshot.todaysChangePerc), padding: '2px 7px', borderRadius: 4 }}>
        {fmtPct(snapshot.todaysChangePerc)}
      </span>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return <>{[...Array(rows)].map((_, i) => <div key={i} className="skeleton" style={{ height: 38, borderRadius: 6, marginBottom: 1 }} />)}</>;
}

// Styles
const page: React.CSSProperties = { minHeight: '100vh', background: 'var(--surface)' };
const nav: React.CSSProperties = { borderBottom: '1px solid var(--border)', background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 };
const navInner: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const logoGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const logoMark: React.CSSProperties = { width: 28, height: 28, background: 'var(--gold)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-serif)' };
const logoText: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--text)' };
const logoSub: React.CSSProperties = { fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: -2 };
const launchBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13 };
const hero: React.CSSProperties = { padding: '80px 24px 0', maxWidth: 1200, margin: '0 auto' };
const heroInner: React.CSSProperties = { maxWidth: 640, paddingBottom: 60 };
const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: 16 };
const headline: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 56, fontWeight: 700, lineHeight: 1.15, color: 'var(--text)', marginBottom: 20 };
const subhead: React.CSSProperties = { fontSize: 16, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 500, marginBottom: 32 };
const heroCta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14 };
const heroSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid var(--border-2)', color: 'var(--text-2)', padding: '12px 20px', borderRadius: 10, fontSize: 14 };
const ticker: React.CSSProperties = { borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden', position: 'relative', margin: '0 -24px' };
const tickerInner: React.CSSProperties = { display: 'flex', gap: 32, padding: '10px 24px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' };
const tickerItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 12 };
const section: React.CSSProperties = { padding: '64px 24px' };
const container: React.CSSProperties = { maxWidth: 1200, margin: '0 auto' };
const sectionHead: React.CSSProperties = { marginBottom: 28 };
const sectionTitle: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 };
const sectionSub: React.CSSProperties = { fontSize: 13, color: 'var(--text-3)' };
const moversGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 };
const moversHeader = (up: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: up ? 'var(--green)' : 'var(--red)', marginBottom: 8, padding: '0 12px' });
const moverRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, transition: 'background 0.15s' };
const featGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 };
const featCard: React.CSSProperties = { background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 };
const featIcon: React.CSSProperties = { color: 'var(--gold)', marginBottom: 12 };
const featTitle: React.CSSProperties = { fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 };
const featDesc: React.CSSProperties = { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 };
const newsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 };
const newsCard: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'block', transition: 'border-color 0.15s' };
const newsImg = (url: string): React.CSSProperties => ({ height: 140, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' });
const newsBody: React.CSSProperties = { padding: '12px 14px' };
const newsTitle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5 };
const footer: React.CSSProperties = { borderTop: '1px solid var(--border)', padding: '20px 24px', background: 'var(--surface-2)' };

function statusPill(open: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: open ? 'var(--green)' : 'var(--text-3)', background: open ? 'var(--green-dim)' : 'var(--surface-3)', border: `1px solid ${open ? 'rgba(63,185,80,0.3)' : 'var(--border)'}`, padding: '4px 10px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.04em' };
}

function statusDot(open: boolean): React.CSSProperties {
  return { width: 6, height: 6, borderRadius: '50%', background: open ? 'var(--green)' : 'var(--text-3)', animation: open ? 'pulse 2s infinite' : 'none' };
}
