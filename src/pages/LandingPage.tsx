/**
 * pages/LandingPage.tsx
 * Marketing / overview page.
 * Semantic elements: <header>, <nav>, <main>, <section>, <article>, <footer>,
 * <figure>, <time>, <address>.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, BarChart2, BookOpen, Shield, Activity } from 'lucide-react';
import { useGainersLosers, useMarketStatus, useMarketNews } from '../hooks/useMarketData';
import { extractPrice } from '../services/market';
import { fmtPrice, fmtPct, changeColor, changeBg, timeAgo } from '../api/format';
import { ErrorBoundary } from '../error/ErrorBoundary';
import surlamerLogo from '../assets/surlamer-logo.svg';

export function LandingPage() {
  const navigate = useNavigate();

  const { data: gainers } = useGainersLosers('gainers');
  const { data: losers } = useGainersLosers('losers');
  const { data: marketStatus } = useMarketStatus();
  const { data: news } = useMarketNews(4);

  const isOpen = (marketStatus as { exchanges?: Record<string, string> })?.exchanges?.nasdaq === 'open';

  return (
    <div style={page}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header style={navBar}>
        <nav style={navInner} aria-label="Site navigation">
          <a href="/" style={logoGroup} aria-label="Surlamer Research home">
            <img src={surlamerLogo} alt="" aria-hidden style={logoMark} />
            <span style={logoText}>Surlamer</span>
            <span style={logoText}>Investments</span>
            <span style={logoSub}>Equity Research</span>
          </a>

          <menu style={{ display: 'flex', alignItems: 'center', gap: 16, margin: 0, padding: 0, listStyle: 'none' }}>
            {marketStatus && (
              <li>
                <span style={statusPill(isOpen)} role="status" aria-live="polite">
                  <span style={statusDot(isOpen)} aria-hidden />
                  {isOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </li>
            )}
            <li>
              <button style={launchBtn} onClick={() => navigate('/workbench')}>
                Open Workbench <ArrowRight size={14} aria-hidden />
              </button>
            </li>
          </menu>
        </nav>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section style={hero} aria-label="Introduction">
          <div style={heroInner}>
            <p style={eyebrow}>Equity Research Platform</p>
            <h1 style={headline}>
              Where conviction<br />
              <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>meets clarity.</em>
            </h1>
            <p style={subhead}>
              A research workbench for serious equity analysis. Browse markets,
              track positions, and build conviction with live data from major US exchanges.
            </p>
            <menu style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: 0, padding: 0, listStyle: 'none' }}>
              <li>
                <button style={heroCta} onClick={() => navigate('/workbench')}>
                  Launch Workbench <ArrowRight size={16} aria-hidden />
                </button>
              </li>
              <li>
                <button
                  style={heroSecondary}
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn more
                </button>
              </li>
            </menu>
          </div>

          {/* Live ticker marquee */}
          {gainers && gainers.length > 0 && (
            <div style={tickerBand} aria-label="Live market ticker" role="marquee">
              <ul style={tickerInner}>
                {[...gainers.slice(0, 10), ...(losers?.slice(0, 10) ?? [])].map((s) => {
                  const price = extractPrice(s);
                  return (
                    <li key={s.ticker + Math.random()} style={tickerItem}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{s.ticker}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{fmtPrice(price)}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: changeColor(s.todaysChangePerc), background: changeBg(s.todaysChangePerc), padding: '1px 5px', borderRadius: 3 }}>
                        {fmtPct(s.todaysChangePerc)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* ── Movers ────────────────────────────────────────────────── */}
        <section style={sectionStyle} aria-labelledby="movers-heading">
          <div style={container}>
            <hgroup style={sectionHead}>
              <h2 id="movers-heading" style={sectionTitleLightBG}>Today's Movers</h2>
              <p style={sectionSub}>Live market data · refreshed every 2 minutes</p>
            </hgroup>
            <ErrorBoundary>
              <div style={moversGrid}>
                <section aria-label="Top gainers">
                  <p style={moversHeader(true)}><TrendingUp size={14} aria-hidden /> Top Gainers</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {gainers?.slice(0, 5).map((s) => <MoverRow key={s.ticker} snapshot={s} />) ?? <SkeletonRows rows={5} />}
                  </ul>
                </section>
                <section aria-label="Top losers">
                  <p style={moversHeader(false)}><TrendingDown size={14} aria-hidden /> Top Losers</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {losers?.slice(0, 5).map((s) => <MoverRow key={s.ticker} snapshot={s} />) ?? <SkeletonRows rows={5} />}
                  </ul>
                </section>
              </div>
            </ErrorBoundary>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <section
          id="features"
          style={{ ...sectionStyle, background: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
          aria-labelledby="features-heading"
        >
          <div style={container}>
            <hgroup style={sectionHead}>
              <h2 id="features-heading" style={sectionTitleDarkBG}>Built for Research</h2>
              <p style={sectionSub}>Everything you need to do thorough equity research</p>
            </hgroup>
            <ul style={{ ...featGrid, listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: <BarChart2 size={20} />, title: 'Live Market Data', desc: 'Real-time prices, OHLCV data, and 90-day chart history sourced from all 19 major US exchanges.' },
                { icon: <BookOpen size={20} />, title: 'Portfolio Tracking', desc: 'Add tickers to your research portfolio with persistent notes. State survives page reloads.' },
                { icon: <Activity size={20} />, title: 'Company Deep Dives', desc: 'Market cap, employee count, sector classification, description, and recent news in one panel.' },
                { icon: <Shield size={20} />, title: 'Always-On Research', desc: 'Your portfolio and notes are saved locally. Return to your research exactly where you left off.' },
              ].map((f) => (
                <li key={f.title} style={featCard}>
                  <span style={featIcon} aria-hidden>{f.icon}</span>
                  <h3 style={featTitle}>{f.title}</h3>
                  <p style={featDesc}>{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── News ──────────────────────────────────────────────────── */}
        {news && news.length > 0 && (
          <section style={sectionStyle} aria-labelledby="news-heading">
            <div style={container}>
              <hgroup style={sectionHead}>
                <h2 id="news-heading" style={sectionTitleLightBG}>Market News</h2>
              </hgroup>
              <ul style={{ ...newsGrid, listStyle: 'none', padding: 0, margin: 0 }}>
                {news.map((item) => (
                  <li key={item.id}>
                    <article>
                      <a href={item.article_url} target="_blank" rel="noreferrer" style={newsCard}>
                        {item.image_url && (
                          <figure style={{ margin: 0 }}>
                            <img
                              src={item.image_url}
                              alt=""
                              aria-hidden
                              style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                            />
                          </figure>
                        )}
                        <div style={newsBody}>
                          <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 500, marginBottom: 6, marginTop: 0 }}>
                            {item.publisher.name}
                          </p>
                          <h3 style={newsTitle}>{item.title}</h3>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, marginBottom: 0 }}>
                            <time dateTime={item.published_utc}>{timeAgo(item.published_utc)}</time>
                          </p>
                        </div>
                      </a>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <section style={{ ...sectionStyle, textAlign: 'center', padding: '80px 24px' }} aria-label="Call to action">
          <div style={{ ...container, maxWidth: 560 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
              Start your research now
            </h2>
            <p style={{ color: 'var(--text-3)', marginBottom: 28, fontSize: 15 }}>
              Browse equities, build your watchlist, and make better investment decisions.
            </p>
            <button style={heroCta} onClick={() => navigate('/workbench')}>
              Open Workbench <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={footerStyle}>
        <div style={container}>
          <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, margin: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={surlamerLogo} alt="" aria-hidden style={logoMark} />
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-3)', fontSize: 13 }}>
                Surlamer Research · Equity Workbench
              </span>
            </span>
            <small style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Market data via Massive.com · For research purposes only
            </small>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MoverRow({ snapshot }: { snapshot: ReturnType<typeof useGainersLosers>['data'] extends (infer T)[] | undefined ? T : never }) {
  if (!snapshot) return null;
  const price = extractPrice(snapshot);
  return (
    <li style={moverRow}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 13, color: 'var(--text)', minWidth: 64 }}>
        {snapshot.ticker}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', flex: 1 }}>
        {fmtPrice(price)}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(snapshot.todaysChangePerc), background: changeBg(snapshot.todaysChangePerc), padding: '2px 7px', borderRadius: 4 }}>
        {fmtPct(snapshot.todaysChangePerc)}
      </span>
    </li>
  );
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <li key={i} className="skeleton" style={{ height: 38, borderRadius: 6, marginBottom: 1 }} aria-hidden />
      ))}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = { minHeight: '100vh', background: 'var(--surface)' };
const navBar: React.CSSProperties = { borderBottom: '1px solid var(--border)', background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 };
const navInner: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const logoGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' };
const logoMark: React.CSSProperties = { width: 28, height: 28, objectFit: 'contain', display: 'block', borderRadius: 6, flexShrink: 0 };
const logoText: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--text)' };
const logoSub: React.CSSProperties = { fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: -2 };
const launchBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const hero: React.CSSProperties = { padding: '80px 24px 0', maxWidth: 1200, margin: '0 auto' };
const heroInner: React.CSSProperties = { maxWidth: 640, paddingBottom: 60 };
const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: 16, marginTop: 0 };
const headline: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 56, fontWeight: 700, lineHeight: 1.15, color: 'var(--text)', marginBottom: 20, marginTop: 0 };
const subhead: React.CSSProperties = { fontSize: 16, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 500, marginBottom: 32 };
const heroCta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' };
const heroSecondary: React.CSSProperties = { background: 'transparent', border: '1px solid var(--border-2)', color: 'var(--text-2)', padding: '12px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer' };
const tickerBand: React.CSSProperties = { borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden', position: 'relative', margin: '0 -24px' };
const tickerInner: React.CSSProperties = { display: 'flex', gap: 32, padding: '10px 24px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none', listStyle: 'none', margin: 0 };
const tickerItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 12 };
const sectionStyle: React.CSSProperties = { padding: '64px 24px' };
const container: React.CSSProperties = { maxWidth: 1200, margin: '0 auto' };
const sectionHead: React.CSSProperties = { marginBottom: 28 };
const sectionTitleLightBG: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4, marginTop: 0 };
const sectionTitleDarkBG: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--text-4)', marginBottom: 4, marginTop: 0 };
const sectionSub: React.CSSProperties = { fontSize: 13, color: 'var(--text-3)', margin: 0 };
const moversGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 };
const moversHeader = (up: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: up ? 'var(--green)' : 'var(--red)', marginBottom: 8, marginTop: 0, padding: '0 12px' });
const moverRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, transition: 'background 0.15s' };
const featGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 };
const featCard: React.CSSProperties = { background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 };
const featIcon: React.CSSProperties = { color: 'var(--gold)', marginBottom: 12, display: 'block' };
const featTitle: React.CSSProperties = { fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6, marginTop: 0 };
const featDesc: React.CSSProperties = { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 };
const newsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 };
const newsCard: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'block', transition: 'border-color 0.15s' };
const newsBody: React.CSSProperties = { padding: '12px 14px' };
const newsTitle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, marginTop: 0, marginBottom: 0 };
const footerStyle: React.CSSProperties = { borderTop: '1px solid var(--border)', padding: '20px 24px', background: 'var(--surface-2)' };

function statusPill(open: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: open ? 'var(--green)' : 'var(--text-3)', background: open ? 'var(--green-dim)' : 'var(--surface-3)', border: `1px solid ${open ? 'rgba(63,185,80,0.3)' : 'var(--border)'}`, padding: '4px 10px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.04em' };
}

function statusDot(open: boolean): React.CSSProperties {
  return { width: 6, height: 6, borderRadius: '50%', background: open ? 'var(--green)' : 'var(--text-3)', animation: open ? 'pulse 2s infinite' : 'none', display: 'inline-block' };
}
