import { useState, useEffect } from 'react';
import api from '../services/api';
import { watchlistService } from '../services/services';
import {
  TrendingUp, TrendingDown, Play, RefreshCw, Filter,
  BarChart2, AlertCircle, CheckCircle, Search, Layout,
  Sparkles, ChevronDown, ChevronUp, Zap, Code2, Plus, Trash2, Settings
} from 'lucide-react';

const DEFAULT_THRESHOLD = 60;

const AI_EXAMPLES = [
  "Stocks where weekly RSI is below 30 and volume is more than 1.5× the previous week",
  "Find stocks making a new 4-week high with rising volume",
  "Weekly close above EMA 20 and EMA 20 crossed above EMA 50",
  "Bollinger band squeeze — weekly range less than 2% of price",
  "RSI above 60 and current close greater than previous close with strong volume",
  "Stocks near their 20-week low with a bullish candle (close > open)",
];

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      padding: '0.6rem 1.1rem',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      textAlign: 'center',
      minWidth: 90,
    }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}

// ── AI Screener Panel ──────────────────────────────────────────────────────────
function AIScreenerPanel({ watchlists = [] }) {
  const [query, setQuery]             = useState('');
  const [aiCustomSymbols, setAiCustomSymbols] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [results, setResults]         = useState(null);
  const [elapsed, setElapsed]         = useState(null);
  const [showCode, setShowCode]       = useState(true);
  const [showSkipped, setShowSkipped] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const runAI = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults(null); setElapsed(null);
    const t0 = Date.now();
    try {
      const body = { query: query.trim() };
      if (aiCustomSymbols.trim()) body.symbols = aiCustomSymbols.trim();
      const res = await api.post('/api/screener/ai', body, { timeout: 300000 });
      setResults(res.data);
      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'AI screener failed. Check your Gemini API key and Fyers connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runAI(); };

  return (
    <div>
      {/* Prompt card */}
      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI-Powered Screener</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Google Gemini · Describe any screener in plain English</div>
          </div>
        </div>

        {/* Query textarea */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="form-label">Your Screener Query</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="e.g. Find stocks where weekly RSI is below 30 and volume is more than 1.5× the previous week"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            style={{ resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Press <kbd style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 4px', fontFamily: 'var(--font-mono)' }}>⌘ Enter</kbd> to run
          </div>
        </div>

        {/* Examples toggle */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: showExamples ? '0.75rem' : 0, fontSize: '0.78rem', color: 'var(--accent-purple)' }}
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showExamples ? 'Hide' : 'Show'} example queries
        </button>

        {showExamples && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {AI_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setQuery(ex); setShowExamples(false); }}
                style={{
                  fontSize: '0.75rem', padding: '0.3rem 0.7rem',
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 99, color: 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(168,85,247,0.18)'; e.target.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(168,85,247,0.08)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Universe + Run */}
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '0 1 180px' }}>
            <label className="form-label">Load Watchlist</label>
            <select
              className="form-input"
              onChange={e => {
                if (e.target.value === 'nifty50') setAiCustomSymbols('');
                else {
                  const wl = watchlists.find(w => w.id == e.target.value);
                  if (wl) setAiCustomSymbols(wl.symbols.map(s => `${s.exchange}:${s.symbol}`).join(', '));
                }
              }}
              defaultValue="nifty50"
            >
              <option value="nifty50">Nifty 50 (Default)</option>
              {watchlists.map(w => <option key={w.id} value={w.id}>{w.name} ({w.symbols.length})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '2 1 300px' }}>
            <label className="form-label">Symbol Universe</label>
            <input
              className="form-input"
              placeholder="NSE:RELIANCE-EQ, NSE:TCS-EQ …"
              value={aiCustomSymbols}
              onChange={e => setAiCustomSymbols(e.target.value)}
            />
          </div>
          <button
            className="btn"
            onClick={runAI}
            disabled={loading || !query.trim()}
            style={{
              minWidth: 160,
              background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: '#fff',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(168,85,247,0.4)',
            }}
          >
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating &amp; Scanning…</>
              : <><Sparkles size={14} /> Run AI Screener</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--accent-red-dim)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Header */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>
              {results.screener}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{results.description}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Timeframe: <strong style={{ color: 'var(--accent-purple)' }}>{results.timeframe === 'W' ? 'Weekly' : results.timeframe === 'D' ? 'Daily' : 'Monthly'}</strong>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
            <StatBadge label="Scanned" value={results.scanned} />
            <StatBadge label="Matched" value={results.matched} color="var(--accent-green)" />
            <StatBadge label="Skipped" value={results.skipped} color="var(--accent-red)" />
            {elapsed && <StatBadge label="Time" value={`${elapsed}s`} />}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {results.skipped > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSkipped(!showSkipped)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {showSkipped ? 'Hide Skipped' : 'View Skipped'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                <CheckCircle size={14} /> Scan complete
              </div>
            </div>
          </div>

          {/* Generated code — collapsible */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: 0, border: '1px solid rgba(168,85,247,0.2)', overflow: 'hidden' }}>
            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.75rem 1rem', background: 'rgba(168,85,247,0.06)',
                border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                fontSize: '0.82rem', fontWeight: 600,
              }}
            >
              <Code2 size={14} style={{ color: 'var(--accent-purple)' }} />
              <span style={{ color: 'var(--accent-purple)' }}>AI-Generated Screening Code</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {showCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            {showCode && (
              <pre style={{
                margin: 0, padding: '1rem',
                background: '#0a0e1a',
                color: '#c9d1d9',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.7,
                overflowX: 'auto',
                borderTop: '1px solid rgba(168,85,247,0.15)',
              }}>
                <code>{`def screen(closes, opens, highs, lows, volumes,\n           curr_close, prev_close, curr_vol, prev_vol,\n           curr_high, curr_low, curr_open):\n    ${results.generated_code.replace(/\n/g, '\n    ')}`}</code>
              </pre>
            )}
          </div>

          {/* Skipped */}
          {showSkipped && results.skipped_details?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-red-dim)', background: 'rgba(255,100,100,0.02)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-red)' }}>Skipped ({results.skipped})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.skipped_details.map((s, idx) => (
                  <div key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border)' }}>
                    <strong>{s.symbol?.replace('NSE:', '')}</strong>: <span style={{ color: 'var(--text-muted)' }}>{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results table */}
          {results.results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No matches found</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Try rephrasing your query or relaxing the conditions.</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Symbol</th>
                      <th>Close</th>
                      <th>Prev Close</th>
                      <th>Price Chg %</th>
                      <th>RSI (14)</th>
                      <th>SMA (20)</th>
                      <th>Vol Ratio</th>
                      <th>High</th>
                      <th>Low</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((r, i) => {
                      const up = r.price_chg_pct >= 0;
                      const rsiColor = r.rsi_14 < 30 ? 'var(--accent-green)' : r.rsi_14 > 70 ? 'var(--accent-red)' : 'var(--text-primary)';
                      return (
                        <tr key={r.symbol}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>{r.symbol.replace('NSE:', '').replace('-EQ', '')}</td>
                          <td className="mono" style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>₹{r.curr_close?.toFixed(2)}</td>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.prev_close?.toFixed(2)}</td>
                          <td className="mono" style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                            {up ? '+' : ''}{r.price_chg_pct?.toFixed(2)}%
                          </td>
                          <td className="mono" style={{ color: rsiColor, fontWeight: 600 }}>{r.rsi_14}</td>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.sma_20?.toFixed(2)}</td>
                          <td className="mono">{r.vol_ratio?.toFixed(2)}x</td>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.curr_high?.toFixed(2)}</td>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.curr_low?.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!results && !loading && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(168,85,247,0.25)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 1.25rem',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={28} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>AI Screener</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 1.25rem' }}>
            Describe any market screener in plain English. The AI will write the code and run it against Fyers data instantly.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {AI_EXAMPLES.slice(0, 3).map((ex, i) => (
              <button
                key={i}
                onClick={() => setQuery(ex)}
                style={{
                  fontSize: '0.72rem', padding: '0.3rem 0.65rem',
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 99, color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Strategy Panel ────────────────────────────────────────────────────────
function CustomStrategyPanel({ watchlists = [] }) {
  const [symbols, setSymbols] = useState('NSE:RELIANCE-EQ, NSE:TCS-EQ, NSE:HDFCBANK-EQ');
  const [timeframe, setTimeframe] = useState('D');
  const [conditions, setConditions] = useState([
    {
      ind1: { name: 'Close', period: '' },
      operator: '>',
      ind2: { name: 'SMA', period: '50', value: '' }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [elapsed, setElapsed] = useState(null);

  const addCondition = () => {
    setConditions([...conditions, {
      ind1: { name: 'Close', period: '' },
      operator: '>',
      ind2: { name: 'SMA', period: '50', value: '' }
    }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...conditions];
    const [obj, key] = field.split('.');
    if (key) {
      newConditions[index][obj][key] = value;
    } else {
      newConditions[index][field] = value;
    }
    setConditions(newConditions);
  };

  const runScreener = async () => {
    if (conditions.length === 0) return;
    setLoading(true); setError(''); setResults(null); setElapsed(null);
    const t0 = Date.now();
    try {
      // Clean up payload
      const payloadConditions = conditions.map(c => ({
        ind1: { 
          name: c.ind1.name, 
          period: c.ind1.period ? parseInt(c.ind1.period) : null,
          value: null
        },
        operator: c.operator,
        ind2: { 
          name: c.ind2.name, 
          period: c.ind2.period ? parseInt(c.ind2.period) : null,
          value: c.ind2.name === 'Value' && c.ind2.value ? parseFloat(c.ind2.value) : null
        }
      }));

      const res = await api.post('/api/screener/custom', {
        timeframe,
        symbols: symbols.trim(),
        conditions: payloadConditions
      });
      setResults(res.data);
      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
    } catch (e) {
      setError(e.response?.data?.detail || 'Custom screener failed. Ensure Fyers is connected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={16} style={{ color: 'var(--accent-blue)' }} />
          Custom Strategy Builder
        </h2>

        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: '0 1 150px' }}>
            <label className="form-label">Timeframe</label>
            <select className="form-input" value={timeframe} onChange={e => setTimeframe(e.target.value)}>
              <option value="D">Daily (D)</option>
              <option value="W">Weekly (W)</option>
              <option value="M">Monthly (M)</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '0 1 180px' }}>
            <label className="form-label">Load Watchlist</label>
            <select
              className="form-input"
              onChange={e => {
                if (e.target.value === 'nifty50') setSymbols('');
                else {
                  const wl = watchlists.find(w => w.id == e.target.value);
                  if (wl) setSymbols(wl.symbols.map(s => `${s.exchange}:${s.symbol}`).join(', '));
                }
              }}
              defaultValue="nifty50"
            >
              <option value="nifty50">Nifty 50 (Default)</option>
              {watchlists.map(w => <option key={w.id} value={w.id}>{w.name} ({w.symbols.length})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '2 1 200px' }}>
            <label className="form-label">Universe (Symbols)</label>
            <input 
              className="form-input" 
              placeholder="e.g. NSE:RELIANCE-EQ, NSE:TCS-EQ" 
              value={symbols} 
              onChange={e => setSymbols(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Conditions</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {conditions.map((cond, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                {/* Indicator 1 */}
                <select className="form-input" style={{ width: 100 }} value={cond.ind1.name} onChange={e => updateCondition(i, 'ind1.name', e.target.value)}>
                  <option value="Close">Close</option>
                  <option value="SMA">SMA</option>
                  <option value="EMA">EMA</option>
                  <option value="RSI">RSI</option>
                </select>
                {['SMA', 'EMA', 'RSI'].includes(cond.ind1.name) && (
                  <input type="number" className="form-input" style={{ width: 70 }} placeholder="Period" value={cond.ind1.period} onChange={e => updateCondition(i, 'ind1.period', e.target.value)} />
                )}

                {/* Operator */}
                <select className="form-input" style={{ width: 140, color: 'var(--accent-purple)' }} value={cond.operator} onChange={e => updateCondition(i, 'operator', e.target.value)}>
                  <option value=">">Greater Than</option>
                  <option value="<">Less Than</option>
                  <option value="==">Equals</option>
                  <option value="crosses_above">Crosses Above</option>
                  <option value="crosses_below">Crosses Below</option>
                </select>

                {/* Indicator 2 */}
                <select className="form-input" style={{ width: 100 }} value={cond.ind2.name} onChange={e => updateCondition(i, 'ind2.name', e.target.value)}>
                  <option value="Close">Close</option>
                  <option value="SMA">SMA</option>
                  <option value="EMA">EMA</option>
                  <option value="RSI">RSI</option>
                  <option value="Value">Value</option>
                </select>
                {['SMA', 'EMA', 'RSI'].includes(cond.ind2.name) && (
                  <input type="number" className="form-input" style={{ width: 70 }} placeholder="Period" value={cond.ind2.period} onChange={e => updateCondition(i, 'ind2.period', e.target.value)} />
                )}
                {cond.ind2.name === 'Value' && (
                  <input type="number" className="form-input" style={{ width: 90 }} placeholder="Number" value={cond.ind2.value} onChange={e => updateCondition(i, 'ind2.value', e.target.value)} />
                )}

                <button className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--accent-red)' }} onClick={() => removeCondition(i)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem', fontSize: '0.75rem', gap: '0.2rem', color: 'var(--accent-blue)' }} onClick={addCondition}>
            <Plus size={14} /> Add Condition
          </button>
        </div>

        <button className="btn btn-primary" onClick={runScreener} disabled={loading || conditions.length === 0} style={{ minWidth: 140 }}>
          {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</> : <><Play size={14} /> Run Strategy</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--accent-red-dim)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {results && (
        <>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
            <StatBadge label="Scanned" value={results.scanned} />
            <StatBadge label="Matched" value={results.matched} color="var(--accent-green)" />
            <StatBadge label="Skipped" value={results.skipped} color="var(--accent-red)" />
            {elapsed && <StatBadge label="Time" value={`${elapsed}s`} />}
          </div>

          {results.results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No matches found</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Try relaxing your conditions.</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Symbol</th>
                      <th>Close</th>
                      <th>Price Chg %</th>
                      <th>Volume</th>
                      {/* Dynamically generate column headers for indicator values based on the first result */}
                      {results.results[0] && Object.values(results.results[0].indicator_values || {}).map((ind, i) => (
                        <th key={i}>{ind.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((r, i) => {
                      const up = r.price_chg_pct >= 0;
                      return (
                        <tr key={r.symbol}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>{r.symbol.replace('NSE:', '').replace('-EQ', '')}</td>
                          <td className="mono" style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>₹{r.curr_close?.toFixed(2)}</td>
                          <td className="mono" style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                            {up ? '+' : ''}{r.price_chg_pct?.toFixed(2)}%
                          </td>
                          <td className="mono">{(r.curr_vol / 1e6).toFixed(1)}M</td>
                          {Object.values(r.indicator_values || {}).map((ind, j) => (
                            <td key={j} className="mono" style={{ color: 'var(--text-muted)' }}>
                              {ind.value !== null ? ind.value : '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Screener Page ─────────────────────────────────────────────────────────
export default function Screener() {
  const [strategy, setStrategy] = useState('volume-surge');
  const [watchlists, setWatchlists] = useState([]);

  useEffect(() => {
    watchlistService.list().then(r => setWatchlists(r.data)).catch(() => {});
  }, []);

  // Strategy: Volume Surge Params
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [onlyBullish, setOnlyBullish] = useState(false);

  // Strategy: Weekly SMA Params
  const [smaPeriod, setSmaPeriod] = useState(30);
  const [volThreshold, setVolThreshold] = useState(60);
  const [proximity, setProximity] = useState(1.0);

  // Strategy: Weekly Low Params
  const [weeklyChangeThreshold, setWeeklyChangeThreshold] = useState(5.0);
  const [bottomThreshold, setBottomThreshold] = useState(15.0);

  // Strategy: Weekly Volume & Close Params
  const [weeklyVolSurgePct, setWeeklyVolSurgePct] = useState(60);

  const [customSymbols, setCustomSymbols] = useState('');
  const [results, setResults] = useState(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(null);

  const runScreener = async () => {
    setLoading(true); setError(''); setResults(null); setElapsed(null);
    const t0 = Date.now();
    try {
      let endpoint = '';
      let params = {};

      if (strategy === 'volume-surge') {
        endpoint = '/api/screener/volume-surge';
        params = { threshold: threshold / 100, only_bullish: onlyBullish };
      } else if (strategy === 'weekly-sma') {
        endpoint = '/api/screener/weekly-sma-support';
        params = { sma_period: smaPeriod, vol_threshold: volThreshold / 100, proximity_pct: proximity };
      } else if (strategy === 'bottom-range') {
        endpoint = '/api/screener/bottom-range';
        params = { weekly_change_threshold: weeklyChangeThreshold, bottom_threshold: bottomThreshold };
      } else if (strategy === 'weekly-vol-close') {
        endpoint = '/api/screener/weekly-volume-close';
        params = { vol_surge_pct: weeklyVolSurgePct };
      }

      if (customSymbols.trim()) params.symbols = customSymbols.trim();

      const res = await api.get(endpoint, { params, timeout: 300000 });
      setResults(res.data);
      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
    } catch (e) {
      setError(e.response?.data?.detail || 'Screener failed. Ensure Fyers is connected.');
    } finally {
      setLoading(false);
    }
  };

  const TAB_STYLES = (active) => ({
    borderRadius: 0,
    flex: 1,
    ...(active ? {} : {}),
  });

  const isAI = strategy === 'ai';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Screener</h1>
          <p className="page-subtitle">Scan the market using pre-built strategies or describe your own with AI</p>
        </div>
      </div>

      {/* Strategy Selector Tabs */}
      <div className="flex gap-1" style={{ marginBottom: '1.5rem' }}>
        <button className={`btn ${strategy === 'volume-surge' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStrategy('volume-surge'); setResults(null); }} style={{ ...TAB_STYLES(strategy === 'volume-surge'), borderRadius: '10px 0 0 10px' }}>
          Monthly Volume Surge
        </button>
        <button className={`btn ${strategy === 'weekly-sma' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStrategy('weekly-sma'); setResults(null); }} style={TAB_STYLES(strategy === 'weekly-sma')}>
          Weekly SMA Support
        </button>
        <button className={`btn ${strategy === 'bottom-range' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStrategy('bottom-range'); setResults(null); }} style={TAB_STYLES(strategy === 'bottom-range')}>
          Weekly Low
        </button>
        <button className={`btn ${strategy === 'weekly-vol-close' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStrategy('weekly-vol-close'); setResults(null); }} style={TAB_STYLES(strategy === 'weekly-vol-close')}>
          Weekly Vol &amp; Close
        </button>
        <button className={`btn ${strategy === 'custom' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStrategy('custom'); setResults(null); }} style={TAB_STYLES(strategy === 'custom')}>
          Custom Strategy
        </button>
        <button
          className={`btn ${strategy === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setStrategy('ai'); setResults(null); }}
          style={{
            ...TAB_STYLES(strategy === 'ai'),
            borderRadius: '0 10px 10px 0',
            background: strategy === 'ai' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : undefined,
            boxShadow: strategy === 'ai' ? '0 4px 14px rgba(168,85,247,0.4)' : undefined,
            gap: '0.4rem',
          }}
        >
          <Sparkles size={14} /> AI Screener
        </button>
      </div>

      {/* AI tab renders its own self-contained panel */}
      {strategy === 'ai' ? <AIScreenerPanel watchlists={watchlists} /> : strategy === 'custom' ? <CustomStrategyPanel watchlists={watchlists} /> : (
        <>
          {/* Config card for built-in strategies */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: 'var(--accent-blue)' }} />
              {strategy === 'volume-surge' ? 'Monthly Volume Surge Strategy' :
               strategy === 'weekly-sma' ? 'Weekly SMA Support Strategy' :
               strategy === 'bottom-range' ? 'Weekly Low Strategy' :
               'Weekly Volume & Close Strategy'}
            </h2>

            <div style={{
              padding: '0.85rem 1rem', marginBottom: '1.25rem',
              background: 'rgba(56,139,253,0.08)', borderRadius: 10,
              border: '1px solid rgba(56,139,253,0.2)',
              fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--accent-blue)' }}>Strategy Logic:</strong>{' '}
              {strategy === 'volume-surge' ? (
                <>Scans last two monthly candles. Selected if Current Volume ≥ <strong style={{ color: 'var(--accent-green)' }}>{threshold}%</strong> of Previous Volume.</>
              ) : strategy === 'weekly-sma' ? (
                <>Checks if Weekly Low is ≥ <strong style={{ color: 'var(--accent-blue)' }}>SMA {smaPeriod}</strong> (or within {proximity}%) AND Volume ≥ <strong style={{ color: 'var(--accent-green)' }}>{volThreshold}%</strong> of previous week.</>
              ) : strategy === 'bottom-range' ? (
                <>
                  Scans weekly candles. Selects stocks with{' '}
                  <strong style={{ color: 'var(--accent-blue)' }}>weekly change ≤ ±{weeklyChangeThreshold}%</strong>
                  {' '}AND within{' '}
                  <strong style={{ color: 'var(--accent-green)' }}>{bottomThreshold}%</strong>
                  {' '}of their <strong style={{ color: 'var(--accent-green)' }}>52-week low</strong>.
                </>
              ) : (
                <>
                  Scans last two weekly candles. Selects stocks where{' '}
                  <strong style={{ color: 'var(--accent-blue)' }}>Weekly Volume exceeds previous week by ≥ {weeklyVolSurgePct}%</strong>
                  {' '}AND{' '}
                  <strong style={{ color: 'var(--accent-green)' }}>Weekly Close ≥ Previous Weekly Close</strong>.
                </>
              )}
            </div>

            <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {strategy === 'volume-surge' ? (
                <>
                  <div className="form-group" style={{ flex: '0 1 220px' }}>
                    <label className="form-label">Volume Threshold (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="range" min={10} max={200} step={5} value={threshold} onChange={e => setThreshold(+e.target.value)} style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', minWidth: 55, textAlign: 'right', color: 'var(--accent-blue)' }}>{threshold}%</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ flex: '0 1 180px' }}>
                    <label className="form-label">Price Action</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', height: '38px' }}>
                      <input type="checkbox" checked={onlyBullish} onChange={e => setOnlyBullish(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent-green)' }} />
                      <span style={{ fontSize: '0.85rem' }}>Only Bullish (Close {'>'} Prev)</span>
                    </label>
                  </div>
                </>
              ) : strategy === 'weekly-sma' ? (
                <>
                  <div className="form-group" style={{ flex: '0 1 150px' }}>
                    <label className="form-label">SMA Period</label>
                    <input type="number" className="form-input" value={smaPeriod} onChange={e => setSmaPeriod(+e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: '0 1 180px' }}>
                    <label className="form-label">Vol Threshold (%)</label>
                    <input type="number" className="form-input" value={volThreshold} onChange={e => setVolThreshold(+e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: '0 1 180px' }}>
                    <label className="form-label">Max Distance (%)</label>
                    <input type="number" step="0.1" min="0" max="1.0" className="form-input" value={proximity} onChange={e => setProximity(Math.min(+e.target.value, 1.0))} />
                  </div>
                </>
              ) : strategy === 'bottom-range' ? (
                <>
                  <div className="form-group" style={{ flex: '0 1 180px' }}>
                    <label className="form-label">Max Weekly Chg %</label>
                    <input type="number" step="0.5" min="0" className="form-input" value={weeklyChangeThreshold} onChange={e => setWeeklyChangeThreshold(+e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: '0 1 180px' }}>
                    <label className="form-label">Max Dist from 52w Low %</label>
                    <input type="number" step="1" min="0" className="form-input" value={bottomThreshold} onChange={e => setBottomThreshold(+e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ flex: '0 1 260px' }}>
                    <label className="form-label">Min Vol Surge over Prev Week (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="range" min={10} max={300} step={5} value={weeklyVolSurgePct} onChange={e => setWeeklyVolSurgePct(+e.target.value)} style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', minWidth: 55, textAlign: 'right', color: 'var(--accent-blue)' }}>{weeklyVolSurgePct}%</span>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group" style={{ flex: '0 1 200px' }}>
                <label className="form-label">Load from Watchlist</label>
                <select
                  className="form-input"
                  onChange={e => {
                    if (e.target.value === 'nifty50') {
                      setCustomSymbols('');
                    } else {
                      const wl = watchlists.find(w => w.id == e.target.value);
                      if (wl) {
                        setCustomSymbols(wl.symbols.map(s => `${s.exchange}:${s.symbol}`).join(', '));
                      }
                    }
                  }}
                  defaultValue="nifty50"
                >
                  <option value="nifty50">Nifty 50 (Standard)</option>
                  {watchlists.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.symbols.length})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: '2 1 300px' }}>
                <label className="form-label">Custom Symbols</label>
                <input className="form-input" placeholder="NSE:RELIANCE-EQ, NSE:TCS-EQ …" value={customSymbols} onChange={e => setCustomSymbols(e.target.value)} />
              </div>

              <button className="btn btn-primary" onClick={runScreener} disabled={loading} style={{ minWidth: 140 }}>
                {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</> : <><Play size={14} /> Run Screener</>}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--accent-red-dim)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <>
              <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                <StatBadge label="Scanned" value={results.scanned} />
                <StatBadge label="Matched" value={results.matched} color="var(--accent-green)" />
                <StatBadge label="Skipped" value={results.skipped} color="var(--accent-red)" />
                {elapsed && <StatBadge label="Time" value={`${elapsed}s`} />}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {results.skipped > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowSkipped(!showSkipped)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {showSkipped ? 'Hide Skipped' : 'View Skipped'}
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                    <CheckCircle size={14} /> Scan complete
                  </div>
                </div>
              </div>

              {showSkipped && results.skipped_details?.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-red-dim)', background: 'rgba(255,100,100,0.02)' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-red)' }}>Skipped Stocks ({results.skipped})</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {results.skipped_details.map((s, idx) => (
                      <div key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border)' }}>
                        <strong>{s.symbol.replace('NSE:', '')}</strong>: <span style={{ color: 'var(--text-muted)' }}>{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.results.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No matches found</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Try relaxing the filters or changing symbols.</div>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Symbol</th>
                          {strategy === 'volume-surge' ? (
                            <><th>Curr Vol</th><th>Prev Vol</th><th>Ratio</th></>
                          ) : strategy === 'weekly-sma' ? (
                            <><th>Price</th><th>SMA {results.sma_period}</th><th>Dist %</th></>
                          ) : strategy === 'weekly-vol-close' ? (
                            <><th>Curr Close</th><th>Prev Close</th><th>Price Chg %</th><th>Curr Vol</th><th>Prev Vol</th></>
                          ) : (
                            <><th>Close</th><th>Prev Close</th><th>Week Chg %</th><th>52w Low</th></>
                          )}
                          {strategy !== 'bottom-range' && strategy !== 'weekly-vol-close' && <th>Vol Ratio</th>}
                          <th>{strategy === 'bottom-range' ? 'Dist from Low' : strategy === 'weekly-vol-close' ? 'Vol Surge %' : 'Price Chg'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.results.map((r, i) => {
                          const priceUp = (r.curr_close - r.prev_close) >= 0;
                          return (
                            <tr key={r.symbol}>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                              <td className="mono" style={{ fontWeight: 700 }}>{r.symbol.replace('NSE:', '').replace('-EQ', '')}</td>

                              {strategy === 'volume-surge' ? (
                                <><td className="mono">{(r.curr_vol / 1e6).toFixed(1)}M</td><td className="mono" style={{ color: 'var(--text-muted)' }}>{(r.prev_vol / 1e6).toFixed(1)}M</td><td className="mono">{r.vol_ratio.toFixed(2)}x</td></>
                              ) : strategy === 'weekly-sma' ? (
                                <><td className="mono">₹{r.curr_close.toFixed(2)}</td><td className="mono">₹{r.sma_val.toFixed(2)}</td><td className="mono" style={{ color: r.dist_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>{r.dist_pct > 0 ? '+' : ''}{r.dist_pct}%</td></>
                              ) : strategy === 'weekly-vol-close' ? (
                                <><td className="mono" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>₹{r.curr_close?.toFixed(2)}</td><td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.prev_close?.toFixed(2)}</td><td className="mono" style={{ color: r.price_chg_pct > 0 ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 600 }}>{r.price_chg_pct >= 0 ? '+' : ''}{r.price_chg_pct?.toFixed(2)}%</td><td className="mono">{(r.curr_vol / 1e6).toFixed(1)}M</td><td className="mono" style={{ color: 'var(--text-muted)' }}>{(r.prev_vol / 1e6).toFixed(1)}M</td></>
                              ) : (
                                <><td className="mono">₹{r.curr_close?.toFixed(2)}</td><td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.prev_close?.toFixed(2)}</td><td className="mono" style={{ color: r.weekly_chg_pct > 0 ? 'var(--accent-green)' : r.weekly_chg_pct < 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: 600 }}>{r.weekly_chg_pct > 0 ? '+' : ''}{r.weekly_chg_pct}%</td><td className="mono" style={{ color: 'var(--text-muted)' }}>₹{r.min_52w_low?.toFixed(2)}</td></>
                              )}

                              <td className="mono" style={{ color: strategy === 'weekly-vol-close' ? 'var(--accent-blue)' : (r.dist_from_low_pct || 0) < 5 ? 'var(--accent-green)' : 'var(--text-primary)', fontWeight: 600 }}>
                                {strategy === 'bottom-range' ? `+${r.dist_from_low_pct}%` : strategy === 'weekly-vol-close' ? `+${r.vol_surge_pct?.toFixed(1)}%` : `${priceUp ? '+' : ''}${((r.curr_close - r.prev_close) / r.prev_close * 100).toFixed(2)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {!results && !loading && !error && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {strategy === 'volume-surge' ? '📊' : strategy === 'weekly-sma' ? '📈' : strategy === 'bottom-range' ? '📉' : '🔥'}
              </div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                {strategy === 'volume-surge' ? 'Monthly Volume Surge' : strategy === 'weekly-sma' ? 'Weekly SMA Support' : strategy === 'bottom-range' ? 'Weekly Low' : 'Weekly Volume & Close'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Configure parameters and click <strong>Run Screener</strong>.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
