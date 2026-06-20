import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/services';
import { Plus, X, RefreshCw } from 'lucide-react';

function PlaceOrderModal({ onClose, onPlaced }) {
  const [form, setForm] = useState({
    symbol: 'NSE:SBIN-EQ', side: 'BUY', order_type: 'MARKET',
    product_type: 'INTRADAY', quantity: 1, price: 0, stop_price: 0, is_paper: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await orderService.place(form);
      onPlaced();
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      const detailStr = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : '';

      if (status === 403 || detailStr.toLowerCase().includes('fyers not linked') || detailStr.toLowerCase().includes('not linked')) {
        setError('⚠️ Fyers account not linked or session expired. Go to Dashboard → Connect Fyers, then try again. Or switch to Paper mode to simulate.');
      } else {
        setError(detailStr || 'Failed to place order. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Place Order</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Symbol</label>
            <input className="form-input" value={form.symbol} onChange={e => f('symbol', e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Side</label>
              <div className="flex gap-1">
                {['BUY', 'SELL'].map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => f('side', s)}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: 6, border: '1px solid',
                      cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                      fontFamily: 'var(--font-sans)',
                      background: form.side === s
                        ? (s === 'BUY' ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)')
                        : 'var(--bg-secondary)',
                      borderColor: form.side === s
                        ? (s === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)')
                        : 'var(--border)',
                      color: form.side === s
                        ? (s === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)')
                        : 'var(--text-muted)',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min={1} value={form.quantity} onChange={e => f('quantity', +e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Order Type</label>
              <select className="form-input form-select" value={form.order_type} onChange={e => f('order_type', e.target.value)}>
                {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <select className="form-input form-select" value={form.product_type} onChange={e => f('product_type', e.target.value)}>
                {['INTRADAY', 'CNC', 'CO', 'BO'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {form.order_type !== 'MARKET' && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Limit Price</label>
                <input className="form-input" type="number" step="0.05" value={form.price} onChange={e => f('price', +e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Stop Price</label>
                <input className="form-input" type="number" step="0.05" value={form.stop_price} onChange={e => f('stop_price', +e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="switch">
              <input type="checkbox" checked={form.is_paper === 1} onChange={e => f('is_paper', e.target.checked ? 1 : 0)} />
              <span className="slider"></span>
            </label>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {form.is_paper ? '📋 Paper Order (simulated)' : '💸 Live Order (real money)'}
            </span>
          </div>

          {error && <div style={{ padding: '0.65rem', background: 'var(--accent-red-dim)', borderRadius: 8, fontSize: '0.825rem', color: 'var(--accent-red)' }}>{error}</div>}

          <div className="flex gap-1" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className={`btn ${form.side === 'BUY' ? 'btn-green' : 'btn-red'}`}
              disabled={saving}
            >
              {saving ? 'Placing...' : `Place ${form.side} Order`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusColors = {
  PLACED: 'badge-blue', PAPER_PLACED: 'badge-blue',
  FILLED: 'badge-green', CANCELLED: 'badge-gray',
  REJECTED: 'badge-red', PENDING: 'badge-yellow',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('history'); // 'history' | 'positions' | 'holdings'
  const [liveData, setLiveData] = useState(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    orderService.list().then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const loadLive = async (type) => {
    setTab(type);
    setLiveData(null);
    try {
      const res = type === 'positions' ? await orderService.positions() : await orderService.holdings();
      setLiveData(res.data);
    } catch { setLiveData({ error: 'Fyers not linked or request failed' }); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Place, track, and manage your orders</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-sm" onClick={loadOrders}><RefreshCw size={14} /></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Place Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[['history', 'Order History'], ['positions', 'Positions'], ['holdings', 'Holdings']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => key === 'history' ? (setTab('history'), loadOrders()) : loadLive(key)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 7, border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600,
              background: tab === key ? 'var(--bg-card)' : 'transparent',
              color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'history' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th><th>Side</th><th>Type</th><th>Product</th>
                  <th>Qty</th><th>Price</th><th>Status</th><th>Mode</th><th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No orders yet</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{o.symbol}</td>
                    <td><span className={`badge ${o.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{o.side}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.order_type}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.product_type}</td>
                    <td className="mono">{o.quantity}</td>
                    <td className="mono">₹{o.avg_fill_price > 0 ? o.avg_fill_price.toFixed(2) : o.price.toFixed(2)}</td>
                    <td><span className={`badge ${statusColors[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                    <td><span className={`badge ${o.is_paper ? 'badge-yellow' : 'badge-blue'}`}>{o.is_paper ? 'Paper' : 'Live'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                      {new Date(o.placed_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tab === 'positions' || tab === 'holdings') && (
        <div className="card">
          {!liveData ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Fetching from Fyers...</div>
          ) : liveData.error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-red)', fontSize: '0.875rem' }}>{liveData.error}</div>
          ) : (
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'auto' }}>
              {JSON.stringify(liveData, null, 2)}
            </pre>
          )}
        </div>
      )}

      {showModal && <PlaceOrderModal onClose={() => setShowModal(false)} onPlaced={loadOrders} />}
    </div>
  );
}
