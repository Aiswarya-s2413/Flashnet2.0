import { useState, useEffect } from 'react'
import API from '../api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts'
import { Activity, Package, Map, ShoppingCart, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'

// Sub-component: Overview Tab (Original Dashboard)
const OverviewTab = ({ metrics }) => {
  if (!metrics) return <div style={{textAlign: 'center', padding: 40}}>Loading metrics securely...</div>
  const { top_products, top_customers, monthly_progression, stock_levels } = metrics

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  const formatNumber = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Top Product</p>
            <h3 style={{ fontSize: 20, margin: '0 0 4px 0', lineHeight: 1.3 }}>{top_products && top_products.length > 0 ? top_products[0].name : 'N/A'}</h3>
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 18 }}>
              {top_products && top_products.length > 0 ? formatNumber(top_products[0].volume) : 0} <span style={{fontSize: 14, color: 'var(--text-dim)', fontWeight: 400}}>KGs</span>
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 12, color: 'var(--primary)' }}><Package size={24} /></div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Top Customer</p>
             <h3 style={{ fontSize: 20, margin: '0 0 4px 0', lineHeight: 1.3 }}>{top_customers && top_customers.length > 0 ? top_customers[0].name : 'N/A'}</h3>
            <p style={{ color: '#10b981', fontWeight: 600, fontSize: 18 }}>
              {top_customers && top_customers.length > 0 ? formatNumber(top_customers[0].volume) : 0} <span style={{fontSize: 14, color: 'var(--text-dim)', fontWeight: 400}}>KGs</span>
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, color: '#10b981' }}><ShoppingCart size={24} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: 24, height: 400 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Monthly Progression Overview</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: '4px 0 0 0' }}>Volume fluctuations extracted from monthly sales</p>
          </div>
          {monthly_progression && monthly_progression.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={monthly_progression} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} tickFormatter={(val) => val ? String(val).substring(0, 10) : ''} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} width={60} tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [formatNumber(value) + ' KGs', 'Volume']} labelFormatter={(label) => label ? String(label).substring(0, 10) : ''} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} />
                <Area type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No monthly sales data found natively.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: 24, height: 350 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>Top Products by Volume</h3>
          {top_products && top_products.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart layout="vertical" data={top_products} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: 'var(--text-dim)', fontSize: 11}} width={120} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [formatNumber(value) + ' KGs', 'Volume']} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }} cursor={{fill: 'var(--bg)'}} />
                <Bar dataKey="volume" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No products found structurally.</div>
          )}
        </div>

        <div className="card" style={{ padding: 24, height: 350 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>Top Current Monthly Stock Levels</h3>
          {stock_levels && stock_levels.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={stock_levels.slice(0, 5)} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-dim)', fontSize: 11}} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} width={60} tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [formatNumber(value) + ' KGs', 'Inventory']} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }} cursor={{fill: 'var(--bg)'}} />
                <Bar dataKey="stock" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No stock levels extracted.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-component: Analytics Tab
const AnalyticsTab = ({ data }) => {
  if (!data) return <div style={{textAlign: 'center', padding: 40}}>Loading Analytics Pipeline...</div>

  const { kpis, monthly_trend, distributor_performance, product_group } = data

  const formatLakhs = (val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`
  const formatCrores = (val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(1)} Cr` : formatLakhs(val)

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-dim)' }}>MTD</button>
        <button className="btn btn-secondary" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-dim)' }}>QTD</button>
        <button className="btn btn-primary">YTD</button>
        <button className="btn btn-secondary" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-dim)' }}>Last Year</button>
        <div style={{ flex: 1 }}></div>
        <select className="form-control" style={{ width: 140, display: 'inline-block' }}><option>All Zones</option></select>
        <select className="form-control" style={{ width: 140, display: 'inline-block' }}><option>All Distributors</option></select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: 24, borderLeft: '4px solid #3b82f6' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Primary Sales (PS)</p>
          <h3 style={{ fontSize: 26, margin: '0 0 12px 0', lineHeight: 1.3 }}>{formatCrores(kpis?.total_primary || 0)}</h3>
        </div>
        <div className="card" style={{ padding: 24, borderLeft: '4px solid #10b981' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Secondary Sales (SS)</p>
          <h3 style={{ fontSize: 26, margin: '0 0 12px 0', lineHeight: 1.3 }}>{formatCrores(kpis?.total_secondary || 0)}</h3>
        </div>
        <div className="card" style={{ padding: 24, borderLeft: '4px solid #f59e0b' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Channel Efficiency (SS/PS)</p>
          <h3 style={{ fontSize: 26, margin: '0 0 12px 0', lineHeight: 1.3 }}>{kpis?.channel_efficiency || 0}%</h3>
        </div>
      </div>

      <div className="card" style={{ padding: 24, height: 400, marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>Monthly Primary vs Secondary Sales Trend</h3>
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={monthly_trend} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
             <XAxis dataKey="month" tick={{fill: 'var(--text-dim)', fontSize: 12}} axisLine={false} tickLine={false} />
             <YAxis yAxisId="left" tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} tick={{fill: 'var(--text-dim)', fontSize: 12}} axisLine={false} tickLine={false} />
             <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} tick={{fill: 'var(--text-dim)', fontSize: 12}} axisLine={false} tickLine={false} />
             <Tooltip cursor={{fill: 'var(--bg)'}} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }} />
             <Legend wrapperStyle={{ paddingTop: 20 }} />
             <Bar yAxisId="left" dataKey="Primary Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
             <Bar yAxisId="left" dataKey="Secondary Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
             <Line yAxisId="right" type="monotone" dataKey="Efficiency %" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: 24, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <h3 style={{ margin: 0, fontSize: 16 }}>Distributor-wise Performance</h3>
             <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Grouped by Network</span>
          </div>
          <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
             <thead>
               <tr>
                 <th>Group</th>
                 <th>Sold To</th>
                 <th>Ship To</th>
                 <th>Primary Sales</th>
                 <th>Secondary Sales</th>
                 <th>Efficiency</th>
               </tr>
             </thead>
             <tbody>
               {(distributor_performance || []).map((row, i) => (
                 <tr key={i}>
                   <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.group}</td>
                   <td style={{ color: 'var(--text-dim)', fontSize: 13, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.sold_to}</td>
                   <td style={{ color: 'var(--text-dim)', fontSize: 13, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.ship_to}</td>
                   <td style={{ fontWeight: 500 }}>{formatLakhs(row.primary)}</td>
                   <td style={{ fontWeight: 500 }}>{formatLakhs(row.secondary)}</td>
                   <td>
                     <span className={`badge ${row.efficiency >= 80 ? 'badge-green' : row.efficiency >= 50 ? 'badge-amber' : 'badge-red'}`}>
                       {row.efficiency}%
                     </span>
                   </td>
                 </tr>
               ))}
               {!(distributor_performance && distributor_performance.length > 0) && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No distributor metrics extracted.</td></tr>
               )}
             </tbody>
             <tfoot>
               <tr style={{ backgroundColor: 'var(--surface)' }}>
                 <td colSpan="3" style={{ fontWeight: 'bold', textAlign: 'right', padding: '16px' }}>TOTAL KPI:</td>
                 <td style={{ fontWeight: 'bold', fontSize: 15, color: '#3b82f6', borderTop: '2px solid var(--border)' }}>{formatCrores(kpis?.total_primary || 0)}</td>
                 <td style={{ fontWeight: 'bold', fontSize: 15, color: '#10b981', borderTop: '2px solid var(--border)' }}>{formatCrores(kpis?.total_secondary || 0)}</td>
                 <td style={{ fontWeight: 'bold', fontSize: 15, color: '#f59e0b', borderTop: '2px solid var(--border)' }}>{kpis?.channel_efficiency || 0}%</td>
               </tr>
             </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [metricRes, analyticsRes] = await Promise.all([
          API.get('/dashboard/metrics/'),
          API.get('/dashboard/analytics-ps-ss/')
        ])
        const metricData = metricRes.data
        if (metricData.stock_levels) metricData.stock_levels.sort((a, b) => b.stock - a.stock)
        setMetrics(metricData)
        setAnalytics(analyticsRes.data)
      } catch (e) {
        console.error("Dashboard fetch error:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
         <span className="spinner" style={{ width: 40, height: 40, borderBottomColor: 'var(--primary)', marginBottom: 16 }} />
         <p style={{ color: 'var(--text-dim)' }}>Aggregating dynamic matrices natively...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '16px' }}>Executive Analytics</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('overview')}
              style={activeTab !== 'overview' ? { backgroundColor: 'var(--surface)', color: 'var(--text-dim)' } : {}}
            >
              Overview
            </button>
            <button 
              className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('analytics')}
              style={activeTab !== 'analytics' ? { backgroundColor: 'var(--surface)', color: 'var(--text-dim)' } : {}}
            >
              Primary vs Secondary Analytics
            </button>
          </div>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
           <RefreshCcw size={14} /> Last synced freshly via endpoints
        </div>
      </div>

      <div className="tab-content" style={{ animation: 'fadeIn 0.3s' }}>
        {activeTab === 'overview' ? <OverviewTab metrics={metrics} /> : <AnalyticsTab data={analytics} />}
      </div>
    </div>
  )
}
