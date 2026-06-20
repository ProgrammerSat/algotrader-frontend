import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, BookOpen, ShoppingCart,
  BarChart2, Eye, LogOut, Zap, Settings, ScanLine, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/market', icon: TrendingUp, label: 'Market' },
  { to: '/strategies', icon: Zap, label: 'Strategies' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/trades', icon: BarChart2, label: 'Trade Log' },
  { to: '/watchlist', icon: Eye,      label: 'Watchlist' },
  { to: '/screener',  icon: ScanLine,  label: 'Screener'  },
  { to: '/analysis',  icon: Search,    label: 'Analysis'  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📈</div>
        <span className="sidebar-logo-text">AlgoTrader</span>
      </div>

      <span className="sidebar-section-label">Navigation</span>
      <ul className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={16} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar-bottom">
        <div style={{
          padding: '0.75rem',
          borderRadius: '8px',
          background: 'var(--bg-card)',
          marginBottom: '0.75rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Logged in as</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.full_name || user?.email}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {user?.fyers_linked
              ? <span style={{ color: 'var(--accent-green)' }}>● Fyers Linked</span>
              : <span style={{ color: 'var(--accent-yellow)' }}>● Fyers Not Linked</span>}
          </div>
        </div>

        <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start' }} onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
