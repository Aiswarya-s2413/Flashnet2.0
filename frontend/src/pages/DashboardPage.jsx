import { useState, useEffect } from 'react'
import API from '../api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Cell
} from 'recharts'
import { Activity, Package, Map, ShoppingCart, RefreshCcw, X, Search } from 'lucide-react'

// Custom Premium Tooltip Component
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {label && <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>}
        {payload.map((pld, idx) => (
          <p key={idx} style={{ margin: '4px 0 0 0', fontSize: '13.5px', fontWeight: 700, color: pld.color || 'var(--primary)' }}>
            {pld.name}: <span style={{ color: 'var(--text)' }}>{prefix}{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(pld.value)}{suffix}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Sub-component: Overview Tab
const OverviewTab = ({ metrics }) => {
  if (!metrics) return <div style={{textAlign: 'center', padding: 40, color: 'var(--text-muted)'}}>Loading metrics securely...</div>
  const { top_products, top_customers, monthly_progression, stock_levels } = metrics

  const formatNumber = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)

  return (
    <div>
      {/* Top Cards Grid */}
      <div className="stats-row">
        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="stat-label">Top Product</span>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0', color: 'var(--text)' }}>
              {top_products && top_products.length > 0 ? top_products[0].name : 'N/A'}
            </h3>
            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '20px', margin: 0 }}>
              {top_products && top_products.length > 0 ? formatNumber(top_products[0].volume) : 0}{' '}
              <span style={{fontSize: 13, color: 'var(--text-dim)', fontWeight: 500}}>KGs</span>
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'var(--accent-soft)', borderRadius: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="stat-label">Top Customer</span>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0', color: 'var(--text)' }}>
              {top_customers && top_customers.length > 0 ? top_customers[0].name : 'N/A'}
            </h3>
            <p style={{ color: '#2F7A60', fontWeight: 800, fontSize: '20px', margin: 0 }}>
              {top_customers && top_customers.length > 0 ? formatNumber(top_customers[0].volume) : 0}{' '}
              <span style={{fontSize: 13, color: 'var(--text-dim)', fontWeight: 500}}>KGs</span>
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(47, 122, 96, 0.1)', borderRadius: 12, color: '#2F7A60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={24} />
          </div>
        </div>
      </div>

      {/* Progression Area Chart */}
      <div className="card" style={{ padding: 24, height: 420 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800' }}>Monthly Progression Overview</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '4px 0 0 0' }}>Volume fluctuations extracted from monthly sales</p>
        </div>
        {monthly_progression && monthly_progression.length > 0 ? (
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={monthly_progression} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B3B2C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0B3B2C" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(val) => val ? String(val).substring(0, 10) : ''} />
              <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} width={60} tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" KGs" />} />
              <Area type="monotone" dataKey="volume" name="Volume" stroke="#0B3B2C" strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No monthly sales data found natively.</div>
        )}
      </div>

      {/* Split Bars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: 24, height: 380 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: '800' }}>Top Products by Volume</h3>
          {top_products && top_products.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart layout="vertical" data={top_products} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: 'var(--text-muted)', fontSize: 11}} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix=" KGs" />} cursor={{fill: 'var(--bg)', opacity: 0.5}} />
                <Bar dataKey="volume" name="Volume" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {(top_products || []).map((entry, index) => {
                    const colors = ['#0B3B2C', '#2F7A60', '#5BA28A', '#3D6A8A'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No products found structurally.</div>
          )}
        </div>

        <div className="card" style={{ padding: 24, height: 380 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: '800' }}>Top Current Monthly Stock Levels</h3>
          {stock_levels && stock_levels.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart layout="vertical" data={stock_levels.slice(0, 5)} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: 'var(--text-muted)', fontSize: 11}} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix=" KGs" />} cursor={{fill: 'var(--bg)', opacity: 0.5}} />
                <Bar dataKey="stock" name="Stock" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {(stock_levels || []).slice(0, 5).map((entry, index) => {
                    const colors = ['#0B3B2C', '#2F7A60', '#5BA28A', '#3D6A8A'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
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
  const [selectedRow, setSelectedRow] = useState(null)
  const [prodSearch, setProdSearch] = useState('')

  useEffect(() => {
    if (!selectedRow) {
      setProdSearch('')
    }
  }, [selectedRow])

  if (!data) return <div style={{textAlign: 'center', padding: 40, color: 'var(--text-muted)'}}>Loading Analytics Pipeline...</div>

  const { kpis, monthly_trend, distributor_performance, customer_performance } = data

  const formatLakhs = (val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`
  const formatCrores = (val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(1)} Cr` : formatLakhs(val)

  return (
    <div>
      {/* Time filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-secondary" style={{ padding: '8px 18px' }}>MTD</button>
        <button className="btn btn-secondary" style={{ padding: '8px 18px' }}>QTD</button>
        <button className="btn btn-primary" style={{ padding: '8px 18px' }}>YTD</button>
        <button className="btn btn-secondary" style={{ padding: '8px 18px' }}>Last Year</button>
        <div style={{ flex: 1 }}></div>
        <select className="form-control" style={{ width: 150, padding: '8px 12px' }}><option>All Zones</option></select>
        <select className="form-control" style={{ width: 180, padding: '8px 12px' }}><option>All Distributors</option></select>
      </div>

      {/* KPI Cards */}
      <div className="stats-row">
        <div className="stat-card" style={{ borderLeft: '4px solid #0B3B2C' }}>
          <span className="stat-label">Primary Sales (PS)</span>
          <span className="stat-value" style={{ color: '#0B3B2C' }}>{formatCrores(kpis?.total_primary || 0)}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #2F7A60' }}>
          <span className="stat-label">Secondary Sales (SS)</span>
          <span className="stat-value" style={{ color: '#2F7A60' }}>{formatCrores(kpis?.total_secondary || 0)}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3D6A8A' }}>
          <span className="stat-label">Channel Efficiency (SS/PS)</span>
          <span className="stat-value" style={{ color: '#3D6A8A' }}>{kpis?.channel_efficiency || 0}%</span>
        </div>
      </div>

      {/* Composed Chart */}
      <div className="card" style={{ padding: 24, height: 420, marginBottom: '32px' }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800' }}>Monthly Primary vs Secondary Sales Trend</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '4px 0 0 0' }}>
            Primary & Secondary Sales (Left Axis, INR Lakhs) vs. Channel Efficiency (Right Axis, %)
          </p>
        </div>
        <ResponsiveContainer width="100%" height="78%">
          <ComposedChart data={monthly_trend} margin={{ top: 10, right: -10, bottom: 20, left: -10 }}>
            <defs>
              <linearGradient id="colorPrimarySales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B3B2C" stopOpacity={1}/>
                <stop offset="100%" stopColor="#0B3B2C" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="colorSecondarySales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2F7A60" stopOpacity={1}/>
                <stop offset="100%" stopColor="#2F7A60" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} tick={{fill: 'var(--text-dim)', fontSize: 11}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{fill: 'var(--bg)', opacity: 0.5}} />
            <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
            <Bar yAxisId="left" name="Primary Sales" dataKey="Primary Sales" fill="url(#colorPrimarySales)" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar yAxisId="left" name="Secondary Sales" dataKey="Secondary Sales" fill="url(#colorSecondarySales)" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Line yAxisId="right" name="Efficiency %" type="monotone" dataKey="Efficiency %" stroke="#3D6A8A" strokeWidth={3} dot={{r: 4, fill: '#3D6A8A'}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Floating tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800' }}>Distributors Performance</h3>
             <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>Grouped by Network</span>
          </div>
          <div className="table-wrapper" style={{ marginBottom: 32 }}>
            <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
               <thead>
                 <tr>
                   <th>Distributor Name</th>
                   <th>Sold To</th>
                   <th>Ship To</th>
                   <th>Primary Sales</th>
                 </tr>
               </thead>
               <tbody>
                 {(distributor_performance || []).map((row, i) => (
                   <tr key={i} onClick={() => setSelectedRow(row)} style={{ cursor: 'pointer' }}>
                     <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.group}</td>
                     <td style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.sold_to}</td>
                     <td style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.ship_to}</td>
                     <td style={{ fontWeight: 700 }}>{formatLakhs(row.primary)}</td>
                   </tr>
                 ))}
                 {!(distributor_performance?.length > 0) && (
                   <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No distributor metrics extracted.</td></tr>
                 )}
               </tbody>
               <tfoot>
                 <tr style={{ backgroundColor: 'transparent' }}>
                   <td colSpan="3" style={{ fontWeight: 'bold', textAlign: 'right', padding: '16px', border: 'none' }}>TOTAL PRIMARY KPI:</td>
                   <td style={{ fontWeight: '800', fontSize: 16, color: 'var(--primary)', border: 'none', padding: '16px' }}>{formatCrores(kpis?.total_primary || 0)}</td>
                 </tr>
               </tfoot>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800' }}>Customers Performance</h3>
             <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>Top 50 by Secondary Sales</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
               <thead>
                 <tr>
                   <th>Customer Name</th>
                   <th>Sold To</th>
                   <th>Ship To</th>
                   <th>Secondary Sales</th>
                 </tr>
               </thead>
               <tbody>
                 {(customer_performance || []).map((row, i) => (
                   <tr key={i} onClick={() => setSelectedRow(row)} style={{ cursor: 'pointer' }}>
                     <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.group}</td>
                     <td style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.sold_to}</td>
                     <td style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.ship_to}</td>
                     <td style={{ fontWeight: 700 }}>{formatLakhs(row.secondary)}</td>
                   </tr>
                 ))}
                 {!(customer_performance?.length > 0) && (
                   <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No customer metrics extracted.</td></tr>
                 )}
               </tbody>
               <tfoot>
                 <tr style={{ backgroundColor: 'transparent' }}>
                   <td colSpan="3" style={{ fontWeight: 'bold', textAlign: 'right', padding: '16px', border: 'none' }}>TOTAL SECONDARY KPI:</td>
                   <td style={{ fontWeight: '800', fontSize: 16, color: 'var(--green)', border: 'none', padding: '16px' }}>{formatCrores(kpis?.total_secondary || 0)}</td>
                 </tr>
               </tfoot>
            </table>
          </div>
        </div>
      </div>
      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Performance details</h2>
              <button className="btn btn-outline" style={{ padding: '6px 8px', borderRadius: '50%' }} onClick={() => setSelectedRow(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {Object.entries(selectedRow)
                .filter(([key]) => key !== 'products')
                .map(([key, val]) => {
                  const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={key} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{formattedKey}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '600', wordBreak: 'break-all' }}>
                        {key === 'primary' || key === 'secondary' 
                          ? `₹${Number(val).toLocaleString('en-IN')}` 
                          : key === 'efficiency'
                            ? `${val}%`
                            : String(val ?? '-')}
                      </span>
                    </div>
                  );
                })}
            </div>

            {selectedRow.products && selectedRow.products.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>Products Sold</h3>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      value={prodSearch}
                      onChange={e => setProdSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 12px 6px 30px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="data-table" style={{ width: '100%', minWidth: 'auto', fontSize: '13px', margin: 0 }}>
                    <thead style={{ background: 'var(--bg)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Product Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Primary Sales</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Secondary Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRow.products
                        .filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()))
                        .map((p, idx, arr) => (
                          <tr key={idx} style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)', background: 'transparent' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text)', fontWeight: '600' }}>{p.name}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {p.primary_val > 0 ? `₹${p.primary_val.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {p.secondary_val > 0 ? `₹${p.secondary_val.toLocaleString('en-IN')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      {selectedRow.products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)' }}>
                            No matching products found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-component: Asymmetric Tab for mismatch details
const AsymmetricTab = ({ data }) => {
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [prodSearch, setProdSearch] = useState('')
  const [oversoldMonthFilter, setOversoldMonthFilter] = useState('All')
  const [oversoldSearch, setOversoldSearch] = useState('')
  const [minOversoldVal, setMinOversoldVal] = useState(0)

  useEffect(() => {
    if (!selectedMonth) {
      setProdSearch('')
    }
  }, [selectedMonth])

  if (!data) return <div style={{textAlign: 'center', padding: 40, color: 'var(--text-muted)'}}>Loading asymmetry details...</div>

  const { kpis, raw_kpis, monthly_comparison } = data

  const formatLakhs = (val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`
  const formatCrores = (val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(1)} Cr` : formatLakhs(val)

  const diffPrimary = (raw_kpis?.total_primary || 0) - (kpis?.total_primary || 0)

  // Calculate matched months totals for table footer
  const matchedMonths = (monthly_comparison || []).filter(row => row.included)
  const totalPSMatched = matchedMonths.reduce((sum, row) => sum + row.ps, 0)
  const totalSSMatched = matchedMonths.reduce((sum, row) => sum + row.ss, 0)
  const totalDiffMatched = totalSSMatched - totalPSMatched

  // Extract all product records across all months
  const allProductMonths = [];
  (monthly_comparison || []).forEach(m => {
    if (m.products) {
      m.products.forEach(p => {
        if (p.ss > p.ps) {
          allProductMonths.push({
            month: m.month,
            name: p.name,
            ps: p.ps,
            ss: p.ss,
            efficiency: p.efficiency,
            difference: p.difference
          });
        }
      });
    }
  });

  // Sort by difference descending
  allProductMonths.sort((a, b) => b.difference - a.difference)

  const uniqueMonths = Array.from(new Set(allProductMonths.map(p => p.month))).sort()

  const filteredOversold = allProductMonths.filter(p => {
    const matchesMonth = oversoldMonthFilter === 'All' || p.month === oversoldMonthFilter;
    const matchesSearch = p.name.toLowerCase().includes(oversoldSearch.toLowerCase());
    const matchesVal = p.difference >= minOversoldVal;
    return matchesMonth && matchesSearch && matchesVal;
  })

  return (
    <div>
      {/* Comparison KPI Cards */}
      <div className="stats-row" style={{ marginBottom: 32 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0B3B2C', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="stat-label" style={{ display: 'block', marginBottom: 4 }}>Filtered KPI (Matched Months)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>PS: <strong>{formatCrores(kpis?.total_primary || 0)}</strong></span>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>SS: <strong>{formatCrores(kpis?.total_secondary || 0)}</strong></span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span className="stat-value" style={{ color: '#0B3B2C', fontSize: 24 }}>{kpis?.channel_efficiency || 0}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>Oct 25 - Feb 26 (Shared)</span>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800' }}>Asymmetric Month-by-Month Details</h3>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>Comparing Primary vs Secondary Sales (Click row for details)</span>
        </div>

        <div className="table-wrapper">
          <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Primary Sales (PS)</th>
                <th>Secondary Sales (SS)</th>
                <th>Efficiency %</th>
                <th>Difference (SS - PS)</th>
                <th>Inclusion Status</th>
              </tr>
            </thead>
            <tbody>
              {(monthly_comparison || []).filter(row => row.included).map((row, i) => (
                <tr key={i} onClick={() => setSelectedMonth(row)} style={{ transition: 'all 0.2s', cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.month}</td>
                  <td>{formatLakhs(row.ps)}</td>
                  <td>{row.ss > 0 ? formatLakhs(row.ss) : '₹0.0'}</td>
                  <td style={{ fontWeight: 700, color: row.efficiency > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {row.efficiency > 0 ? `${row.efficiency}%` : '0%'}
                  </td>
                  <td style={{ 
                    fontWeight: 600, 
                    color: row.difference > 0 ? '#10B981' : row.difference < 0 ? '#EF4444' : 'var(--text-muted)'
                  }}>
                    {row.difference !== 0 ? `${row.difference > 0 ? '+' : ''}${formatLakhs(row.difference)}` : '₹0.0'}
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '700', 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                      color: '#10B981' 
                    }}>
                      Included (Matched)
                    </span>
                  </td>
                </tr>
              ))}
              {!(monthly_comparison?.length > 0) && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    No comparison data available.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--surface-alt)', borderTop: '2px solid var(--border)', fontWeight: '800' }}>
                <td style={{ padding: '16px 12px', color: 'var(--text)' }}>TOTALS:</td>
                <td style={{ padding: '16px 12px', color: 'var(--text)' }}>{formatLakhs(totalPSMatched)}</td>
                <td style={{ padding: '16px 12px', color: 'var(--text)' }}>{formatLakhs(totalSSMatched)}</td>
                <td style={{ padding: '16px 12px', color: 'var(--primary)' }}>
                  {totalPSMatched > 0 ? `${((totalSSMatched / totalPSMatched) * 100).toFixed(2)}%` : '0%'}
                </td>
                <td style={{ 
                  padding: '16px 12px', 
                  color: totalDiffMatched > 0 ? '#10B981' : totalDiffMatched < 0 ? '#EF4444' : 'var(--text-muted)'
                }}>
                  {totalDiffMatched !== 0 ? `${totalDiffMatched > 0 ? '+' : ''}${formatLakhs(totalDiffMatched)}` : '₹0.0'}
                </td>
                <td style={{ padding: '16px 12px' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Oversold Products Section */}
      <div className="card" style={{ padding: '32px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800' }}>Oversold Products Analysis (All Months)</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '4px 0 0 0' }}>Products where Secondary Sales (SS) exceed Primary Sales (PS)</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Filter Month</span>
              <select 
                className="form-control" 
                value={oversoldMonthFilter} 
                onChange={e => setOversoldMonthFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '120px' }}
              >
                <option value="All">All Months</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Search Product</span>
              <div style={{ position: 'relative', width: '200px' }}>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={oversoldSearch}
                  onChange={e => setOversoldSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 12px 6px 30px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Min Difference</span>
              <select 
                className="form-control" 
                value={minOversoldVal} 
                onChange={e => setMinOversoldVal(Number(e.target.value))}
                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '130px' }}
              >
                <option value={0}>Show All</option>
                <option value={100000}>&ge; ₹1 Lakh</option>
                <option value={500000}>&ge; ₹5 Lakhs</option>
                <option value={1000000}>&ge; ₹10 Lakhs</option>
                <option value={2000000}>&ge; ₹20 Lakhs</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Product Name</th>
                <th>Month</th>
                <th>Primary Sales (PS)</th>
                <th>Secondary Sales (SS)</th>
                <th>Oversold Difference</th>
                <th>Efficiency %</th>
              </tr>
            </thead>
            <tbody>
              {filteredOversold.map((row, i) => (
                <tr key={i} style={{ transition: 'all 0.2s' }}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{row.month}</td>
                  <td>{row.ps > 0 ? formatLakhs(row.ps) : '-'}</td>
                  <td>{row.ss > 0 ? formatLakhs(row.ss) : '₹0.0'}</td>
                  <td style={{ fontWeight: 700, color: '#10B981' }}>
                    +{formatLakhs(row.difference)}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {row.ps > 0 ? `${row.efficiency.toFixed(1)}%` : 'SS Only'}
                  </td>
                </tr>
              ))}
              {filteredOversold.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No oversold products found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Month Details Modal */}
      {selectedMonth && (
        <div className="modal-overlay" onClick={() => setSelectedMonth(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Sales Details for {selectedMonth.month}</h2>
              <button className="btn btn-outline" style={{ padding: '6px 8px', borderRadius: '50%' }} onClick={() => setSelectedMonth(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Primary Sales</span>
                <span style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: '700' }}>{formatCrores(selectedMonth.ps)}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Secondary Sales</span>
                <span style={{ fontSize: '16px', color: '#10B981', fontWeight: '700' }}>{formatCrores(selectedMonth.ss)}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Channel Efficiency</span>
                <span style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '700' }}>{selectedMonth.efficiency}%</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Difference (SS - PS)</span>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: selectedMonth.difference > 0 ? '#10B981' : selectedMonth.difference < 0 ? '#EF4444' : 'var(--text-muted)'
                }}>
                  {selectedMonth.difference !== 0 ? `${selectedMonth.difference > 0 ? '+' : ''}${formatCrores(selectedMonth.difference)}` : '₹0.0'}
                </span>
              </div>
            </div>

            {/* Product-Wise Details */}
            {selectedMonth.products && selectedMonth.products.length > 0 ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>Product Performance breakdown</h3>
                  <div style={{ position: 'relative', width: '240px' }}>
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      value={prodSearch}
                      onChange={e => setProdSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 12px 6px 30px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', minWidth: 'auto', fontSize: '13px', margin: 0 }}>
                    <thead style={{ background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Product Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Primary Sales (PS)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Secondary Sales (SS)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Efficiency %</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-dim)', fontSize: '11px' }}>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMonth.products
                        .filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()))
                        .map((p, idx, arr) => (
                          <tr key={idx} style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)', background: 'transparent' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: '600' }}>{p.name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {p.ps > 0 ? formatLakhs(p.ps) : '-'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {p.ss > 0 ? formatLakhs(p.ss) : '-'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: p.efficiency > 0 ? 'var(--primary)' : 'var(--text-dim)' }}>
                              {p.efficiency > 0 ? `${p.efficiency}%` : '-'}
                            </td>
                            <td style={{ 
                              padding: '10px 12px', 
                              textAlign: 'right', 
                              fontWeight: '600', 
                              color: p.difference > 0 ? '#10B981' : p.difference < 0 ? '#EF4444' : 'var(--text-muted)'
                            }}>
                              {p.difference !== 0 ? `${p.difference > 0 ? '+' : ''}${formatLakhs(p.difference)}` : '₹0.0'}
                            </td>
                          </tr>
                        ))}
                      {selectedMonth.products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)' }}>
                            No matching products found in this month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                No product-wise breakdown available for this month.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics')
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
         <span className="spinner" style={{ width: 40, height: 40, marginBottom: 16 }} />
         <p style={{ color: 'var(--text-muted)' }}>Aggregating dynamic matrices natively...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '16px' }}>Executive Analytics</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Primary vs Secondary Analytics
            </button>
            <button 
              className={`btn ${activeTab === 'asymmetric' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('asymmetric')}
            >
              Asymmetric Table
            </button>
            <button 
              className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </div>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
           <RefreshCcw size={14} /> Last synced freshly via endpoints
        </div>
      </div>

      <div className="tab-content" style={{ animation: 'fadeIn 0.3s' }}>
        {activeTab === 'overview' ? (
          <OverviewTab metrics={metrics} />
        ) : activeTab === 'asymmetric' ? (
          <AsymmetricTab data={analytics} />
        ) : (
          <AnalyticsTab data={analytics} />
        )}
      </div>
    </div>
  )
}
