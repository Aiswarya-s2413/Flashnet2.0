import { useState, useEffect, useMemo } from 'react'
import API from '../api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts'
import {
  Users, Award, TrendingUp, Package, RefreshCw, Search, X, ChevronRight, Filter, DollarSign, Briefcase
} from 'lucide-react'
import { useSortableData, SortHeader } from '../components/SortableTable'
import Pagination from '../components/Pagination'

const ROWS_PER_PAGE = 15

// Clean Custom Tooltip
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: 160
      }}>
        {label && (
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </p>
        )}
        {payload.map((pld, idx) => {
          const isAsp = pld.name === 'ASP' || pld.name?.toLowerCase().includes('asp')
          const isVol = pld.name === 'Volume' || pld.name?.toLowerCase().includes('volume')
          let formatted = ''
          let prefix = '₹'
          let suffix = ''

          if (isVol) {
            prefix = ''
            suffix = ' KG'
            formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(pld.value)
          } else if (isAsp) {
            suffix = ' / KG'
            formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(pld.value)
          } else {
            if (pld.value >= 10000000) {
              formatted = `${(pld.value / 10000000).toFixed(2)} Cr`
            } else if (pld.value >= 100000) {
              formatted = `${(pld.value / 100000).toFixed(2)} L`
            } else {
              formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(pld.value)
            }
          }

          return (
            <p key={idx} style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: pld.color || 'var(--primary)' }}>
              {pld.name}: <span style={{ color: 'var(--text)' }}>{prefix}{formatted}{suffix}</span>
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

export default function SalesExecAnalysisPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExec, setSelectedExec] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedMonth && selectedMonth !== 'all') params.month = selectedMonth
      if (selectedDivision && selectedDivision !== 'all') params.division = selectedDivision
      const res = await API.get('/analytics/sales-exec/', { params })
      setData(res.data)
      if (selectedExec && res.data?.executives) {
        const updated = res.data.executives.find(e => e.name === selectedExec.name)
        if (updated) setSelectedExec(updated)
      }
    } catch (e) {
      console.error('Failed to fetch sales exec analytics:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedDivision])

  const formatLakhs = (val) => {
    if (!val) return '₹0'
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
    return `₹${Math.round(val).toLocaleString('en-IN')}`
  }

  const formatQty = (val) => {
    if (!val) return '0 KG'
    if (val >= 1000) return `${(val / 1000).toFixed(1)} MT`
    return `${Math.round(val).toLocaleString('en-IN')} KG`
  }

  // Filtered executive list
  const filteredExecutives = useMemo(() => {
    if (!data?.executives) return []
    if (!searchQuery.trim()) return data.executives
    const q = searchQuery.toLowerCase().trim()
    return data.executives.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.primary_division?.toLowerCase().includes(q)
    )
  }, [data?.executives, searchQuery])

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filteredExecutives, { key: 'total_revenue', direction: 'desc' })

  const kpis = data?.kpis || {}

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Title & Refresh */}
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
            Sales Executive Performance Analysis
          </h1>
          <p style={{ color: 'var(--text-dim)', margin: '4px 0 0 0', fontSize: 13.5 }}>
            Representative revenue benchmarking, volume trends, average selling prices, and territory accounts.
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchData}
          disabled={loading}
          style={{ fontSize: 13, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </div>

      {/* Structured Top KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 28
      }}>
        {/* Card 1: Active Execs */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid #0B3B2C',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
              Active Executives
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'var(--accent-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0B3B2C', lineHeight: 1.1, marginBottom: 6 }}>
              {kpis.total_executives || 0}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
              Across all business segments
            </div>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid #2F7A60',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
              Total Primary Revenue
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(47, 122, 96, 0.1)', color: '#2F7A60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#2F7A60', lineHeight: 1.1, marginBottom: 6 }}>
              {formatLakhs(kpis.total_revenue || 0)}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
              {(kpis.total_transactions || 0).toLocaleString('en-IN')} billing records
            </div>
          </div>
        </div>

        {/* Card 3: Total Volume */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid #3D6A8A',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
              Total Volume Sold
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(61, 106, 138, 0.1)', color: '#3D6A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#3D6A8A', lineHeight: 1.1, marginBottom: 6 }}>
              {formatQty(kpis.total_volume || 0)}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
              Avg ASP: ₹{kpis.total_volume > 0 ? (kpis.total_revenue / kpis.total_volume).toFixed(2) : '0.00'}/KG
            </div>
          </div>
        </div>

        {/* Card 4: Top Performer */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid #C07D38',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
              Top Performer
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(192, 125, 56, 0.1)', color: '#C07D38', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#C07D38', lineHeight: 1.2, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={kpis.top_performer?.name}>
              {kpis.top_performer?.name || 'N/A'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
              Revenue: {formatLakhs(kpis.top_performer?.revenue || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Clean Filters Toolbar */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search Field */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by Sales Executive name or division..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="form-control"
            style={{ paddingLeft: 38, width: '100%', height: 38, fontSize: 13.5 }}
          />
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Month:</label>
            <select
              className="form-control"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: 135, height: 38, fontSize: 13 }}
            >
              <option value="all">All Months</option>
              {(data?.available_months || []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Division:</label>
            <select
              className="form-control"
              value={selectedDivision}
              onChange={(e) => { setSelectedDivision(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: 160, height: 38, fontSize: 13 }}
            >
              <option value="all">All Divisions</option>
              {(data?.available_divisions || []).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {(selectedMonth !== 'all' || selectedDivision !== 'all' || searchQuery) && (
            <button
              className="btn btn-secondary"
              onClick={() => { setSelectedMonth('all'); setSelectedDivision('all'); setSearchQuery(''); setCurrentPage(1); }}
              style={{ height: 38, padding: '0 14px', fontSize: 12, color: 'var(--text-muted)' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Top 15 Executives Leaderboard Chart */}
      <div className="card" style={{ padding: '24px 28px', height: 440, marginBottom: 32 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
              Top Sales Executives by Revenue
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '4px 0 0 0' }}>
              Comparison of Primary Sales Revenue (Left Axis) vs Average Selling Price (Right Axis, ₹/KG)
            </p>
          </div>
          <span className="badge badge-accent" style={{ fontSize: 12, padding: '4px 10px' }}>
            Top 15 Executives
          </span>
        </div>

        {data?.leaderboard && data.leaderboard.length > 0 ? (
          <ResponsiveContainer width="100%" height="82%">
            <ComposedChart data={data.leaderboard} margin={{ top: 10, right: 10, bottom: 45, left: 10 }}>
              <defs>
                <linearGradient id="execRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B3B2C" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#0B3B2C" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={55}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`}
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(val) => `₹${val}`}
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'var(--bg)', opacity: 0.5 }} />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
              <Bar yAxisId="left" name="Revenue" dataKey="Revenue" fill="url(#execRevenueGrad)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Line yAxisId="right" name="ASP" type="monotone" dataKey="ASP" stroke="#C07D38" strokeWidth={2.5} dot={{ r: 4, fill: '#C07D38' }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-dim)' }}>
            {loading ? 'Loading Leaderboard…' : 'No sales executive data found for current filters.'}
          </div>
        )}
      </div>

      {/* Main Executives Table */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
              Sales Executives Performance Table ({filteredExecutives.length})
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '4px 0 0 0' }}>
              Click any executive row to open a full deep-dive of products, accounts, and monthly trends.
            </p>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Page {currentPage} of {Math.max(1, Math.ceil(filteredExecutives.length / ROWS_PER_PAGE))}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table" style={{ width: '100%', minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ width: 65, textAlign: 'center' }}>Rank</th>
                <SortHeader label="Sales Executive" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="Primary Revenue" sortKey="total_revenue" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="Total Volume" sortKey="total_volume" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="ASP (₹/KG)" sortKey="asp" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="Accounts" sortKey="unique_customers_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="Products" sortKey="unique_products_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="Invoices" sortKey="invoices_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <SortHeader label="Primary Division" sortKey="primary_division" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                <th style={{ width: 100, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading Sales Executives…</td></tr>
              ) : filteredExecutives.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 50, color: 'var(--text-dim)' }}>No sales executives matched your search.</td></tr>
              ) : (
                sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((exec) => (
                  <tr
                    key={exec.name}
                    onClick={() => setSelectedExec(exec)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${exec.rank === 1 ? 'badge-gold' : exec.rank === 2 ? 'badge-silver' : exec.rank === 3 ? 'badge-bronze' : ''}`} style={{ fontWeight: 800 }}>
                        {exec.rank}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: 'var(--accent-soft)', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12
                        }}>
                          {exec.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{exec.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {formatLakhs(exec.total_revenue)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatQty(exec.total_volume)}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      ₹{exec.asp.toFixed(2)}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                        {exec.unique_customers_count} accounts
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                        {exec.unique_products_count} prods
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {exec.invoices_count.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge badge-accent" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exec.primary_division}>
                        {exec.primary_division || 'General'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedExec(exec); }}
                      >
                        Details <ChevronRight size={13} style={{ marginLeft: 2 }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredExecutives.length / ROWS_PER_PAGE)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Selected Executive Deep-Dive Modal */}
      {selectedExec && (
        <div className="modal-overlay" onClick={() => setSelectedExec(null)}>
          <div className="modal" style={{ maxWidth: '860px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  backgroundColor: 'var(--accent-soft)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16
                }}>
                  {selectedExec.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 className="modal-title" style={{ margin: 0, fontSize: 20 }}>{selectedExec.name}</h2>
                    <span className="badge badge-accent">Rank {selectedExec.rank}</span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--text-dim)' }}>
                    Primary Segment: {selectedExec.primary_division}
                  </p>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 8px', borderRadius: '50%' }} onClick={() => setSelectedExec(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Top Cards in Modal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 14, backgroundColor: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Total Revenue</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{formatLakhs(selectedExec.total_revenue)}</p>
              </div>
              <div style={{ padding: 14, backgroundColor: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Total Volume</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{formatQty(selectedExec.total_volume)}</p>
              </div>
              <div style={{ padding: 14, backgroundColor: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Average ASP</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: '#C07D38' }}>₹{selectedExec.asp.toFixed(2)}/KG</p>
              </div>
              <div style={{ padding: 14, backgroundColor: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Unique Accounts</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selectedExec.unique_customers_count}</p>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            {selectedExec.monthly_trend && selectedExec.monthly_trend.length > 0 && (
              <div style={{ marginBottom: 28, backgroundColor: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800 }}>Month-on-Month Revenue & Volume Progression</h4>
                <div style={{ height: 220, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={selectedExec.monthly_trend} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${(val / 1000).toFixed(0)}T`} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar yAxisId="left" name="Revenue" dataKey="revenue" fill="#0B3B2C" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Line yAxisId="right" name="Volume" type="monotone" dataKey="volume" stroke="#2F7A60" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Products & Top Customers Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Top Products */}
              <div style={{ backgroundColor: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={16} color="var(--primary)" /> Top 10 Products by Revenue
                </h4>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                        <th style={{ textAlign: 'left', paddingBottom: 6 }}>Product</th>
                        <th style={{ textAlign: 'right', paddingBottom: 6 }}>Qty</th>
                        <th style={{ textAlign: 'right', paddingBottom: 6 }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedExec.top_products || []).map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '6px 0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={p.name}>
                            {p.name}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>{formatQty(p.volume)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatLakhs(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Customers */}
              <div style={{ backgroundColor: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={16} color="var(--green)" /> Top 10 Accounts by Revenue
                </h4>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                        <th style={{ textAlign: 'left', paddingBottom: 6 }}>Account / Customer</th>
                        <th style={{ textAlign: 'right', paddingBottom: 6 }}>Qty</th>
                        <th style={{ textAlign: 'right', paddingBottom: 6 }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedExec.top_customers || []).map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '6px 0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={c.name}>
                            {c.name}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>{formatQty(c.volume)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{formatLakhs(c.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
