import { Plus, Check, TrendingUp, TrendingDown } from 'lucide-react';
import type { TickerSnapshot } from '../api/massive';
import { fmtPrice, fmtPct, fmtChange, fmtVolume, changeColor, changeBg } from '../api/format';
import { MiniChart } from './MiniChart';
import { useStore } from '../store/workbench';

interface Props {
  snapshot: TickerSnapshot;
  name?: string;
  onClick: () => void;
}

export function TickerCard({ snapshot, name, onClick }: Props) {
  const { addToPortfolio, removeFromPortfolio, isInPortfolio } = useStore();
  const inPortfolio = isInPortfolio(snapshot.ticker);
  const price = snapshot.day?.c || snapshot.lastTrade?.p || snapshot.prevDay?.c;
  const change = snapshot.todaysChangePerc;
  const isUp = change >= 0;

  const handlePortfolioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inPortfolio) {
      removeFromPortfolio(snapshot.ticker);
    } else {
      addToPortfolio(snapshot.ticker, name || snapshot.ticker);
    }
  };

  return (
    <div onClick={onClick} style={cardStyle}>
      <div style={headerRow}>
        <div>
          <div style={tickerLabel}>{snapshot.ticker}</div>
          {name && <div style={nameLabel}>{name}</div>}
        </div>
        <button onClick={handlePortfolioClick} style={portfolioBtn(inPortfolio)} title={inPortfolio ? 'Remove from portfolio' : 'Add to portfolio'}>
          {inPortfolio ? <Check size={13} /> : <Plus size={13} />}
        </button>
      </div>

      <div style={priceRow}>
        <span style={priceText}>{fmtPrice(price)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontFamily: 'var(--font-mono)', color: changeColor(change), background: changeBg(change), padding: '2px 6px', borderRadius: 4 }}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {fmtPct(change)}
        </span>
      </div>

      <div style={chartWrap}>
        <MiniChart ticker={snapshot.ticker} change={change} width={160} height={36} />
      </div>

      <div style={metaRow}>
        <span style={metaItem}>
          <span style={metaLabel}>CHNG</span>
          <span style={{ color: changeColor(change), fontFamily: 'var(--font-mono)', fontSize: 11 }}>{fmtChange(snapshot.todaysChange)}</span>
        </span>
        <span style={metaItem}>
          <span style={metaLabel}>VOL</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>{fmtVolume(snapshot.day?.v)}</span>
        </span>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '14px 16px',
  cursor: 'pointer',
  transition: 'border-color 0.18s, background 0.18s',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headerRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const tickerLabel: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 14, color: 'var(--text)', letterSpacing: '0.03em' };
const nameLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 };
const priceRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const priceText: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--text)' };
const chartWrap: React.CSSProperties = { margin: '0 -4px' };
const metaRow: React.CSSProperties = { display: 'flex', gap: 12 };
const metaItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 1 };
const metaLabel: React.CSSProperties = { fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase' as const };

function portfolioBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--gold-dim)' : 'var(--surface-3)',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    color: active ? 'var(--gold)' : 'var(--text-3)',
    borderRadius: 6,
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  };
}
