import { useState, useEffect, useRef } from 'react';
import { marketService } from '../services/services';
import { Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';


const PRESETS = [
  { label: 'NIFTY 50',   symbol: 'NSE:NIFTY50-INDEX' },
  { label: 'BANK NIFTY', symbol: 'NSE:NIFTYBANK-INDEX' },
  { label: 'RELIANCE',   symbol: 'NSE:RELIANCE-EQ' },
  { label: 'TCS',        symbol: 'NSE:TCS-EQ' },
  { label: 'INFY',       symbol: 'NSE:INFY-EQ' },
  { label: 'SBIN',       symbol: 'NSE:SBIN-EQ' },
];

const RESOLUTIONS = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];

/* ── EMA calculation ── */
function computeEMA(candles, period = 10) {
  if (candles.length < period) return [];
  const k      = 2 / (period + 1);
  const result = [];
  // Seed with SMA of first `period` bars
  let ema = candles.slice(0, period).reduce((s, c) => s + c[4], 0) / period;
  result.push({ time: candles[period - 1][0], value: parseFloat(ema.toFixed(2)) });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i][4] * k + ema * (1 - k);
    result.push({ time: candles[i][0], value: parseFloat(ema.toFixed(2)) });
  }
  return result;
}

/* ── Candlestick + Volume + EMA 10 chart ── */
function CandlestickChart({ candles }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 440,
      layout: {
        background: { color: '#0d1117' },
        textColor:  '#8b949e',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        textColor:   '#8b949e',
      },
      timeScale: {
        borderColor:    'rgba(255,255,255,0.08)',
        textColor:      '#8b949e',
        timeVisible:    true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    /* ── Candlestick series ── */
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:         '#00d084',
      downColor:       '#ff4560',
      borderUpColor:   '#00d084',
      borderDownColor: '#ff4560',
      wickUpColor:     '#00d084',
      wickDownColor:   '#ff4560',
    });

    /* ── Volume histogram (occupies bottom 20% of price pane) ── */
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat:  { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    /* ── EMA 10 line overlay ── */
    const emaSeries = chart.addSeries(LineSeries, {
      color:       '#f5c518',   // golden yellow — stands out on dark bg
      lineWidth:   2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      title: 'EMA 10',
    });

    /* ── Map Fyers data ── */
    const ohlcData = candles.map(c => ({
      time: c[0], open: c[1], high: c[2], low: c[3], close: c[4],
    }));
    const volData = candles.map(c => ({
      time: c[0], value: c[5],
      color: c[4] >= c[1] ? 'rgba(0,208,132,0.25)' : 'rgba(255,69,96,0.25)',
    }));
    const emaData = computeEMA(candles, 10);

    candleSeries.setData(ohlcData);
    volumeSeries.setData(volData);
    emaSeries.setData(emaData);
    chart.timeScale().fitContent();

    /* ── Responsive resize ── */
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
    />
  );
}


/* ── Main Market page ── */
export default function Market() {
  const [symbol, setSymbol]     = useState('NSE:NIFTY50-INDEX');
  const [resolution, setRes]    = useState('D');
  const [rangeFrom, setFrom]    = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [rangeTo, setTo]        = useState(() => new Date().toISOString().split('T')[0]);
  const [candles, setCandles]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError]       = useState('');
  const [quote, setQuote]       = useState(null);
  const [stats, setStats]       = useState(null);
  const [weeklyTurnover, setWeeklyTurnover] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);

  // Default date ranges per resolution
  const DEFAULT_RANGES = {
    '1':  3,    // months
    '5':  3,
    '15': 3,
    '30': 6,
    '60': 6,
    'D':  3,
    'W':  36,   // 3 years in months
    'M':  240,  // 20 years in months (back to 2005)
  };

  const handleResolutionChange = (r) => {
    setRes(r);
    setCandles([]);
    setStats(null);
    const today = new Date();
    const months = DEFAULT_RANGES[r] ?? 3;
    const from = new Date(today);
    from.setMonth(from.getMonth() - months);
    // For Monthly: Fyers data available from ~2010
    if (r === 'M') {
      setFrom('2010-01-01');
    } else {
      setFrom(from.toISOString().split('T')[0]);
    }
    setTo(today.toISOString().split('T')[0]);
  };

  // Use full/paginated endpoint when: W or M resolution OR range > 1 year
  const needsFullFetch = () => {
    const days = (new Date(rangeTo) - new Date(rangeFrom)) / (1000 * 60 * 60 * 24);
    return ['W', 'M'].includes(resolution) || days > 365;
  };

  const fetchHistory = async () => {
    fetchQuote(); // Automatically fetch live quote to show turnover
    fetchWeeklyTurnover(); // Fetch the weekly turnover
    fetchFundamentals(); // Fetch fundamental data
    setLoading(true); setError(''); setCandles([]);

    const isLong = needsFullFetch();
    if (isLong) {
      setLoadingMsg(`Fetching ${resolution === 'M' ? 'monthly' : resolution === 'W' ? 'weekly' : 'daily'} data in chunks — this may take a few seconds…`);
    } else {
      setLoadingMsg('');
    }

    try {
      let raw;
      if (isLong) {
        const res = await marketService.getFullHistory({
          symbol, resolution,
          range_from: rangeFrom,
          range_to:   rangeTo,
        });
        raw = res.data?.candles || [];
        // Log any chunk warnings (e.g. old data not available in Fyers)
        if (res.data?.warnings?.length) {
          console.warn('[Market] Chunk warnings:', res.data.warnings);
        }
      } else {
        const res = await marketService.getHistory({
          symbol, resolution, date_format: 0,
          range_from: Math.floor(new Date(rangeFrom).getTime() / 1000),
          range_to:   Math.floor(new Date(rangeTo).getTime()   / 1000),
        });
        raw = res.data?.candles || [];
      }

      if (raw.length === 0) { setError('No candle data returned for this range.'); return; }
      setCandles(raw);

      const first = raw[0][1];
      const last  = raw[raw.length - 1][4];
      const high  = Math.max(...raw.map(c => c[2]));
      const low   = Math.min(...raw.map(c => c[3]));
      const chg   = ((last - first) / first) * 100;
      setStats({ first, last, high, low, chg, count: raw.length });
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to fetch data. Ensure Fyers is connected.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const fetchQuote = async () => {
    try {
      const res = await marketService.getQuote(symbol);
      setQuote(res.data?.d?.[0]?.v || null);
    } catch {}
  };

  const fetchWeeklyTurnover = async () => {
    try {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 10); // Look back 10 days to guarantee 5 trading days

      const res = await marketService.getHistory({
        symbol,
        resolution: 'D',
        date_format: 0,
        range_from: Math.floor(past.getTime() / 1000),
        range_to: Math.floor(today.getTime() / 1000),
      });

      const historicalCandles = res.data?.candles || [];
      const last5 = historicalCandles.slice(-5); // Get last 5 trading days
      const turnover = last5.reduce((acc, c) => acc + (c[4] * c[5]), 0); // Close * Volume
      setWeeklyTurnover(turnover);
    } catch {
      setWeeklyTurnover(null);
    }
  };

  const fetchFundamentals = async () => {
    try {
      const res = await marketService.getFundamentals(symbol);
      setFundamentals(res.data?.fundamentals || null);
    } catch {
      setFundamentals(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Market</h1>
          <p className="page-subtitle">Professional candlestick charts with volume</p>
        </div>
      </div>

      {/* Preset chips */}
      <div className="flex gap-1" style={{ flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {PRESETS.map(p => (
          <button
            key={p.symbol}
            onClick={() => setSymbol(p.symbol)}
            className="btn btn-ghost btn-sm"
            style={{
              borderColor: symbol === p.symbol ? 'var(--accent-blue)' : '',
              color:       symbol === p.symbol ? 'var(--accent-blue)' : '',
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '2 1 220px' }}>
            <label className="form-label">Symbol</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" value={symbol} onChange={e => setSymbol(e.target.value)} style={{ paddingLeft: '2rem' }} />
            </div>
          </div>
          <div className="form-group" style={{ flex: '0 1 140px' }}>
            <label className="form-label">Resolution</label>
            <select
              className="form-input form-select"
              value={resolution}
              onChange={e => handleResolutionChange(e.target.value)}
            >
              {RESOLUTIONS.map(r => (
                <option key={r} value={r}>
                  {r === 'D' ? 'D — Daily'
                    : r === 'W' ? 'W — Weekly'
                    : r === 'M' ? 'M — Monthly'
                    : `${r} min`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={rangeFrom} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={rangeTo} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="flex gap-1" style={{ paddingBottom: '0.05rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchQuote} title="Refresh live quote">
              <RefreshCw size={14} />
            </button>
            <button className="btn btn-primary" onClick={fetchHistory} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Chart'}
            </button>
          </div>
        </div>

        {/* Live Quote strip */}
        {quote && (
          <div className="flex gap-2" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'LTP',    val: `₹${quote.lp?.toFixed(2)}`,                                                   color: 'var(--text-primary)' },
              { label: 'Change', val: `${quote.ch >= 0 ? '+' : ''}${quote.ch?.toFixed(2)} (${quote.chp?.toFixed(2)}%)`, color: quote.ch >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
              { label: 'Open',   val: `₹${quote.open_price?.toFixed(2)}` },
              { label: 'High',   val: `₹${quote.high_price?.toFixed(2)}`, color: 'var(--accent-green)' },
              { label: 'Low',    val: `₹${quote.low_price?.toFixed(2)}`,  color: 'var(--accent-red)' },
              { label: 'Vol',    val: quote.volume?.toLocaleString() },
              { label: 'Turnover', val: quote.ttv || (quote.volume && quote.lp) ? `₹${((quote.ttv || (quote.volume * quote.lp)) / 10000000).toFixed(2)} Cr` : 'N/A', color: 'var(--accent-blue)' },
              { label: 'Weekly Turnover', val: weeklyTurnover ? `₹${(weeklyTurnover / 10000000).toFixed(2)} Cr` : 'N/A', color: 'var(--accent-purple)' },
            ].map(item => (
              <div key={item.label} style={{ padding: '0.45rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: item.color || 'var(--text-secondary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chunked fetch progress banner */}
      {loading && loadingMsg && (
        <div style={{
          padding: '0.85rem 1.25rem', marginBottom: '1rem',
          background: 'rgba(56, 139, 253, 0.1)',
          border: '1px solid rgba(56, 139, 253, 0.3)',
          borderRadius: 10, fontSize: '0.875rem',
          color: 'var(--accent-blue)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
            border: '2px solid var(--accent-blue)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite' }} />
          {loadingMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', background: 'var(--accent-red-dim)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Chart */}
      {candles.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Chart header */}
          <div className="flex items-center justify-between" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{symbol}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {stats?.count} candles · {resolution === 'D' ? 'Daily' : resolution === 'W' ? 'Weekly' : resolution === 'M' ? 'Monthly' : `${resolution}m`}
                </span>
                {/* Indicator legend */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: '#00d084' }}>
                  <span style={{ width: 10, height: 10, background: '#00d084', borderRadius: 2, display: 'inline-block' }} /> Vol
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: '#f5c518' }}>
                  <span style={{ width: 16, height: 2, background: '#f5c518', display: 'inline-block', borderRadius: 1 }} /> EMA 10
                </span>
              </div>
            </div>

            {stats && (
              <div className="flex gap-3" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {[
                  { label: 'Open',  val: `₹${stats.first.toFixed(2)}` },
                  { label: 'High',  val: `₹${stats.high.toFixed(2)}`,  color: 'var(--accent-green)' },
                  { label: 'Low',   val: `₹${stats.low.toFixed(2)}`,   color: 'var(--accent-red)' },
                  { label: 'Close', val: `₹${stats.last.toFixed(2)}`,  color: stats.chg >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: s.color || 'var(--text-secondary)' }}>{s.val}</div>
                  </div>
                ))}
                <div style={{ textAlign: 'right', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Change</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: stats.chg >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {stats.chg >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                    {stats.chg >= 0 ? '+' : ''}{stats.chg.toFixed(2)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TradingView Candlestick Chart */}
          <CandlestickChart candles={candles} />

          {/* Fundamentals Data */}
          {fundamentals && (
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-blue)' }}>📊</span> {fundamentals.shortName} Fundamentals
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Market Cap', val: fundamentals.marketCap ? `₹${(fundamentals.marketCap / 10000000).toFixed(2)} Cr` : 'N/A' },
                  { label: 'P/E (Trailing)', val: fundamentals.trailingPE ? fundamentals.trailingPE.toFixed(2) : 'N/A' },
                  { label: 'P/E (Forward)', val: fundamentals.forwardPE ? fundamentals.forwardPE.toFixed(2) : 'N/A' },
                  { label: 'P/B Ratio', val: fundamentals.priceToBook ? fundamentals.priceToBook.toFixed(2) : 'N/A' },
                  { label: 'EPS (TTM)', val: fundamentals.trailingEps ? `₹${fundamentals.trailingEps.toFixed(2)}` : 'N/A' },
                  { label: 'Div Yield', val: fundamentals.dividendYield ? `${(fundamentals.dividendYield * 100).toFixed(2)}%` : 'N/A' },
                  { label: '52W High', val: fundamentals.fiftyTwoWeekHigh ? `₹${fundamentals.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A', color: 'var(--accent-green)' },
                  { label: '52W Low', val: fundamentals.fiftyTwoWeekLow ? `₹${fundamentals.fiftyTwoWeekLow.toFixed(2)}` : 'N/A', color: 'var(--accent-red)' },
                  { label: 'Sector', val: fundamentals.sector },
                  { label: 'Industry', val: fundamentals.industry },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: item.color || 'var(--text-primary)' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {candles.length === 0 && !loading && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕯️</div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No chart data</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Select a symbol and resolution, then click <strong>Fetch Chart</strong> to view OHLCV candlesticks.
          </div>
        </div>
      )}
    </div>
  );
}
