import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { tradeService, strategyService, authService, marketService } from '../services/services';
import api from '../services/api';
import { Zap, Link, Copy, ExternalLink, CheckCircle, X, ChevronRight, RefreshCw, BarChart2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FALLBACK_TICKER = [
  { symbol: 'NIFTY',     ltp: 22547.90, change: 96.15,  chg_pct: 0.43,  up: true  },
  { symbol: 'BANKNIFTY', ltp: 48312.15, change: -87.23, chg_pct: -0.18, up: false },
  { symbol: 'RELIANCE',  ltp: 2841.60,  change: 28.60,  chg_pct: 1.02,  up: true  },
  { symbol: 'TCS',       ltp: 3925.00,  change: 12.10,  chg_pct: 0.31,  up: true  },
  { symbol: 'SBIN',      ltp: 819.45,   change: -4.53,  chg_pct: -0.55, up: false },
  { symbol: 'INFY',      ltp: 1587.30,  change: 9.45,   chg_pct: 0.60,  up: true  },
  { symbol: 'HDFCBANK',  ltp: 1712.85,  change: -6.20,  chg_pct: -0.36, up: false },
];

function TickerBar() {
  const [quotes, setQuotes]       = useState(FALLBACK_TICKER);
  const [flashing, setFlashing]   = useState({}); // symbol -> 'up' | 'down'
  const prevQuotes                = useRef({});

  const fetchTicker = async () => {
    try {
      const res = await api.get('/api/market/ticker');
      const incoming = res.data?.quotes || [];
      if (!incoming.length) return;

      // Detect price changes and trigger flash
      const newFlash = {};
      incoming.forEach(q => {
        const prev = prevQuotes.current[q.symbol];
        if (prev !== undefined && prev !== q.ltp) {
          newFlash[q.symbol] = q.ltp > prev ? 'up' : 'down';
        }
        prevQuotes.current[q.symbol] = q.ltp;
      });

      setQuotes(incoming);

      if (Object.keys(newFlash).length > 0) {
        setFlashing(newFlash);
        setTimeout(() => setFlashing({}), 700);
      }
    } catch {
      // silently keep previous data
    }
  };

  useEffect(() => {
    fetchTicker();
    const id = setInterval(fetchTicker, 5000);
    return () => clearInterval(id);
  }, []);

  const items = [...quotes, ...quotes]; // duplicate for seamless scroll

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {items.map((item, i) => {
          const flash = flashing[item.symbol];
          return (
            <div
              className={`ticker-item${flash ? ` flash-${flash}` : ''}`}
              key={`${item.symbol}-${i}`}
            >
              <span className="symbol">{item.symbol}</span>
              <span className="price">
                {item.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`change ${item.up ? 'up' : 'down'}`}>
                {item.up ? '+' : ''}{item.chg_pct?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Fyers Manual Link Modal ─────────────────────────────── */
function FyersLinkModal({ authUrl, onClose, onLinked }) {
  const [step, setStep] = useState(1); // 1 = open URL, 2 = paste code
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!authCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/fyers/link', { auth_code: authCode.trim() });
      onLinked();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to link account. Check the auth code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Connect Fyers Account</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1" style={{ marginBottom: '1.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                border: `2px solid ${step >= s ? 'var(--accent-blue)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                color: step >= s ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>{s}</div>
              {s < 3 && <div style={{ width: 40, height: 2, background: step > s ? 'var(--accent-blue)' : 'var(--border)', transition: 'all 0.2s' }} />}
            </div>
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            {step === 1 ? 'Open Fyers' : step === 2 ? 'Authorize' : 'Paste Code'}
          </span>
        </div>

        {step === 1 && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Step 1:</strong> Click the button below to open the Fyers login page in a new tab.
            </div>
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', marginBottom: '0.75rem' }}
              onClick={() => setTimeout(() => setStep(2), 500)}
            >
              <ExternalLink size={15} />
              Open Fyers Login Page
            </a>
            <button className="btn btn-ghost w-full" style={{ justifyContent: 'center' }} onClick={() => setStep(2)}>
              I already opened it <ChevronRight size={14} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Step 2:</strong> Login to Fyers and click <strong style={{ color: 'var(--accent-blue)' }}>Allow</strong> to authorize the app.
              <br /><br />
              After authorizing, Fyers will redirect you to <strong>Google</strong>. The URL in the browser bar will look like:
            </div>
            <div style={{
              padding: '0.75rem 1rem', background: 'var(--bg-primary)',
              borderRadius: 8, border: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              color: 'var(--text-secondary)', marginBottom: '1rem', wordBreak: 'break-all',
            }}>
              https://www.google.com/?<span style={{ color: 'var(--accent-green)' }}>auth_code=<strong>XXXXXX...</strong></span>&amp;state=...
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setStep(3)}>
              I see the Google redirect <ChevronRight size={14} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Step 3:</strong> Copy the <strong style={{ color: 'var(--accent-green)' }}>auth_code</strong> value from the Google URL and paste it below.
            </div>
            <div className="form-group">
              <label className="form-label">Auth Code</label>
              <input
                className="form-input"
                placeholder="Paste your auth_code here..."
                value={authCode}
                onChange={e => setAuthCode(e.target.value)}
                autoFocus
              />
            </div>
            {error && (
              <div style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'var(--accent-red-dim)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}
            <div className="flex gap-1" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-green" onClick={handleSubmit} disabled={loading || !authCode.trim()}>
                {loading ? 'Linking...' : <><CheckCircle size={14} /> Link Account</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketBreadthCharts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    marketService.getBreadth(60)
      .then(res => setData(res.data.data || []))
      .catch(err => setError('Failed to load market breadth'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '1.75rem', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="spin" size={28} style={{ marginBottom: '1rem', opacity: 0.5, display: 'inline-block' }} />
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Analyzing Nifty 50 Historical Data</div>
        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>This may take a few seconds to calculate initially...</div>
      </div>
    );
  }

  if (error || !data.length) {
    return null;
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
        <BarChart2 size={18} color="var(--accent-blue)" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Market Breadth (Nifty 50)</h2>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Advance vs Decline</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="advance" name="Advance" stackId="a" fill="var(--accent-green)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="decline" name="Decline" stackId="a" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Volume Breadth</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v/1000000).toFixed(0) + 'M'} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="pos_vol" name="Positive Vol" stackId="a" fill="var(--accent-green)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="neg_vol" name="Negative Vol" stackId="a" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Stocks &gt; 50 &amp; 200 EMA</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 50]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="above_50ema" name="> 50 EMA" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'var(--bg-primary)', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="above_200ema" name="> 200 EMA" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: 'var(--bg-primary)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFyersModal, setShowFyersModal] = useState(false);
  const [fyersAuthUrl, setFyersAuthUrl] = useState('');

  useEffect(() => {
    Promise.all([tradeService.summary(), strategyService.list()])
      .then(([sumRes, strRes]) => {
        setSummary(sumRes.data);
        setStrategies(strRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFyersClick = async () => {
    try {
      const res = await authService.getFyersAuthUrl();
      setFyersAuthUrl(res.data.auth_url);
      setShowFyersModal(true);
    } catch {}
  };

  const handleLinked = () => {
    updateUser({ fyers_linked: true });
  };

  const activeStrategies = strategies.filter(s => s.status === 'active');
  const pnl = summary?.total_pnl ?? 0;
  const isLinked = user?.fyers_linked;

  return (
    <div>
      <TickerBar />

      <div style={{ padding: '2rem' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.email} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {!isLinked && (
            <button className="btn btn-primary" onClick={handleFyersClick}>
              <Link size={15} />
              Connect Fyers
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          <div className={`stat-card ${pnl >= 0 ? 'green' : 'red'}`}>
            <div className="stat-label">Total P&amp;L</div>
            <div className={`stat-value ${pnl >= 0 ? 'up' : 'down'}`}>
              ₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All time</div>
          </div>

          <div className="stat-card blue">
            <div className="stat-label">Active Strategies</div>
            <div className="stat-value neutral">{activeStrategies.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{strategies.length} total</div>
          </div>

          <div className="stat-card purple">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value neutral">{summary?.win_rate ?? 0}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary?.closed_trades ?? 0} closed trades</div>
          </div>

          <div className="stat-card green">
            <div className="stat-label">Avg P&amp;L / Trade</div>
            <div className={`stat-value ${(summary?.avg_pnl ?? 0) >= 0 ? 'up' : 'down'}`}>
              ₹{(summary?.avg_pnl ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary?.total_trades ?? 0} total trades</div>
          </div>
        </div>

        {/* Market Breadth */}
        <MarketBreadthCharts />

        {/* Strategies overview + Fyers */}
        <div className="grid-2">
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Strategies</h2>
              <span className="badge badge-green">{activeStrategies.length} Running</span>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
            ) : activeStrategies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Zap size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                <div>No active strategies</div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Create one in the Strategies tab</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeStrategies.slice(0, 5).map((s) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', background: 'var(--bg-secondary)',
                    borderRadius: 8, border: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.symbol} · {s.timeframe}m</div>
                    </div>
                    <span className="badge badge-green">● Live</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fyers Connection Card */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Fyers Integration</h2>
            <div style={{
              padding: '1.5rem',
              background: isLinked ? 'var(--accent-green-dim)' : 'var(--bg-secondary)',
              border: `1px solid ${isLinked ? 'rgba(0,208,132,0.2)' : 'var(--border)'}`,
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{isLinked ? '✅' : '🔗'}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {isLinked ? 'Fyers Connected' : 'Not Connected'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {isLinked
                  ? 'Your Fyers account is linked. Live trading is enabled.'
                  : 'Connect your Fyers account to enable live market data and trading.'}
              </div>
              {isLinked ? (
                <button className="btn btn-ghost" onClick={handleFyersClick} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <RefreshCw size={12} /> Reconnect (Daily Refresh)
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleFyersClick}>
                  <Link size={14} /> Connect Fyers Account
                </button>
              )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'Real-time Quotes', 'Live Order Placement', 'Portfolio Tracking', 'Historical Data',
              ].map((feat) => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ color: isLinked ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    {isLinked ? '✓' : '○'}
                  </span>
                  <span style={{ color: isLinked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showFyersModal && (
        <FyersLinkModal
          authUrl={fyersAuthUrl}
          onClose={() => setShowFyersModal(false)}
          onLinked={handleLinked}
        />
      )}
    </div>
  );
}
