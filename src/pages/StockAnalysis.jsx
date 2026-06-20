import React, { useState } from 'react';
import { marketService } from '../services/services';
import { Search, TrendingUp, Activity, BarChart2 } from 'lucide-react';

export default function StockAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    
    // Automatically append NSE: and -EQ if not provided to make searching easier
    let querySymbol = symbol.trim().toUpperCase();
    if (!querySymbol.includes(':')) {
      querySymbol = 'NSE:' + querySymbol;
    }
    if (querySymbol.startsWith('NSE:') && !querySymbol.endsWith('-EQ') && !querySymbol.endsWith('-INDEX')) {
      querySymbol += '-EQ';
    }

    setLoading(true);
    setError(null);
    try {
      const res = await marketService.getAnalysis(querySymbol);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to fetch analysis.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'very good': return 'var(--accent-green)';
      case 'good': return 'var(--accent-green)'; 
      case 'average': return '#eab308'; // Yellow
      case 'bad': return 'var(--accent-red)';
      case 'very bad': return 'var(--accent-red)';
      default: return 'var(--text-muted)';
    }
  };

  const AnalysisBox = ({ title, status, icon: Icon }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', minHeight: '160px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        <Icon size={18} />
        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 800, 
        color: getStatusColor(status),
        textShadow: `0 0 20px ${getStatusColor(status)}33`
      }}>
        {status || '---'}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Analysis</h1>
          <p className="page-subtitle">Instant technical and fundamental verdicts</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter stock symbol (e.g. RELIANCE or NSE:RELIANCE-EQ)" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '1.1rem', height: '3rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '3rem', padding: '0 2rem' }} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', borderRadius: 8, marginBottom: '2rem' }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}

      {result && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
            Analysis for {result.symbol}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <AnalysisBox title="Monthly" status={result.technicals?.monthly} icon={Activity} />
            <AnalysisBox title="Weekly" status={result.technicals?.weekly} icon={TrendingUp} />
            <AnalysisBox title="Daily" status={result.technicals?.daily} icon={BarChart2} />
            <AnalysisBox title="Fundamentals" status={result.fundamentals} icon={Search} />
            <AnalysisBox title="Volume Profile" status={result.volume_profile} icon={BarChart2} />
          </div>
        </div>
      )}
    </div>
  );
}
