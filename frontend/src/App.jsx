import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Upload, Plus, FileText, Search, Filter, TrendingUp,
  Calendar, DollarSign, Tag, Loader2, Trash2, CheckCircle2,
  AlertCircle, X, Home, PieChart, Settings, Camera,
  ChevronRight, ArrowUpRight, History
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

function App() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    searchMode: 'merchant',
    amountOperator: 'gt',
    year: '',
    month: '',
    day: '',
    category: 'All'
  });

  const [userSettings, setUserSettings] = useState({
    name: 'Vansh',
    currencySymbol: '₹',
    currencyCode: 'INR',
    notifications: true
  });

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Others',
    company: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    const filtered = bills.filter(bill => {
      // 1. Category Filter (Always applies)
      const matchCategory = filters.category === 'All' || bill.category === filters.category;
      if (!matchCategory) return false;

      // 2. Mode-based filtering
      if (filters.searchMode === 'merchant') {
        return bill.company.toLowerCase().includes(searchTerm.toLowerCase());
      }

      if (filters.searchMode === 'amount') {
        if (!searchTerm) return true;
        const targetAmount = parseFloat(searchTerm);
        const billAmount = parseFloat(bill.amount);
        if (filters.amountOperator === 'gt') return billAmount > targetAmount;
        if (filters.amountOperator === 'lt') return billAmount < targetAmount;
        return billAmount === targetAmount;
      }

      if (filters.searchMode === 'date') {
        const [bYear, bMonth, bDay] = bill.date.split('-'); // Assuming YYYY-MM-DD
        const matchYear = !filters.year || bYear === filters.year;
        const matchMonth = !filters.month || bMonth === filters.month.padStart(2, '0');
        const matchDay = !filters.day || bDay === filters.day.padStart(2, '0');
        return matchYear && matchMonth && matchDay;
      }

      return true;
    });
    setFilteredBills(filtered);
  }, [searchTerm, bills, filters]);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${API_URL}/bills`);
      setBills(response.data);
    } catch (error) {
      toast.error("Failed to load bills");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !formData.company) return toast.error("Please provide file or details");

    setLoading(true);
    const data = new FormData();
    if (file) data.append('file', file);
    if (formData.amount) data.append('amount', formData.amount);
    if (formData.category) data.append('category', formData.category);
    if (formData.company) data.append('company', formData.company);
    if (formData.date) data.append('date', formData.date);

    try {
      const res = await axios.post(`${API_URL}/bills/upload`, data);
      toast.success(file ? "Bill processed & saved!" : "Bill saved!");
      setShowUpload(false);
      resetForm();
      fetchBills();
      setActiveTab('history');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || error.message || "Processing failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await axios.delete(`${API_URL}/bills/${id}`);
      toast.success("Bill deleted");
      fetchBills();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', category: 'Others', company: '', date: new Date().toISOString().split('T')[0] });
    setFile(null);
  };

  const categories = ['Electricity', 'Water', 'Shopping', 'Travel', 'Food', 'Others'];

  const renderHome = () => (
    <div className="animate-slide-up">
      {/* Welcome Card */}
      <div className="glass" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary-glow), transparent)', border: '1px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Hello, {userSettings.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You've spent {userSettings.currencySymbol}{bills.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString()} this month.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => setShowUpload(true)}>
            <Plus size={18} /> Quick Add
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Bills</p>
          <h3 style={{ fontSize: '1.5rem' }}>{bills.length}</h3>
        </div>
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <PieChart size={18} color="var(--primary)" />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Expense Total</p>
          <h3 style={{ fontSize: '1.2rem' }}>₹{bills.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString()}</h3>
        </div>
      </div>

      {/* Category Explorer */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Explore Categories</h3>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {[...new Set(bills.map(b => b.category))].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setFilters({ ...filters, category: cat, searchMode: 'merchant' });
                setSearchTerm('');
                setActiveTab('history');
              }}
              className="glass"
              style={{
                padding: '12px 20px',
                whiteSpace: 'nowrap',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              {cat}
            </button>
          ))}
          {bills.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No categories yet</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Recent Expenses</h3>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }} onClick={() => setActiveTab('history')}>See All</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {bills.slice(0, 5).map(bill => (
          <div key={bill._id} className="glass" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--surface-hover)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>{bill.company}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{bill.date} • {bill.category}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '700', fontSize: '1rem' }}>{userSettings.currencySymbol}{parseFloat(bill.amount).toLocaleString()}</p>
              <ArrowUpRight size={14} color="var(--accent)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-slide-up">
      {/* Search Mode Tabs */}
      <div className="glass" style={{ display: 'flex', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
        {['merchant', 'amount', 'date'].map(mode => (
          <button
            key={mode}
            onClick={() => {
              setFilters({ ...filters, searchMode: mode });
              setSearchTerm('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: filters.searchMode === mode ? 'var(--primary)' : 'transparent',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: '600',
              textTransform: 'capitalize',
              transition: 'all 0.3s'
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '14px', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />

          {filters.searchMode === 'merchant' && (
            <input
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '14px 0', outline: 'none', width: '100%' }}
              placeholder="Search merchant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}

          {filters.searchMode === 'amount' && (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
              <select
                value={filters.amountOperator}
                onChange={(e) => setFilters({ ...filters, amountOperator: e.target.value })}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '700', outline: 'none', width: 'auto' }}
              >
                <option value="gt">&gt;</option>
                <option value="lt">&lt;</option>
                <option value="eq">=</option>
              </select>
              <input
                type="number"
                style={{ background: 'transparent', border: 'none', color: 'white', padding: '14px 0', outline: 'none', width: '100%' }}
                placeholder="0.00"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {filters.searchMode === 'date' && (
            <div style={{ display: 'flex', gap: '8px', width: '100%', padding: '8px 0' }}>
              <input placeholder="YYYY" style={{ width: '60px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
              <input placeholder="MM" style={{ width: '40px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} />
              <input placeholder="DD" style={{ width: '40px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} value={filters.day} onChange={(e) => setFilters({ ...filters, day: e.target.value })} />
            </div>
          )}
        </div>

        <button
          className="glass"
          style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showFilters ? 'var(--primary)' : 'white' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="glass animate-slide-up" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem' }}>Global Category Filter</h4>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '0.8rem' }} onClick={() => setFilters({ ...filters, category: 'All', year: '', month: '', day: '' })}>Reset All</button>
          </div>
          <div className="input-group">
            <label>Category</label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="bill-grid">
        {filteredBills.map((bill) => (
          <div key={bill.id || bill._id} className="glass premium-card animate-slide-up" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary-light)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {bill.category}
              </span>
              <button
                onClick={() => deleteBill(bill.id || bill._id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <h3 style={{ marginBottom: '4px', fontSize: '1.2rem' }}>{bill.company}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> {bill.date}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>{userSettings.currencySymbol}{parseFloat(bill.amount).toLocaleString()}</span>
              <a href={`${API_URL}/uploads/${bill.filename}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => {
    const total = bills.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const categoryTotals = categories.map(cat => ({
      name: cat,
      total: bills.filter(b => b.category === cat).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    return (
      <div className="animate-slide-up">
        <h2 style={{ marginBottom: '24px' }}>Spending Analysis</h2>

        <div className="glass" style={{ padding: '24px', marginBottom: '32px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Total Monthly Expense</p>
          <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, white, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userSettings.currencySymbol}{total.toLocaleString()}</h1>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Category Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {categoryTotals.map(cat => {
            const percentage = total > 0 ? (cat.total / total) * 100 : 0;
            return (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>{cat.name}</span>
                  <span style={{ fontWeight: '700' }}>{userSettings.currencySymbol}{cat.total.toLocaleString()} ({Math.round(percentage)}%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(to right, var(--primary), var(--secondary))', borderRadius: '4px' }}></div>
                </div>
              </div>
            )
          })}
          {categoryTotals.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No data to analyze. Add some bills!</p>}
        </div>
      </div>
    )
  };

  const renderSettings = () => {
    const handleCurrencyChange = (val) => {
      // Smart Catch Logic
      let symbol = '₹';
      let code = 'INR';
      const input = val.toLowerCase();

      const map = {
        'usa': { s: '$', c: 'USD' }, 'us': { s: '$', c: 'USD' }, 'dollar': { s: '$', c: 'USD' }, '$': { s: '$', c: 'USD' },
        'india': { s: '₹', c: 'INR' }, 'inr': { s: '₹', c: 'INR' }, 'rupee': { s: '₹', c: 'INR' }, '₹': { s: '₹', c: 'INR' },
        'europe': { s: '€', c: 'EUR' }, 'euro': { s: '€', c: 'EUR' }, 'eur': { s: '€', c: 'EUR' }, '€': { s: '€', c: 'EUR' },
        'uk': { s: '£', c: 'GBP' }, 'pound': { s: '£', c: 'GBP' }, 'gbp': { s: '£', c: 'GBP' }, '£': { s: '£', c: 'GBP' }
      };

      if (map[input]) {
        symbol = map[input].s;
        code = map[input].c;
      } else if (val.length > 0) {
        // Fallback for custom entries: use first char if it's a symbol or just use the input
        symbol = val.length === 1 ? val : (val.match(/[^a-zA-Z0-9\s]/) ? val.split(' ')[0] : val);
        code = val.toUpperCase();
      }

      setUserSettings({ ...userSettings, currencySymbol: symbol, currencyCode: code });
    };

    return (
      <div className="animate-slide-up">
        <h2 style={{ marginBottom: '24px' }}>Settings</h2>

        <div className="glass" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800' }}>{userSettings.name[0]}</div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>{userSettings.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Free Plan • active</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DollarSign size={20} color="var(--primary)" />
                <span>Currency Settings</span>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{userSettings.currencySymbol} {userSettings.currencyCode}</span>
            </div>
            <input
              placeholder="Enter Country, Name or Symbol..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
              onChange={(e) => handleCurrencyChange(e.target.value)}
            />
          </div>

          <div className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={20} color="var(--primary)" />
              <span>Push Notifications</span>
            </div>
            <div
              onClick={() => setUserSettings({ ...userSettings, notifications: !userSettings.notifications })}
              style={{
                width: '44px',
                height: '24px',
                background: userSettings.notifications ? 'var(--success)' : 'var(--surface)',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: userSettings.notifications ? '23px' : '3px',
                transition: 'all 0.3s'
              }}></div>
            </div>
          </div>

          {[
            { icon: <TrendingUp size={20} />, label: 'Data Backup', value: 'Local Storage' },
            { icon: <Settings size={20} />, label: 'App Version', value: 'v1.1.0' }
          ].map((item, i) => (
            <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: 'var(--primary)' }}>{item.icon}</div>
                <span>{item.label}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <button className="glass" style={{ width: '100%', marginTop: '32px', padding: '16px', border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: '600', borderRadius: '16px' }}>
          Log Out
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--surface)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px' }
      }} />

      {/* Mobile Top Header */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.4rem' }}>Smart Bill</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: -2, right: -2, width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid var(--background)' }}></div>
            <Settings size={22} color="var(--text-muted)" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ paddingBottom: '40px' }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Upload Modal (Overlay on Mobile) */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="glass animate-slide-up" style={{ width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem' }}>New Bill</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'var(--surface)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div
                style={{
                  border: '2px dashed var(--glass-border)',
                  padding: '32px',
                  textAlign: 'center',
                  borderRadius: '16px',
                  marginBottom: '24px',
                  background: file ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                  borderColor: file ? 'var(--primary)' : 'var(--glass-border)'
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CheckCircle2 size={40} color="var(--success)" style={{ marginBottom: '12px' }} />
                    <p style={{ fontWeight: '600' }}>{file.name}</p>
                    <button style={{ color: 'var(--accent)', border: 'none', background: 'none', marginTop: '8px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); setFile(null); }}>Change File</button>
                  </div>
                ) : (
                  <>
                    <Camera size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                    <p style={{ fontWeight: '500' }}>Tap to scan or upload bill</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>AI will extract details automatically</p>
                  </>
                )}
                <input id="file-upload" type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>Merchant</label>
                    <input type="text" placeholder="e.g. Amazon" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>Amount (₹)</label>
                    <input type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '32px', height: '56px' }}>
                {loading ? <Loader2 className="animate-spin" /> : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} />
          <span>Home</span>
        </div>
        <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={24} />
          <span>History</span>
        </div>

        <div className="nav-item-center" onClick={() => setShowUpload(true)}>
          <Plus size={28} strokeWidth={3} />
        </div>

        <div className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <PieChart size={24} />
          <span>Insights</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={24} />
          <span>More</span>
        </div>
      </nav>
    </div>
  );
}

export default App;

