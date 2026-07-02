import api from './api';

export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getFyersAuthUrl: () => api.get('/api/auth/fyers/initiate'),
  linkFyers: (auth_code) => api.post('/api/auth/fyers/link', { auth_code }),
  checkFyersStatus: () => api.get('/api/auth/fyers/status'),
};

export const marketService = {
  getQuote:      (symbols) => api.get('/api/market/quote', { params: { symbols } }),
  getHistory:    (params)  => api.get('/api/market/history', { params }),
  getFullHistory:(params)  => api.get('/api/market/history/full', { params, timeout: 180000 }), // long-running, up to 3 min
  getDepth:      (symbol)  => api.get('/api/market/depth', { params: { symbol } }),
  getFundamentals:(symbol) => api.get('/api/market/fundamentals', { params: { symbol } }),
  getAnalysis:   (symbol)  => api.get('/api/market/analysis', { params: { symbol } }),
  getBreadth:    (days = 60) => api.get('/api/market/breadth', { params: { days }, timeout: 60000 }), // can take 5s+ on first load
};

export const strategyService = {
  list: () => api.get('/api/strategies/'),
  create: (data) => api.post('/api/strategies/', data),
  update: (id, data) => api.patch(`/api/strategies/${id}`, data),
  delete: (id) => api.delete(`/api/strategies/${id}`),
  toggle: (id) => api.post(`/api/strategies/${id}/toggle`),
};

export const orderService = {
  list: () => api.get('/api/orders/'),
  place: (data) => api.post('/api/orders/', data),
  cancel: (id) => api.delete(`/api/orders/${id}/cancel`),
  liveOrders: () => api.get('/api/orders/live'),
  positions: () => api.get('/api/orders/positions'),
  holdings: () => api.get('/api/orders/holdings'),
};

export const tradeService = {
  list: (params) => api.get('/api/trades/', { params }),
  summary: () => api.get('/api/trades/summary'),
};

export const watchlistService = {
  list: () => api.get('/api/watchlists/'),
  create: (data) => api.post('/api/watchlists/', data),
  addSymbol: (id, data) => api.post(`/api/watchlists/${id}/symbols`, data),
  removeSymbol: (watchlistId, symbolId) => api.delete(`/api/watchlists/${watchlistId}/symbols/${symbolId}`),
};
