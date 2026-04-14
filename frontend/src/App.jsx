import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Upload, Plus, FileText, Search, Filter, TrendingUp,
  Calendar, DollarSign, Tag, Loader2, Trash2, CheckCircle2,
  AlertCircle, X, Home, PieChart, Settings, Camera,
  ChevronRight, ArrowUpRight, History, Download, Edit3, Save, MoreVertical
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { auth, googleProvider, facebookProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const API_URL = 'http://localhost:8000';
const DEVELOPMENT_MODE = false;
const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' }
];

// Real Security Integration: Inject Auth Token into every request
axios.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    // In production with real Firebase, this would be user.stsTokenManager.accessToken
    config.headers.Authorization = `Bearer ${user.id}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBills, setFetchingBills] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showFilters, setShowFilters] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  
  // OCR processing state
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'All',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('userSettings');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      currencySymbol: '₹',
      currencyCode: 'INR',
      notifications: true,
      isDarkMode: true
    };
  });

  useEffect(() => {
    if (userSettings.isDarkMode) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    if (user && user.name) {
       setUserSettings(prev => ({ ...prev, name: user.name }));
    }
  }, [user]);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Others',
    company: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [file, setFile] = useState(null);

  // Detail View State
  const [selectedBill, setSelectedBill] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const debounceTimeout = useRef(null);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'firebase'
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData)); // Fix: persisted for interceptor
        fetchBills(userData.id);
        fetchAnalytics(userData.id);
      } else {
        // Fallback for development/localStorage if Firebase not configured
        const savedUser = localStorage.getItem('user');
        if (savedUser && DEVELOPMENT_MODE) {
           const userData = JSON.parse(savedUser);
           setUser(userData);
           setIsAuthenticated(true);
           fetchBills(userData.id);
           fetchAnalytics(userData.id);
        } else {
           setIsAuthenticated(false);
           setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchBills();
    }, 500); // 500ms debounce for search/filter changes
    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm, filters, user]);

  const fetchBills = async (userId = user?.id) => {
    if (!userId) return;
    setFetchingBills(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.minAmount) params.append('min_amount', filters.minAmount);
      if (filters.maxAmount) params.append('max_amount', filters.maxAmount);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      params.append('sort_by', filters.sortBy);
      params.append('sort_order', filters.sortOrder);
      
      const response = await axios.get(`${API_URL}/bills/?${params.toString()}`);
      setBills(response.data);
    } catch (error) {
      toast.error("Failed to load bills");
    } finally {
      setFetchingBills(false);
    }
  };

  const fetchAnalytics = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/bills/analytics/overview`);
      setAnalytics(res.data);
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !formData.company) return toast.error("Please provide file or company name");

    setLoading(true);
    setOcrProcessing(!!file && (!formData.amount || !formData.company));
    
    const data = new FormData();
    if (file) data.append('file', file);
    if (formData.amount) data.append('amount', formData.amount);
    if (formData.category) data.append('category', formData.category);
    if (formData.company) data.append('company', formData.company);
    if (formData.date) data.append('date', formData.date);
    if (formData.notes) data.append('notes', formData.notes);

    try {
      const res = await axios.post(`${API_URL}/bills/upload`, data);
      setOcrResult(res.data); // Store to show OCR feedback
      
      if (res.data.ocr_confidence === 'high') {
         toast.success("Bill processed perfectly!");
      } else if (file) {
         toast.success("Bill saved! Double check details.");
      } else {
         toast.success("Bill saved manually.");
      }
      
      // Don't close upload modal immediately if we did OCR, let user see the result
      if (!file) {
         setShowUpload(false);
         resetForm();
      }
      
      fetchBills();
      fetchAnalytics();
      
      // If we didn't show OCR results, go to history
      if (!file) {
         setActiveTab('history');
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || error.message || "Processing failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setOcrProcessing(false);
    }
  };

  const updateBill = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/bills/${selectedBill._id}`, {
         amount: parseFloat(selectedBill.amount),
         company: selectedBill.company,
         category: selectedBill.category,
         date: selectedBill.date,
         notes: selectedBill.notes
      });
      setSelectedBill(res.data);
      setIsEditing(false);
      toast.success("Bill updated successfully");
      fetchBills(); 
      fetchAnalytics();
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Delete this bill? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/bills/${id}`);
      toast.success("Bill deleted");
      setSelectedBill(null);
      fetchBills();
      fetchAnalytics();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleExportCSV = async () => {
     try {
        const params = new URLSearchParams();
        if (filters.category && filters.category !== 'All') params.append('category', filters.category);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        
        // Use axios for auth headers instead of window.open
        const response = await axios.get(`${API_URL}/bills/export/csv?${params.toString()}`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bills_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Export complete!");
     } catch(e) {
        toast.error("Export failed");
     }
  };

  const handleLogin = (e, provider = 'email') => {
    if (e) e.preventDefault();
    
    if (provider === 'email' || DEVELOPMENT_MODE) {
        setLoading(true);
        // Simulate real auth behavior
        const mockUser = {
            id: provider === 'email' ? 'user-vansh' : `user-${provider}-${Math.floor(Math.random() * 1000)}`,
            name: provider === 'email' ? 'Vansh' : `${provider.charAt(0).toUpperCase() + provider.slice(1)} Guest`,
            provider: provider
        };

        setTimeout(() => {
          setIsAuthenticated(true);
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
          setLoading(false);
          toast.success(`Signed in with ${provider} (Development)`);
          fetchBills(mockUser.id);
          fetchAnalytics(mockUser.id);
        }, 1200);
        return;
    }

    // Real Firebase Social Login
    setLoading(true);
    const authProvider = provider === 'google' ? googleProvider : facebookProvider;
    
    signInWithPopup(auth, authProvider)
      .then((result) => {
         // onAuthStateChanged will handle the state update
         toast.success(`Successfully signed in with ${provider}`);
      })
      .catch((error) => {
         console.error(error);
         toast.error(`Login failed: ${error.message}`);
         setLoading(false);
      });
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      try {
        await firebaseSignOut(auth);
        setIsAuthenticated(false);
        setUser(null);
        setBills([]); // Fix: clear bills on logout
        setAnalytics(null); // Fix: clear analytics on logout
        localStorage.removeItem('user');
        toast.success("Signed out successfully");
      } catch (e) {
        toast.error("Sign out failed");
      }
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', category: 'Others', company: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setFile(null);
    setOcrResult(null);
  };

  const categories = ['Electricity', 'Water', 'Shopping', 'Travel', 'Food', 'Medical', 'Education', 'Telecom', 'Rent', 'Insurance', 'Subscription', 'Others'];

  // ════════════════════════════════════════════════════════════════
  // RENDERERS
  // ════════════════════════════════════════════════════════════════

  const renderHome = () => (
    <div className="animate-fade-in">
      {/* Welcome Card */}
      <div className="premium-card glass" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, var(--surface), rgba(99, 102, 241, 0.1))', border: '1px solid var(--primary-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Hello, {userSettings.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Here is your spending summary</p>
          </div>
          <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800' }}>
            {userSettings.name[0]}
          </div>
        </div>
        
        <div style={{ marginTop: '32px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total Monthly Expense</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, var(--text), var(--primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {userSettings.currencySymbol}{analytics ? analytics.total_amount.toLocaleString() : '0'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ padding: '12px 24px', flex: 1 }} onClick={() => setShowUpload(true)}>
            <Plus size={18} /> Add New Bill
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="glass premium-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="stat-icon" style={{ background: 'var(--success-glow)', color: 'var(--success)', margin: 0, width: '56px', height: '56px' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '2px' }}>Total Documents</p>
            <h3 style={{ fontSize: '1.8rem' }}>{analytics ? analytics.total_bills : 0} Processed</h3>
          </div>
        </div>
      </div>

      {/* Category Explorer */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Quick Filters</h3>
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {categories.slice(0, 7).map(cat => (
            <button
              key={cat}
              onClick={() => {
                setFilters({ ...filters, category: cat });
                setActiveTab('history');
              }}
              className="glass"
              style={{
                padding: '12px 24px',
                whiteSpace: 'nowrap',
                borderRadius: '100px',
                color: filters.category === cat ? 'white' : 'var(--text)',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                border: filters.category === cat ? '1px solid var(--primary)' : undefined,
                background: filters.category === cat ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--surface-hover)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Recent Transactions</h3>
        <button className="btn-ghost" style={{ color: 'var(--primary-light)', fontWeight: '600' }} onClick={() => setActiveTab('history')}>View All</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fetchingBills && bills.length === 0 ? (
           Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px' }}></div>)
        ) : bills.slice(0, 5).map(bill => (
          <div key={bill._id} className="glass premium-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => setSelectedBill(bill)}>
            <div style={{ background: 'var(--surface-hover)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="var(--primary)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bill.company}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <span className={`badge ${bill.category === 'Shopping' ? 'badge-info' : bill.category === 'Food' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>{bill.category}</span>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>• {bill.date}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{userSettings.currencySymbol}{parseFloat(bill.amount).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {bills.length === 0 && !fetchingBills && (
          <div className="empty-state">
            <TrendingUp size={48} color="var(--text-dim)"/>
            <h4>No bills yet</h4>
            <p>Add your first bill to see it here</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <h2 style={{ fontSize: '1.8rem' }}>Transaction History</h2>
         <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={16}/> Export
         </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: 'var(--radius-md)', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
          <input
            style={{ background: 'transparent', border: 'none', color: 'white', padding: '16px 0', outline: 'none', width: '100%', fontSize: '0.95rem' }}
            placeholder="Search merchants, amounts, or OCR text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="glass premium-card"
          style={{ width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showFilters ? 'var(--primary)' : 'white', border: showFilters ? '1px solid var(--primary)' : undefined }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="glass animate-slide-up" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary-light)' }}>Advanced Filters</h4>
            <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setFilters({ category: 'All', minAmount: '', maxAmount: '', startDate: '', endDate: '', sortBy: 'date', sortOrder: 'desc' })}>Reset</button>
          </div>
          
          <div className="filter-grid">
            <div className="input-group">
              <label>Category</label>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
               <div className="input-group" style={{ flex: 1 }}>
                 <label>Min Amount</label>
                 <input type="number" placeholder="0" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} />
               </div>
               <div className="input-group" style={{ flex: 1 }}>
                 <label>Max Amount</label>
                 <input type="number" placeholder="Uncapped" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} />
               </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <div className="input-group" style={{ flex: 1 }}>
                 <label>From Date</label>
                 <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
               </div>
               <div className="input-group" style={{ flex: 1 }}>
                 <label>To Date</label>
                 <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
               </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <div className="input-group" style={{ flex: 1 }}>
                 <label>Sort By</label>
                 <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
                   <option value="date">Date</option>
                   <option value="amount">Amount</option>
                   <option value="company">Merchant</option>
                 </select>
               </div>
               <div className="input-group" style={{ flex: 1 }}>
                 <label>Order</label>
                 <select value={filters.sortOrder} onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}>
                   <option value="desc">Highest / Newest</option>
                   <option value="asc">Lowest / Oldest</option>
                 </select>
               </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', minHeight: '200px' }}>
        {/* Loading Overlay — much smoother than a jumping spinner */}
        {fetchingBills && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(11, 15, 26, 0.4)', 
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '60px',
            borderRadius: 'var(--radius-lg)'
          }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)"/>
          </div>
        )}

        <div className={`bill-grid ${fetchingBills ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.3s ease' }}>
          {bills.map((bill) => (
            <div key={bill._id} onClick={() => setSelectedBill(bill)} className="glass premium-card animate-scale-in" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <span className={`badge ${bill.category === 'Food' ? 'badge-warning' : bill.category === 'Shopping' ? 'badge-info' : 'badge-primary'}`}>
                   {bill.category}
                 </span>
                 {bill.ocr_confidence && bill.ocr_confidence !== 'none' && (
                    <div className="ocr-indicator tooltip-wrapper">
                       <div className={`ocr-dot ${bill.ocr_confidence}`}></div>
                       Smart
                       <span className="tooltip-text">Details Auto-Extracted via OCR</span>
                    </div>
                 )}
               </div>
   
               <h3 style={{ marginBottom: '8px', fontSize: '1.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bill.company}</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Calendar size={14} /> {bill.date}
               </p>
   
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginTop: 'auto' }}>
                 <span style={{ fontSize: '1.6rem', fontWeight: '900' }}>{userSettings.currencySymbol}{parseFloat(bill.amount).toLocaleString()}</span>
                 <div className="btn-ghost" style={{ background: 'var(--surface)'}}>
                   <ChevronRight size={18} />
                 </div>
               </div>
             </div>
           ))}
           
          {bills.length === 0 && !fetchingBills && (
             <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <Search size={48} color="var(--text-dim)"/>
                <h4>No results found</h4>
                <p>Try adjusting your search or filters</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );

  const renderInsights = () => {
    if (!analytics) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color="var(--primary)"/></div>;

    const categoryEntries = Object.entries(analytics.category_breakdown)
      .map(([name, data]) => ({ name, value: data.total }))
      .sort((a, b) => b.value - a.value);

    const monthEntries = Object.entries(analytics.monthly_spending).slice(-6); // last 6 months

    return (
      <div className="animate-fade-in">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Spending Analytics</h2>

        <div className="glass premium-card" style={{ padding: '28px', marginBottom: '32px' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Total Processed Volume</p>
          <h1 style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, white, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
             {userSettings.currencySymbol}{analytics.total_amount.toLocaleString()}
          </h1>
          <p style={{ color: 'var(--success)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
             <CheckCircle2 size={16}/> {analytics.total_bills} documents successfully analyzed
          </p>
        </div>

        {/* Bar Chart Equivalent */}
        <div className="glass" style={{ padding: '24px', marginBottom: '32px' }}>
           <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>6-Month Spending Trend</h3>
           {monthEntries.length > 0 ? (
              <div className="chart-bar-container">
                 {monthEntries.map(([month, total], i) => {
                    const max = Math.max(...monthEntries.map(e => e[1]));
                    const heightPct = max > 0 ? Math.max((total / max) * 100, 5) : 5;
                    return (
                       <div key={month} className="chart-bar-wrapper">
                          <div className="chart-bar-value">{userSettings.currencySymbol}{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="chart-bar tooltip-wrapper" style={{ height: `${heightPct}%` }}>
                             <span className="tooltip-text">{userSettings.currencySymbol}{total.toLocaleString()}</span>
                          </div>
                          <div className="chart-bar-label">{month.substring(5)}</div>
                       </div>
                    )
                 })}
              </div>
           ) : (
              <p style={{ color: 'var(--text-muted)' }}>Not enough data for trend analysis.</p>
           )}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Category Breakdown</h3>
        <div className="insights-grid">
          {categoryEntries.map(cat => {
            const percentage = analytics.total_amount > 0 ? (cat.value / analytics.total_amount) * 100 : 0;
            return (
              <div key={cat.name} className="glass" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: '600' }}>{cat.name}</span>
                  <div style={{ textAlign: 'right' }}>
                     <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{userSettings.currencySymbol}{cat.value.toLocaleString()}</span>
                     <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginLeft: '6px' }}>({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
                </div>
              </div>
            )
          })}
          {categoryEntries.length === 0 && <p className="empty-state">No category data to analyze.</p>}
        </div>
      </div>
    )
  };

  const renderSettings = () => {
    return (
      <div className="animate-fade-in">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Preferences</h2>

        <div className="glass premium-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', boxShadow: 'var(--shadow-glow)' }}>{userSettings.name[0]}</div>
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>{userSettings.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
               <CheckCircle2 size={14} color="var(--success)"/> Pro Account
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon" style={{ background: 'var(--surface-hover)', margin: 0, width: '36px', height: '36px' }}>
                   <DollarSign size={18} color="var(--primary)" />
                </div>
                <span style={{ fontWeight: '600' }}>Currency Settings</span>
              </div>
              <span style={{ fontWeight: '800', color: 'var(--primary-light)', fontSize: '1.2rem' }}>{userSettings.currencySymbol}</span>
            </div>
            <select
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
              value={userSettings.currencyCode}
              onChange={(e) => {
                const selected = CURRENCIES.find(c => c.code === e.target.value);
                setUserSettings({...userSettings, currencyCode: selected.code, currencySymbol: selected.symbol});
              }}
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.symbol} - {curr.name} ({curr.code})</option>
              ))}
            </select>
          </div>

          <div className="glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div className="stat-icon" style={{ background: 'var(--surface-hover)', margin: 0, width: '36px', height: '36px' }}>
                  {userSettings.isDarkMode ? <Home size={18} color="var(--primary)" /> : <TrendingUp size={18} color="var(--primary)" />}
               </div>
              <span style={{ fontWeight: '600' }}>Dark Mode</span>
            </div>
            <div
              onClick={() => setUserSettings({ ...userSettings, isDarkMode: !userSettings.isDarkMode })}
              style={{
                width: '48px',
                height: '26px',
                background: userSettings.isDarkMode ? 'var(--primary)' : 'var(--surface-hover)',
                borderRadius: '13px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: userSettings.isDarkMode ? '25px' : '3px',
                transition: 'all 0.3s'
              }}></div>
            </div>
          </div>

          <div className="glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div className="stat-icon" style={{ background: 'var(--surface-hover)', margin: 0, width: '36px', height: '36px' }}>
                  <AlertCircle size={18} color="var(--success)" />
               </div>
              <span style={{ fontWeight: '600' }}>Smart Notifications</span>
            </div>
            <div
              onClick={() => setUserSettings({ ...userSettings, notifications: !userSettings.notifications })}
              style={{
                width: '48px',
                height: '26px',
                background: userSettings.notifications ? 'var(--primary)' : 'var(--surface-hover)',
                borderRadius: '13px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: userSettings.notifications ? '25px' : '3px',
                transition: 'all 0.3s'
              }}></div>
            </div>
          </div>
        </div>

        <button 
          className="glass" 
          style={{ width: '100%', marginTop: '32px', padding: '16px', border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: '600', borderRadius: 'var(--radius-lg)', transition: 'all 0.3s' }} 
          onMouseOver={e=>e.target.style.background='rgba(244,63,94,0.1)'} 
          onMouseOut={e=>e.target.style.background='transparent'}
          onClick={handleSignOut}
        >
          Sign Out of Device
        </button>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="login-screen animate-fade-in">
      <div className="login-card glass premium-card">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="animate-float" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'var(--shadow-glow)' }}>
            <FileText size={40} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Smart Bill<span style={{color: 'var(--primary-light)'}}>Manager</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>AI-powered bill tracking & analytics</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button className="btn-primary" style={{ height: '56px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }} onClick={() => handleLogin(null, 'google')} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </>
            )}
          </button>

          <button className="btn-secondary" style={{ height: '56px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }} onClick={() => handleLogin(null, 'facebook')} disabled={loading}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
            Sign in with Facebook
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.6 }}>By signing in, you agree to our Terms of Service.<br/>Your financial data is encrypted and private.</p>
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (!isAuthenticated) return renderLogin();

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--surface-active)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px' }
      }} />

      {/* Mobile Top Header */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeTab !== 'home' && (
            <button 
              className="btn-ghost" 
              onClick={() => setActiveTab('home')}
              style={{ padding: '4px', marginRight: '4px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
            >
              <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <FileText size={20} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', letterSpacing: '-0.03em' }}>Smart Bill<span style={{color: 'var(--primary-light)'}}>.</span></h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Upload Modal (Overlay on Mobile) */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="glass modal-content premium-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem' }}>Upload Document</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>e.target.style.background='var(--surface-hover)'} onMouseOut={e=>e.target.style.background='var(--surface)'}>
                <X size={20} />
              </button>
            </div>

            {ocrResult ? (
               <div className="animate-scale-in">
                  <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--success)', marginBottom: '24px' }}>
                     <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '16px' }}/>
                     <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Processing Complete</h4>
                     <p style={{ color: 'var(--text-muted)' }}>Our AI Extracted the following details. Please verify them in your history.</p>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px', textAlign: 'left' }}>
                        <div className="glass" style={{ padding: '12px' }}>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Merchant</span>
                           <p style={{ fontWeight: '600' }}>{ocrResult.company || "Not Found"}</p>
                        </div>
                        <div className="glass" style={{ padding: '12px' }}>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Amount</span>
                           <p style={{ fontWeight: '600', color: 'var(--primary-light)' }}>{userSettings.currencySymbol}{ocrResult.amount || "0"}</p>
                        </div>
                     </div>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', height: '56px' }} onClick={() => { setShowUpload(false); resetForm(); }}>
                     Done
                  </button>
               </div>
            ) : (
               <form onSubmit={handleUpload}>
                 <div
                   className={`dropzone ${file ? 'active' : ''} ${ocrProcessing ? 'processing' : ''}`}
                   onClick={() => document.getElementById('file-upload').click()}
                 >
                   {ocrProcessing ? (
                     <div className="ocr-scanner" style={{ padding: '20px 0' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto 16px' }}/>
                        <p style={{ fontWeight: '600', color: 'var(--primary-light)' }}>AI Engine Scanning Document...</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '8px' }}>Extracting text with Tesseract OCR</p>
                     </div>
                   ) : file ? (
                     <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <FileText size={48} color="var(--primary-light)" style={{ marginBottom: '16px' }} />
                       <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{file.name}</p>
                       <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                       <button type="button" style={{ color: 'var(--accent)', border: 'none', background: 'rgba(244, 63, 94, 0.1)', padding: '6px 12px', borderRadius: '100px', marginTop: '16px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove File</button>
                     </div>
                   ) : (
                     <>
                       <div style={{ width: '64px', height: '64px', background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--glass-border)' }}>
                          <Camera size={28} color="var(--text-muted)" />
                       </div>
                       <p style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '8px' }}>Tap to scan image or PDF</p>
                       <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500' }}>Powered by Advanced AI Vision</p>
                     </>
                   )}
                   <input id="file-upload" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} disabled={loading}/>
                 </div>
   
                 <div style={{ textAlign: 'center', margin: '24px 0', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }}/>
                    <span style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: 'var(--glass)', padding: '0 12px', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: '600' }}>OR ENTER MANUALLY</span>
                 </div>
   
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', '@media(min-width: 480px)': { gridTemplateColumns: '1fr 1fr' }}}>
                     <div className="input-group">
                       <label>Merchant Name</label>
                       <input type="text" placeholder="Leave empty for AI Auto-Detect" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} disabled={loading}/>
                     </div>
                     <div className="input-group">
                       <label>Date</label>
                       <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={loading}/>
                     </div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                     <div className="input-group">
                       <label>Amount ({userSettings.currencySymbol})</label>
                       <input type="number" step="0.01" placeholder="Auto-Detect" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} disabled={loading}/>
                     </div>
                     <div className="input-group">
                       <label>Category</label>
                       <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={loading}>
                         {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                     </div>
                   </div>
                 </div>
   
                 <button className="btn-primary" type="submit" disabled={loading || (!file && !formData.company)} style={{ width: '100%', marginTop: '32px', height: '56px', fontSize: '1.1rem' }}>
                   {loading ? <Loader2 className="animate-spin" /> : file && (!formData.amount || !formData.company) ? 'Analyze & Save Securely' : 'Save Transaction'}
                 </button>
               </form>
            )}
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {selectedBill && (
         <div className="modal-overlay" onClick={() => { if(!isEditing) setSelectedBill(null) }}>
            <div className="glass modal-content premium-card" onClick={e => e.stopPropagation()}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  {!isEditing ? (
                     <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                           <h2 style={{ fontSize: '1.8rem', lineHeight: 1 }}>{selectedBill.company}</h2>
                           {selectedBill.ocr_confidence === 'high' && (
                              <span className="badge badge-success"><CheckCircle2 size={12}/> Verified</span>
                           )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <span className={`badge ${selectedBill.category==='Food'?'badge-warning':selectedBill.category==='Shopping'?'badge-info':'badge-primary'}`}>{selectedBill.category}</span>
                           <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {selectedBill.date}</span>
                        </div>
                     </div>
                  ) : (
                     <h2 style={{ fontSize: '1.6rem' }}>Edit Transaction</h2>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                     {!isEditing && (
                        <>
                           <button className="btn-ghost" onClick={() => setIsEditing(true)}>
                              <Edit3 size={20} />
                           </button>
                           <button className="btn-ghost" style={{ color: 'var(--accent)' }} onClick={() => deleteBill(selectedBill._id)}>
                              <Trash2 size={20} />
                           </button>
                        </>
                     )}
                     <button className="btn-ghost" onClick={() => { setSelectedBill(null); setIsEditing(false); }}>
                        <X size={24} />
                     </button>
                  </div>
               </div>

               {!isEditing ? (
                  <div className="animate-fade-in">
                     <div className="detail-header">
                        <div className="detail-amount">{userSettings.currencySymbol}{parseFloat(selectedBill.amount).toLocaleString()}</div>
                     </div>

                     <div className="detail-grid" style={{ marginBottom: '24px' }}>
                        <div className="detail-item">
                           <div className="detail-item-label">Document ID</div>
                           <div className="detail-item-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedBill._id.substring(0,8).toUpperCase()}...</div>
                        </div>
                        <div className="detail-item">
                           <div className="detail-item-label">Upload Timestamp</div>
                           <div className="detail-item-value" style={{ fontSize: '0.8rem' }}>{new Date(selectedBill.upload_time).toLocaleString()}</div>
                        </div>
                     </div>

                     {selectedBill.notes && (
                        <div className="glass" style={{ padding: '16px', marginBottom: '24px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</h4>
                           <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedBill.notes}</p>
                        </div>
                     )}

                     {selectedBill.ocr_text && (
                        <div style={{ marginBottom: '24px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px' }}>Raw Extracted Data</h4>
                           <div className="glass" style={{ padding: '16px', background: 'var(--surface-active)', maxHeight: '120px', overflowY: 'auto', borderRadius: 'var(--radius-md)' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                 {selectedBill.ocr_text.length > 500 ? selectedBill.ocr_text.substring(0, 500) + '...' : selectedBill.ocr_text}
                              </p>
                           </div>
                        </div>
                     )}

                     {selectedBill.file_url && (
                        <div style={{ marginBottom: '24px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px' }}>Receipt Image</h4>
                           <div className="glass" style={{ padding: '8px', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                              <img 
                                 src={selectedBill.file_url.startsWith('http') ? selectedBill.file_url : `${API_URL}${selectedBill.file_url}`} 
                                 alt="Receipt" 
                                 style={{ width: '100%', borderRadius: 'var(--radius-md)', display: 'block' }}
                              />
                           </div>
                           <a 
                              href={selectedBill.file_url.startsWith('http') ? selectedBill.file_url : `${API_URL}${selectedBill.file_url}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn-secondary" 
                              style={{ width: '100%', justifyContent: 'center', height: '56px', fontSize: '1.05rem', color: 'var(--primary-light)', borderColor: 'var(--primary)', marginTop: '16px' }}
                           >
                              Open Full Size <ArrowUpRight size={18} />
                           </a>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     <div className="input-group">
                        <label>Merchant Name</label>
                        <input value={selectedBill.company} onChange={e => setSelectedBill({...selectedBill, company: e.target.value})} />
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                           <label>Amount</label>
                           <input type="number" step="0.01" value={selectedBill.amount} onChange={e => setSelectedBill({...selectedBill, amount: e.target.value})} />
                        </div>
                        <div className="input-group">
                           <label>Date</label>
                           <input type="date" value={selectedBill.date} onChange={e => setSelectedBill({...selectedBill, date: e.target.value})} />
                        </div>
                     </div>
                     <div className="input-group">
                        <label>Category</label>
                        <select value={selectedBill.category} onChange={e => setSelectedBill({...selectedBill, category: e.target.value})}>
                           {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="input-group">
                        <label>Notes</label>
                        <textarea value={selectedBill.notes || ''} onChange={e => setSelectedBill({...selectedBill, notes: e.target.value})} placeholder="Add custom notes..." />
                     </div>
                     <button className="btn-primary" onClick={updateBill} disabled={loading} style={{ height: '56px', marginTop: '16px' }}>
                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Save Changes</>}
                     </button>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} style={{ marginBottom: activeTab === 'home' ? '4px' : '2px', transition: 'all 0.2s' }} />
          Home
        </div>
        <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={22} style={{ marginBottom: activeTab === 'history' ? '4px' : '2px', transition: 'all 0.2s' }} />
          History
        </div>

        <div className="nav-item-center tooltip-wrapper" onClick={() => setShowUpload(true)}>
          <Plus size={28} strokeWidth={3} />
          <span className="tooltip-text" style={{ bottom: '130%' }}>New Scan</span>
        </div>

        <div className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <PieChart size={22} style={{ marginBottom: activeTab === 'insights' ? '4px' : '2px', transition: 'all 0.2s' }} />
          Insights
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} style={{ marginBottom: activeTab === 'settings' ? '4px' : '2px', transition: 'all 0.2s' }} />
          Settings
        </div>
      </nav>
    </div>
  );
}

export default App;
