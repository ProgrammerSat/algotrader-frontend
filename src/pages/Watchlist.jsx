import { useState, useEffect, useCallback, useRef } from 'react';
import { watchlistService, marketService } from '../services/services';
import { Plus, X, RefreshCw, Trash2, Upload } from 'lucide-react';

function AddSymbolForm({ watchlistId, onAdded }) {
  const [sym, setSym] = useState('');
  const [exch, setExch] = useState('NSE');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!sym.trim()) return;
    setLoading(true);
    try {
      await watchlistService.addSymbol(watchlistId, { symbol: sym.trim(), exchange: exch });
      setSym('');
      onAdded();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleAdd} className="flex gap-1" style={{ marginTop: '0.75rem' }}>
      <input className="form-input" placeholder="NSE:SBIN-EQ" value={sym} onChange={e => setSym(e.target.value)} style={{ flex: 1 }} />
      <select className="form-input form-select" value={exch} onChange={e => setExch(e.target.value)} style={{ width: 90 }}>
        {['NSE', 'BSE', 'NFO', 'MCX'].map(x => <option key={x}>{x}</option>)}
      </select>
      <button className="btn btn-green btn-sm" type="submit" disabled={loading}>
        <Plus size={14} />
      </button>
    </form>
  );
}

function QuoteChip({ quote }) {
  if (!quote) return null;
  const chg = quote.ch || 0;
  return (
    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
      <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{quote.lp?.toFixed(2)}</div>
      <div style={{ fontSize: '0.7rem', color: chg >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
        {chg >= 0 ? '+' : ''}{chg?.toFixed(2)} ({quote.chp?.toFixed(2)}%)
      </div>
    </div>
  );
}

export default function Watchlist() {
  const [watchlists, setWatchlists] = useState([]);
  const [active, setActive] = useState(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [quotesMap, setQuotesMap] = useState({});

  const load = useCallback(() => {
    watchlistService.list().then(r => {
      setWatchlists(r.data);
      if (r.data.length && !active) setActive(r.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeWl = watchlists.find(w => w.id === active);
  const symbolString = activeWl ? activeWl.symbols.map(s => `${s.exchange}:${s.symbol}`).join(',') : '';

  useEffect(() => {
    if (!symbolString) {
      setQuotesMap({});
      return;
    }
    const fetchAllQuotes = async () => {
      const symbolsList = symbolString.split(',');
      const newQuotes = {};
      // Fetch in chunks of 50 to avoid Fyers 400/429 limits
      for (let i = 0; i < symbolsList.length; i += 50) {
        const chunk = symbolsList.slice(i, i + 50);
        try {
          const res = await marketService.getQuote(chunk.join(','));
          if (res.data?.d) {
            res.data.d.forEach(item => {
              if (item.n && item.v) newQuotes[item.n] = item.v;
            });
          }
        } catch (e) {
          console.error("Bulk quote fetch error", e);
        }
      }
      setQuotesMap(newQuotes);
    };
    fetchAllQuotes();
  }, [symbolString]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await watchlistService.create({ name: newName });
      setNewName('');
      load();
      setActive(res.data.id);
    } catch {} finally { setCreating(false); }
  };

  const handleRemove = async (watchlistId, symbolId) => {
    await watchlistService.removeSymbol(watchlistId, symbolId);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">Monitor your favourite symbols</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /></button>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left: watchlist list */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>My Watchlists</div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
          ) : watchlists.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>No watchlists yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1rem' }}>
              {watchlists.map(wl => (
                <button
                  key={wl.id}
                  onClick={() => setActive(wl.id)}
                  style={{
                    padding: '0.65rem 0.9rem', borderRadius: 8,
                    border: `1px solid ${active === wl.id ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                    background: active === wl.id ? 'var(--accent-blue-dim)' : 'var(--bg-secondary)',
                    color: active === wl.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  {wl.name}
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{wl.symbols.length}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex gap-1" style={{ marginTop: '0.5rem' }}>
            <input className="form-input" placeholder="New watchlist name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={creating}><Plus size={14} /></button>
          </form>
        </div>

        {/* Right: symbols */}
        <div className="card">
          {!activeWl ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Select a watchlist to view symbols
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>{activeWl.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {activeWl.symbols.length} symbols · Live quotes require Fyers
              </div>

              {activeWl.symbols.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No symbols added yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
                  {activeWl.symbols.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)', borderRadius: 8,
                    }}>
                      <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{s.exchange}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>{s.symbol}</span>
                      <QuoteChip quote={quotesMap[`${s.exchange}:${s.symbol}`]} />
                      <button
                        onClick={() => handleRemove(activeWl.id, s.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', marginLeft: 'auto' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <AddSymbolForm watchlistId={activeWl.id} onAdded={load} />

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bulk Upload</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Upload a .txt file with comma-separated symbols (e.g. NSE:RELIANCE-EQ, NSE:TCS-EQ)</div>
                <label className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-primary)' }}>
                  <Upload size={14} /> Upload .txt
                  <input type="file" accept=".txt" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      setLoading(true);
                      const text = await file.text();
                      const symbols = text.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
                      
                      for (const sym of symbols) {
                        let exchange = 'NSE';
                        let symbolName = sym;
                        if (sym.includes(':')) {
                          const parts = sym.split(':');
                          exchange = parts[0].toUpperCase();
                          symbolName = parts[1].toUpperCase();
                        } else {
                          symbolName = sym.toUpperCase();
                        }
                        
                        // Automatically append -EQ for NSE/BSE if not already present
                        if ((exchange === 'NSE' || exchange === 'BSE') && 
                            !symbolName.endsWith('-EQ') && 
                            !symbolName.endsWith('-INDEX')) {
                          symbolName += '-EQ';
                        }
                        
                        await watchlistService.addSymbol(activeWl.id, { symbol: symbolName, exchange });
                      }
                      load();
                    } catch (err) {
                      console.error("Bulk upload error", err);
                    } finally {
                      e.target.value = '';
                    }
                  }} />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
