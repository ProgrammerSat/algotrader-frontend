import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Orders from './pages/Orders';
import Trades from './pages/Trades';
import Market from './pages/Market';
import Watchlist from './pages/Watchlist';
import Screener from './pages/Screener';
import StockAnalysis from './pages/StockAnalysis';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: '0.875rem',
    }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/strategies" element={<ProtectedLayout><Strategies /></ProtectedLayout>} />
      <Route path="/orders" element={<ProtectedLayout><Orders /></ProtectedLayout>} />
      <Route path="/trades" element={<ProtectedLayout><Trades /></ProtectedLayout>} />
      <Route path="/market" element={<ProtectedLayout><Market /></ProtectedLayout>} />
      <Route path="/watchlist" element={<ProtectedLayout><Watchlist /></ProtectedLayout>} />
      <Route path="/screener" element={<ProtectedLayout><Screener /></ProtectedLayout>} />
      <Route path="/analysis" element={<ProtectedLayout><StockAnalysis /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
