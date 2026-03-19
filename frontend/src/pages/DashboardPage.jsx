import { useState, useEffect, useMemo } from 'react'
import API from '../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Filter } from 'lucide-react'

// colors for pie chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

// Helper to convert DD-MM-YYYY to standard JS Date for sorting
const parseDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr); // fallback if incorrect format
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await API.get('/invoices/')
        setInvoices(res.data)
      } catch (e) {
        console.error("Dashboard fetch error:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter data based on controls
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = parseDDMMYYYY(inv.invoice_date).getTime();
      let passStart = true, passEnd = true;

      // HTML date input yields YYYY-MM-DD
      if (startDate) {
        const start = new Date(startDate).getTime();
        // compare timestamps
        if (invDate < start) passStart = false;
      }
      if (endDate) {
        // adjust to exact end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (invDate > end.getTime()) passEnd = false;
      }

      return passStart && passEnd;
    });
  }, [invoices, startDate, endDate])

  // Overview Stats
  const totalQty = filteredInvoices.reduce((sum, i) => sum + i.qty, 0)
  const uniqueInvoices = new Set(filteredInvoices.map(i => i.invoice_no)).size
  const uniqueDistributorsStr = new Set(filteredInvoices.map(i => i.customer)).size

  // Bar Chart Data (Product-wise Qty)
  const productData = useMemo(() => {
    const aggr = {};
    filteredInvoices.forEach(inv => {
      const pName = inv.material_name;
      if (!aggr[pName]) aggr[pName] = 0;
      aggr[pName] += inv.qty;
    });
    return Object.entries(aggr)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty) // descending sort
  }, [filteredInvoices])

  // Pie Chart Data (Top 5 + Others)
  const pieData = useMemo(() => {
    if (productData.length <= 5) return productData;
    const top5 = productData.slice(0, 5);
    const othersQty = productData.slice(5).reduce((s, p) => s + p.qty, 0);
    return [...top5, { name: 'Others', qty: othersQty }];
  }, [productData])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales Dashboard</h1>
        <p className="page-subtitle">Interactive dataset analysis and product quantities</p>
      </div>

      <div className="filter-panel" style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} />
          <strong style={{ opacity: 0.9 }}>Data Filters:</strong>
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '12px', opacity: 0.8, display: 'block' }}>Start Date <small>(applies to DD-MM-YYYY)</small></label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '12px', opacity: 0.8, display: 'block' }}>End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}
          />
        </div>

        <button 
          className="btn btn-outline"
          onClick={() => { setStartDate(''); setEndDate(''); }}
          style={{ alignSelf: 'flex-end', padding: '8px 16px', marginLeft: 'auto' }}
        >
          Reset Filters
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Qty Sold</span>
          <span className="stat-value stat-green">{totalQty.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Invoices Analyzed</span>
          <span className="stat-value stat-accent">{uniqueInvoices.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Distributors</span>
          <span className="stat-value">{uniqueDistributorsStr.toLocaleString()}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-dim)' }}>Loading dashboard...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="empty-state" style={{ padding: '50px', background: 'var(--bg-secondary)', borderRadius: '12px', marginTop: '20px' }}>
          <p>No sales data matches the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', opacity: 0.9 }}>Product-wise Quantity (Sorted)</h3>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={productData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    height={80} 
                    tick={{ fontSize: 11, fill: 'var(--text-dim)' }} 
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-dim)' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="qty" name="Total Quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
             <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '24px', opacity: 0.9 }}>Volume Share Overview</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="qty"
                        nameKey="name"
                        label={({ name, percent }) => `${name.substring(0, 15)}${name.length > 15 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

        </div>
      )}
    </div>
  )
}
