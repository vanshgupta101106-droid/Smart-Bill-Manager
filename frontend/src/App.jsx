import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, Plus, FileText, Search, Filter, TrendingUp, 
  Calendar, DollarSign, Tag, Loader2, Trash2, CheckCircle2,
  AlertCircle, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

function App() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    const filtered = bills.filter(bill => 
      bill.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBills(filtered);
  }, [searchTerm, bills]);

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

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="header animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="glass" style={{ padding: '12px', borderRadius: '16px' }}>
            <FileText size={32} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>Smart Bill Manager</h1>
            <p style={{ color: 'var(--text-muted)' }}>AI-Powered Financial Tracking</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '12px' }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '12px 0', outline: 'none' }}
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? <X size={20} /> : <Plus size={20} />}
            {showUpload ? 'Cancel' : 'New Bill'}
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="bill-grid animate-fade-in" style={{ marginBottom: '40px' }}>
        <div className="glass premium-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Documents</span>
            <TrendingUp color="var(--success)" size={20} />
          </div>
          <h2 style={{ fontSize: '2rem' }}>{bills.length}</h2>
        </div>
        <div className="glass premium-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Expenditure</span>
            <DollarSign color="var(--primary)" size={20} />
          </div>
          <h2 style={{ fontSize: '2rem' }}>₹ {bills.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString()}</h2>
        </div>
        <div className="glass premium-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Recent Category</span>
            <Tag color="var(--secondary)" size={20} />
          </div>
          <h2 style={{ fontSize: '1.4rem' }}>{bills[0]?.category || 'N/A'}</h2>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="glass animate-fade-in" style={{ padding: '32px', marginBottom: '40px', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
             <h3>Smart Bill Upload</h3>
             <span style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <CheckCircle2 size={14} /> AI Auto-Detect Enabled
             </span>
          </div>
          
          <form onSubmit={handleUpload}>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  border: '2px dashed var(--glass-border)', 
                  padding: '40px', 
                  textAlign: 'center', 
                  borderRadius: '16px',
                  cursor: 'pointer',
                  background: file ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                  borderColor: file ? 'var(--primary)' : 'var(--glass-border)',
                  transition: 'all 0.3s'
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <div style={{ background: 'var(--surface)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Upload size={32} color={file ? 'var(--primary)' : 'var(--text-muted)'} />
                </div>
                <h4>{file ? file.name : 'Drop your bill here'}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>Images or PDFs supported. AI will extract details automatically.</p>
                <input id="file-upload" type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>Or fill details manually (Optional if uploading file)</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="input-group">
                <label>Merchant / Company</label>
                <input type="text" placeholder="e.g. Amazon" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '32px', height: '56px', justifyContent: 'center', fontSize: '1.1rem' }}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>AI is extracting details...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>Upload & Sync Bill</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Bill List */}
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--primary)" /> 
            {searchTerm ? `Results for "${searchTerm}"` : 'Recent Transactions'}
          </h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Showing {filteredBills.length} items</span>
        </div>

        {filteredBills.length === 0 ? (
          <div className="glass" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '24px' }}>
            <div style={{ background: 'var(--surface)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
               <AlertCircle size={40} opacity={0.3} />
            </div>
            <h3>No entries found</h3>
            <p>Ready to start tracking? Upload your first bill!</p>
          </div>
        ) : (
          <div className="bill-grid">
            {filteredBills.map((bill) => (
              <div key={bill.id || bill._id} className="glass premium-card animate-fade-in" style={{ padding: '24px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <span style={{ 
                    background: 'rgba(99, 102, 241, 0.15)', 
                    color: 'var(--primary)', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    {bill.category}
                  </span>
                  <button 
                    onClick={() => deleteBill(bill.id || bill._id)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(244, 63, 94, 0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(244, 63, 94, 0.4)'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>{bill.company}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                  <Calendar size={14} /> {bill.date}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit' }}>
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '400', marginRight: '4px' }}>₹</span>
                    {parseFloat(bill.amount).toLocaleString()}
                  </div>
                  <a 
                    href={`${API_URL}/uploads/${bill.filename}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      textDecoration: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--surface-hover)'
                    }}
                  >
                    View File
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
