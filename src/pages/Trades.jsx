import { useState, useEffect } from 'react';
import { tradeService } from '../services/services';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

function SummaryCard({ label, value, color, sub }) {
  return (
    <div className={`stat-card ${color || 'blue'}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${color === 'green' ? 'up' : color === 'red' ? 'down' : 'neutral'}`}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: payload[0].value >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
        ₹{payload[0].value?.toFixed(2)}
      </div>
    </div>
  );
};

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tradeService.list(), tradeService.summary()])
      .then(([tRes, sRes]) => { setTrades(tRes.data); setSummary(sRes.data); })
      .finally(() => setLoading(false));
  }, []);

  // Build cumulative P&L chart data
  const chartData = trades
    .filter(t => t.pnl !== null)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time))
    .reduce((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].cumPnl : 0;
      acc.push({
        date: format(new Date(t.entry_time), 'dd MMM'),
        pnl: t.pnl,
        cumPnl: prev + t.pnl,
      });
      return acc;
    }, []);

  const pnl = summary?.total_pnl ?? 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trade Log</h1>
          <p className="page-subtitle">Your complete trading history and performance analytics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <SummaryCard label="Total P&L" value={`₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color={pnl >= 0 ? 'green' : 'red'} sub="All time" />
        <SummaryCard label="Win Rate" value={`${summary?.win_rate ?? 0}%`} color="purple" sub={`${summary?.closed_trades ?? 0} closed`} />
        <SummaryCard label="Avg P&L" value={`₹${(summary?.avg_pnl ?? 0).toFixed(2)}`} color="blue" sub="Per trade" />
        <SummaryCard label="Open Trades" value={summary?.open_trades ?? 0} color="yellow" sub="In progress" />
      </div>

      {/* P&L Chart */}
      {chartData.length > 1 && (
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Cumulative P&amp;L</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumPnl" stroke="var(--accent-green)" fill="url(#pnlGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trades table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Symbol</th><th>Side</th><th>Qty</th><th>Entry</th><th>Exit</th>
                <th>P&amp;L</th><th>P&amp;L %</th><th>Mode</th><th>Strategy</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : trades.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No trades yet</td></tr>
              ) : trades.map(t => (
                <tr key={t.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{t.symbol}</td>
                  <td><span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.side}</span></td>
                  <td className="mono">{t.quantity}</td>
                  <td className="mono">₹{t.entry_price?.toFixed(2)}</td>
                  <td className="mono">{t.exit_price ? `₹${t.exit_price.toFixed(2)}` : <span className="badge badge-yellow">Open</span>}</td>
                  <td className={`mono ${(t.pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {t.pnl !== null ? `₹${t.pnl.toFixed(2)}` : '—'}
                  </td>
                  <td className={`mono ${(t.pnl_pct ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {t.pnl_pct !== null ? `${t.pnl_pct.toFixed(2)}%` : '—'}
                  </td>
                  <td><span className={`badge ${t.is_paper ? 'badge-yellow' : 'badge-blue'}`}>{t.is_paper ? 'Paper' : 'Live'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>{t.strategy_id ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                    {format(new Date(t.entry_time), 'dd MMM HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
