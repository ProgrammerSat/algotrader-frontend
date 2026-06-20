import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = tab === 'login'
        ? await authService.login({ email: form.email, password: form.password })
        : await authService.register(form);
      const data = res.data;
      login({ user_id: data.user_id, email: data.email, full_name: data.full_name, fyers_linked: data.fyers_linked }, data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
        <div className="flex items-center gap-1" style={{ marginBottom: '2rem' }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>📈</div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>AlgoTrader</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fyers Algorithmic Platform</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: 3,
          marginBottom: '1.75rem',
        }}>
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '0.55rem', borderRadius: 6,
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600,
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="John Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="trader@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--accent-red-dim)',
              border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: 8,
              padding: '0.65rem 0.9rem',
              fontSize: '0.825rem',
              color: 'var(--accent-red)',
            }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}
            style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 10,
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}>
          <TrendingUp size={14} style={{ display: 'inline', marginRight: 5 }} />
          After login, connect your <strong style={{ color: 'var(--accent-blue)' }}>Fyers account</strong> from the dashboard to enable live trading.
        </div>
      </div>
    </div>
  );
}
