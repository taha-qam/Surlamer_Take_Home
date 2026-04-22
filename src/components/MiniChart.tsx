import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { getAggregates } from '../api/massive';
import type { AggBar } from '../api/massive';
import { subDays, fmtPrice } from '../api/format';

interface Props {
  ticker: string;
  change: number;
  width?: number;
  height?: number;
}

export function MiniChart({ ticker, change, width = 100, height = 38 }: Props) {
  const color = change >= 0 ? '#3fb950' : '#f85149';
  const today = new Date().toISOString().split('T')[0];
  const from = subDays(new Date(), 30);

  const { data, isLoading } = useQuery<AggBar[]>({
    queryKey: ['agg', ticker, '30d'],
    queryFn: () => getAggregates(ticker, from, today, 'day'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data?.length) {
    return <div style={{ width, height, borderRadius: 4 }} className="skeleton" />;
  }

  const chartData = data.map(b => ({ v: b.c }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}
          itemStyle={{ color: 'var(--text-2)' }}
          formatter={(v) => [fmtPrice(v as number), '']}
          labelFormatter={() => ''}
        />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#grad-${ticker})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
