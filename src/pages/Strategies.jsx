import { useState, useEffect, useCallback } from 'react';
import { strategyService } from '../services/services';
import { Plus, Play, Pause, Trash2, Edit2, X, ChevronDown } from 'lucide-react';

const STRATEGY_TYPES = ['EMA_CROSSOVER', 'RSI_REVERSAL', 'MACD_SIGNAL', 'BOLLINGER_BREAKOUT', 'VWAP_BOUNCE', 'SUPERTREND'];

function StrategyModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || {
    name: '', symbol: 'NSE:NIFTY50-INDEX', exchange: 'NSE',
    timeframe: '5', strategy_type: 'EMA_CROSSOVER',
    quantity: 1, stop_loss_pct: 1.0, take_profit_pct: 2.0,
    trade_start_time: '09:15', trade_end_time: '15:15',
    is_paper_trading: true, description: '', params_json: '{}',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save strategy');
    } finally {
      setSaving(false);
    }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {initial ? 'Edit Strategy' : 'New Strategy'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Strategy Name *</label>
              <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="My EMA Strategy" required />
            </div>
            <div className="form-group">
              <label className="form-label">Symbol *</label>
              <input className="form-input" value={form.symbol} onChange={e => f('symbol', e.target.value)} placeholder="NSE:SBIN-EQ" required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Strategy Type</label>
              <select className="form-input form-select" value={form.strategy_type} onChange={e => f('strategy_type', e.target.value)}>
                {STRATEGY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timeframe (min)</label>
              <select className="form-input form-select" value={form.timeframe} onChange={e => f('timeframe', e.target.value)}>
                {['1','3','5','15','30','60','D'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min={1} value={form.quantity} onChange={e => f('quantity', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Exchange</label>
              <select className="form-input form-select" value={form.exchange} onChange={e => f('exchange', e.target.value)}>
                {['NSE', 'BSE', 'NFO', 'BFO', 'MCX'].map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Stop Loss %</label>
              <input className="form-input" type="number" step="0.1" value={form.stop_loss_pct} onChange={e => f('stop_loss_pct', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Take Profit %</label>
              <input className="form-input" type="number" step="0.1" value={form.take_profit_pct} onChange={e => f('take_profit_pct', +e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.trade_start_time} onChange={e => f('trade_start_time', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.trade_end_time} onChange={e => f('trade_end_time', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={e => f('description', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div className="flex items-center gap-2">
            <label className="switch">
              <input type="checkbox" checked={form.is_paper_trading} onChange={e => f('is_paper_trading', e.target.checked)} />
              <span className="slider"></span>
            </label>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Paper Trading {form.is_paper_trading ? '(Simulated)' : '(Live — Real Money)'}
            </span>
          </div>

          {!form.is_paper_trading && (
            <div style={{ padding: '0.75rem', background: 'var(--accent-red-dim)', borderRadius: 8, border: '1px solid rgba(255,77,109,0.3)', fontSize: '0.8rem', color: 'var(--accent-red)' }}>
              ⚠️ Live trading uses real money. Ensure your Fyers account is linked and funded.
            </div>
          )}

          {error && (
            <div style={{ padding: '0.65rem', background: 'var(--accent-red-dim)', borderRadius: 8, fontSize: '0.825rem', color: 'var(--accent-red)' }}>{error}</div>
          )}

          <div className="flex gap-1" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: 'badge-green',
    paused: 'badge-yellow',
    stopped: 'badge-gray',
    backtesting: 'badge-blue',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export default function Strategies() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    strategyService.list().then(r => setStrategies(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (editing) {
      await strategyService.update(editing.id, form);
    } else {
      await strategyService.create(form);
    }
    load();
  };

  const handleToggle = async (id) => {
    await strategyService.toggle(id);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this strategy?')) {
      await strategyService.delete(id);
      load();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Strategies</h1>
          <p className="page-subtitle">Build, configure, and run your algo strategies</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={15} />
          New Strategy
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading strategies...</div>
      ) : strategies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No strategies yet</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Create your first automated trading strategy to get started.
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={15} /> Create Strategy
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {strategies.map((s) => (
            <div key={s.id} className="card" style={{ position: 'relative' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {s.strategy_type.replace(/_/g, ' ')}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Symbol', value: s.symbol },
                  { label: 'Timeframe', value: `${s.timeframe}m` },
                  { label: 'Quantity', value: s.quantity },
                  { label: 'Mode', value: s.is_paper_trading ? '📋 Paper' : '💸 Live' },
                  { label: 'SL', value: `${s.stop_loss_pct}%`, color: 'var(--accent-red)' },
                  { label: 'TP', value: `${s.take_profit_pct}%`, color: 'var(--accent-green)' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {s.description && (
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                  {s.description}
                </div>
              )}

              <div className="flex gap-1">
                <button
                  className={`btn btn-sm ${s.status === 'active' ? 'btn-ghost' : 'btn-green'}`}
                  onClick={() => handleToggle(s.id)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {s.status === 'active' ? <><Pause size={13} /> Stop</> : <><Play size={13} /> Start</>}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(s); setShowModal(true); }}>
                  <Edit2 size={13} />
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(s.id)}>
                  <Trash2 size={13} />
                </button>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                {s.trade_start_time} – {s.trade_end_time}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <StrategyModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
