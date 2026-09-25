import { useState, useEffect, useMemo } from 'react'
import API from '../api'
import {
  BarChart2, AlertTriangle, CheckCircle, RefreshCw,
  TrendingDown, TrendingUp, Minus, Filter, Info, X,
  Package, ChevronUp, ChevronDown, Layers, TrendingUp as GapUp, TrendingDown as GapDown,
  Activity
} from 'lucide-react'
import Pagination from '../components/Pagination'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

const ROWS_PER_PAGE = 30

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtYM(ym) {
  if (!ym || ym === 'Unknown') return ym
  const [y, m] = ym.split('-')
  return `${MONTH_SHORT[parseInt(m, 10) - 1] || m} ${y}`
}

function abbr(n, d = 1) {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(d)}Cr`
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(d)}L`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(d)}K`
  return `${sign}${abs.toFixed(d)}`
}

function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function KpiCard({ icon: Icon, label, value, sub, color, prefix = '' }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border)',
      minWidth: 0,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
          textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 24, fontWeight: 800, color: 'var(--text)',
        lineHeight: 1, letterSpacing: '-0.02em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {prefix}{value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  )
}

function StatusBadge({ isAnomaly, hasStock }) {
  if (!hasStock) return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 7px',
      borderRadius: 99, background: 'var(--surface2)', color: 'var(--text-dim)',
      whiteSpace: 'nowrap',
    }}>NO DATA</span>
  )
  if (isAnomaly) return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 7px',
      borderRadius: 99, background: 'var(--red-soft)', color: 'var(--red)',
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <AlertTriangle size={9} /> ANOMALY
    </span>
  )
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 7px',
      borderRadius: 99, background: 'var(--green-soft)', color: 'var(--green)',
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <CheckCircle size={9} /> OK
    </span>
  )
}

function DetailModal({ row, onClose }) {
  if (!row) return null
  const disc = row.discrepancy
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620, width: '94%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 18 }}>
          <div>
            <h2 className="modal-title" style={{ margin: 0, fontSize: 15 }}>Stock Reconciliation</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {row.product} · {fmtYM(row.month)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge isAnomaly={row.is_anomaly} hasStock={row.has_stock_data} />
            <button className="btn btn-outline" style={{ padding: '5px 7px', borderRadius: '50%' }} onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[['Distributor', row.distributor], ['Month', fmtYM(row.month)], ['Ship To', row.ship_to || '—'], ['Sold To', row.sold_to || '—']].map(([k, v]) => (
            <div key={k} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Quantity Reconciliation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, textAlign: 'center' }}>
            {[['Primary Qty', fmt(row.primary_qty, 2), 'var(--primary)'], ['Secondary Qty', fmt(row.secondary_qty, 2), '#7c3aed'], ['Expected Left', fmt(row.expected_stock_left, 2), 'var(--green)']].map(([lbl, val, col]) => (
              <div key={lbl}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {fmt(row.primary_qty, 2)} − {fmt(row.secondary_qty, 2)} = <strong style={{ color: 'var(--green)' }}>{fmt(row.expected_stock_left, 2)}</strong>
          </div>
        </div>

        {row.has_stock_data ? (
          <div style={{
            background: row.is_anomaly ? 'var(--red-soft)' : 'var(--green-soft)',
            border: `1px solid ${row.is_anomaly ? 'var(--red)' : 'var(--green)'}`,
            borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: row.is_anomaly ? 'var(--red)' : 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {row.is_anomaly ? '⚠ Anomaly Detected' : '✓ Stock Consistent'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, textAlign: 'center' }}>
              {[['Expected Left', fmt(row.expected_stock_left, 2)], ['Actual Stock', fmt(row.actual_stock, 2)], ['Discrepancy', (disc > 0 ? '+' : '') + fmt(disc, 2)]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, color: 'var(--text-muted)', fontSize: 12 }}>
            <Info size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            No uploaded stock data for this distributor / product / period.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Primary Value (₹)', fmt(row.primary_val)], ['Secondary Value (₹)', fmt(row.secondary_val)], ['Avg 6M Sales', fmt(row.avg_six_month_sales)], ['Mid Month Inventory', fmt(row.mid_month_inventory)]].map(([k, v]) => (
            <div key={k} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        {row.remarks && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 12 }}>Remarks: {row.remarks}</div>}
      </div>
    </div>
  )
}

function Th({ label, sortKey, currentKey, currentDir, onSort, align = 'left' }) {
  const active = currentKey === sortKey
  return (
    <th onClick={() => onSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: align }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label}
        {active
          ? currentDir === 'asc' ? <ChevronUp size={11} color="var(--green)" /> : <ChevronDown size={11} color="var(--green)" />
          : <ChevronDown size={11} style={{ opacity: 0.2 }} />}
      </span>
    </th>
  )
}

export default function StockAnalysisPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [monthFilter, setMonthFilter]         = useState('')
  const [yearFilter, setYearFilter]           = useState('')
  const [distFilter, setDistFilter]           = useState('')
  const [showAnomalyOnly, setShowAnomalyOnly] = useState(false)

  const [page, setPage]               = useState(1)
  const [sortKey, setSortKey]         = useState('month')
  const [sortDir, setSortDir]         = useState('asc')
  const [selectedRow, setSelectedRow] = useState(null)

  const [activeTab, setActiveTab] = useState('table')
  const [selectedGapMonth, setSelectedGapMonth] = useState(null)

  const currentYear = new Date().getFullYear()
  const yearsRange  = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (monthFilter) params.month = monthFilter
      if (yearFilter)  params.year  = yearFilter
      if (distFilter)  params.dist  = distFilter
      const res = await API.get('/analytics/stock/', { params })
      setData(res.data); setPage(1)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const displayRows = useMemo(() => {
    if (!data) return []
    let rows = showAnomalyOnly ? data.rows.filter(r => r.is_anomaly) : data.rows
    return [...rows].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, showAnomalyOnly, sortKey, sortDir])

  const totalPages = Math.ceil(displayRows.length / ROWS_PER_PAGE)
  const pageRows   = displayRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const s               = data?.summary || {}
  const anomalyCount    = s.anomaly_count          ?? 0
  const totalRows       = s.total_rows             ?? 0
  const totalExpLeft    = s.total_expected_left    ?? 0
  const totalActual     = s.total_actual_stock     ?? 0
  const stockDisc       = s.stock_discrepancy      ?? 0
  const discRows        = s.disc_rows_count        ?? 0
  const psssMatched     = s.ps_ss_matched_count    ?? 0
  const trackedDists    = s.tracked_distributors   ?? []

  const TABS = [
    { key: 'table', label: 'All Records',  icon: Layers },
    { key: 'gaps',  label: 'Monthly Gaps', icon: BarChart2 },
    { key: 'mom',   label: 'MoM Trend',    icon: Activity },
  ]

  // Month-on-month deltas for the MoM tab
  const momData = useMemo(() => {
    const raw = data?.monthly_gaps || []
    const sorted = [...raw].map(g => ({
      ...g,
      label: fmtYM(g.month) || g.month,
    }))
    return sorted.map((g, i) => {
      const prev = sorted[i - 1]
      const excessDelta  = prev ? g.excess  - prev.excess  : null
      const missingDelta = prev ? g.missing - prev.missing : null
      return { ...g, excessDelta, missingDelta }
    })
  }, [data])

  const monthlyGaps = useMemo(() => {
    const raw = data?.monthly_gaps || []
    return raw.map(g => ({
      ...g,
      label: fmtYM(g.month) || g.month,
    }))
  }, [data])

  const selectedGap = useMemo(() => {
    if (!monthlyGaps.length) return null
    if (!selectedGapMonth) return monthlyGaps[monthlyGaps.length - 1]
    return monthlyGaps.find(g => g.month === selectedGapMonth) || monthlyGaps[monthlyGaps.length - 1]
  }, [monthlyGaps, selectedGapMonth])

  const GapChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const entry = monthlyGaps.find(g => g.label === label)
      return (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '12px 16px', borderRadius: 12, boxShadow: 'var(--shadow-lg)', minWidth: 180
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6 }}>{label}</div>
          {payload.map((p, i) => {
            const v = Number(p.value || 0)
            const sign = p.dataKey === 'missing' ? '-' : v > 0 ? '+' : ''
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: p.color }}>{p.name}</span>
                <span style={{ color: 'var(--text)' }}>{sign}{abbr(Math.abs(v))}</span>
              </div>
            )
          })}
          {entry && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
              {entry.stock_rows} rows · {entry.anomaly_rows} anomalies
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <BarChart2 size={21} color="var(--primary)" />
          Stock Analysis
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Reconcile primary &amp; secondary sales quantities against uploaded stock levels. Anomalies flagged automatically.
        </p>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, paddingBottom: 2, flexShrink: 0 }}>
            <Filter size={13} /> Filters
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</label>
            <select id="sa-month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={{ fontSize: 13, width: 130 }}>
              <option value="">All Months</option>
              {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</label>
            <select id="sa-year" value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={{ fontSize: 13, width: 100 }}>
              <option value="">All Years</option>
              {yearsRange.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 180px', maxWidth: 280 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distributor</label>
            <input
              id="sa-dist"
              type="text"
              value={distFilter}
              onChange={e => setDistFilter(e.target.value)}
              placeholder="Search distributor…"
              style={{ fontSize: 13 }}
              onKeyDown={e => { if (e.key === 'Enter') fetchData() }}
            />
          </div>

          <button id="sa-apply" className="btn btn-primary" onClick={fetchData} disabled={loading}
            style={{ padding: '9px 18px', fontSize: 13, alignSelf: 'flex-end', flexShrink: 0 }}>
            {loading ? <span className="spinner" /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Apply'}
          </button>

          <button
            id="sa-anomaly-toggle"
            onClick={() => { setShowAnomalyOnly(v => !v); setPage(1) }}
            style={{
              alignSelf: 'flex-end', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, padding: '9px 14px',
              borderRadius: 'var(--radius)',
              border: '1px solid ' + (showAnomalyOnly ? 'var(--red)' : 'var(--border)'),
              background: showAnomalyOnly ? 'var(--red-soft)' : 'var(--surface)',
              color: showAnomalyOnly ? 'var(--red)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <AlertTriangle size={13} />
            Anomalies
            {anomalyCount > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '1px 6px' }}>
                {anomalyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={15} style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {/* KPI Cards */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard
            icon={Package}
            label="Distributors Tracked"
            value={trackedDists.length}
            sub={`${psssMatched} rows matched PS & SS`}
            color="var(--primary)"
          />
          <KpiCard
            icon={TrendingDown}
            label="Expected Stock Left"
            value={abbr(totalExpLeft)}
            sub="Primary − Secondary qty"
            color="#7c3aed"
          />
          <KpiCard
            icon={Package}
            label="Actual Stock"
            value={abbr(totalActual)}
            sub={`From ${discRows} stock report rows`}
            color="var(--green)"
          />
          <KpiCard
            icon={stockDisc === 0 ? Minus : stockDisc > 0 ? TrendingUp : TrendingDown}
            label="Stock Discrepancy"
            prefix={stockDisc > 0 ? '+' : stockDisc < 0 ? '-' : ''}
            value={abbr(Math.abs(stockDisc))}
            sub={discRows > 0 ? `Across ${discRows} uploaded reports` : 'No stock reports uploaded'}
            color={stockDisc === 0 ? 'var(--text-muted)' : Math.abs(stockDisc) > 100 ? 'var(--red)' : 'var(--amber)'}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Anomalies Flagged"
            value={anomalyCount}
            sub="Discrepancy > 5% of expected"
            color={anomalyCount > 0 ? 'var(--red)' : 'var(--green)'}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && data && totalRows === 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Package size={34} style={{ opacity: 0.25, marginBottom: 12 }} />
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No data found</div>
          <div style={{ fontSize: 13 }}>Try clearing filters or upload primary / secondary / stock data first.</div>
        </div>
      )}

      {/* Tabs */}
      {data && totalRows > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => {
            const Icon = t.icon
            const on = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 14px', fontSize: 13, fontWeight: 700,
                  background: 'transparent', border: 0, cursor: 'pointer',
                  color: on ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${on ? 'var(--primary)' : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.15s',
                }}>
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Monthly Gaps tab */}
      {data && totalRows > 0 && activeTab === 'gaps' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 10 }}>
          <div className="card" style={{ padding: '18px 20px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Total gap per month</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#d97706' }} /> Excess stock
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#b91c1c' }} /> Missing stock
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 2, background: '#111827' }} /> Net gap
                </span>
              </div>
            </div>
            {monthlyGaps.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <Info size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                No stock-report months are available yet under these filters.
              </div>
            ) : (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={monthlyGaps}
                    margin={{ top: 10, right: 14, left: 0, bottom: 0 }}
                    onClick={(e) => {
                      if (e?.activeLabel) {
                        const m = monthlyGaps.find(g => g.label === e.activeLabel)
                        if (m) setSelectedGapMonth(m.month)
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(v) => abbr(v, 0)} />
                    <Tooltip content={<GapChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                    <Bar
                      dataKey="excess"
                      name="Excess stock"
                      stackId="gaps"
                      fill="#d97706"
                      radius={[6, 6, 0, 0]}
                      barSize={34}
                    />
                    <Bar
                      dataKey="missing"
                      name="Missing stock"
                      stackId="gaps"
                      fill="#b91c1c"
                      radius={[0, 0, 0, 0]}
                      barSize={34}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net gap"
                      stroke="#111827"
                      strokeWidth={2.2}
                      dot={{ r: 3.2, strokeWidth: 1, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '18px 20px' }}>
            {selectedGap ? (
              <>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                  {selectedGap.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: selectedGap.net >= 0 ? '#b45309' : '#b91c1c' }}>
                  {selectedGap.net >= 0 ? '+' : ''}{abbr(selectedGap.net, 2)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Net gap across {selectedGap.stock_rows} product rows
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.05, color: '#b45309', marginBottom: 4 }}>
                      <GapUp size={12} /> Excess stock
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#b45309' }}>+{abbr(selectedGap.excess)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{selectedGap.excess_rows} rows</div>
                  </div>
                  <div style={{ background: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.05, color: '#b91c1c', marginBottom: 4 }}>
                      <GapDown size={12} /> Missing stock
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#b91c1c' }}>−{abbr(selectedGap.missing)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{selectedGap.missing_rows} rows</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--text-dim)', marginBottom: 8 }}>
                    Rows to check · <span style={{ color: 'var(--text-muted)' }}>{(selectedGap.top_excess?.length || 0) + (selectedGap.top_missing?.length || 0)} of {selectedGap.stock_rows}</span>
                  </div>
                  {selectedGap.top_excess?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', marginBottom: 4 }}>
                        Excess stock
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {selectedGap.top_excess.map((r, i) => (
                          <div key={'e' + i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                            <span style={{ color: 'var(--text)', flex: '1 1 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product}</span>
                            <span style={{ color: '#b45309', fontWeight: 700, fontFamily: 'monospace' }}>+{abbr(r.discrepancy)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedGap.top_missing?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>
                        Missing stock
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {selectedGap.top_missing.map((r, i) => (
                          <div key={'m' + i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                            <span style={{ color: 'var(--text)', flex: '1 1 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product}</span>
                            <span style={{ color: '#b91c1c', fontWeight: 700, fontFamily: 'monospace' }}>{abbr(r.discrepancy)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!selectedGap.top_excess?.length && !selectedGap.top_missing?.length && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No excess or missing rows this month.</div>
                  )}
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  <Info size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Only months with uploaded stock reports appear here. Add more months of stock reports to see the trend change.
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <BarChart2 size={20} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div>Click a month in the chart to see its gap breakdown.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product × Month heatmap — inside gaps tab */}
      {data && totalRows > 0 && activeTab === 'gaps' && (() => {
        // Build product→month→discrepancy matrix from rows that have actual stock
        const stockRows = (data.rows || []).filter(r => r.has_stock_data && r.discrepancy !== null)
        if (!stockRows.length) return null

        // Collect all months (sorted) and all products
        const monthSet = new Set()
        const productMap = {}   // product → { month → discrepancy (summed), totalAbs }
        for (const r of stockRows) {
          const ym = r.month || 'Unknown'
          monthSet.add(ym)
          if (!productMap[r.product]) productMap[r.product] = { byMonth: {}, totalAbs: 0 }
          productMap[r.product].byMonth[ym] = (productMap[r.product].byMonth[ym] || 0) + (r.discrepancy || 0)
          productMap[r.product].totalAbs += Math.abs(r.discrepancy || 0)
        }
        const months = Array.from(monthSet).sort()
        // Sort products by total absolute discrepancy descending (top 20)
        const products = Object.entries(productMap)
          .sort((a, b) => b[1].totalAbs - a[1].totalAbs)
          .slice(0, 20)

        // Max absolute value for colour intensity normalisation
        let maxAbs = 0
        for (const [, pm] of products)
          for (const v of Object.values(pm.byMonth))
            if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v)

        function heatColor(val) {
          if (val === undefined || val === null || val === 0) return 'transparent'
          const intensity = Math.min(Math.abs(val) / maxAbs, 1)
          if (val > 0) {
            // amber: 217,119,6 → lighter
            const a = Math.round(0.08 + intensity * 0.55 * 255)
            return `rgba(217,119,6,${(0.08 + intensity * 0.55).toFixed(2)})`
          } else {
            return `rgba(185,28,28,${(0.08 + intensity * 0.55).toFixed(2)})`
          }
        }

        return (
          <div className="card" style={{ padding: '18px 20px 14px', marginTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Gap by product and month</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                Ordered by highest total discrepancy · Darker cells = bigger gap ·
                <span style={{ color: '#b45309', fontWeight: 600 }}> Amber = excess</span> ·
                <span style={{ color: '#b91c1c', fontWeight: 600 }}> Red = missing</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', minWidth: 180, paddingRight: 12, whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 2 }}>
                      Product
                    </th>
                    {months.map(ym => (
                      <th key={ym} style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: 90, paddingLeft: 4, paddingRight: 4, color: 'var(--text-dim)', fontSize: 11 }}>
                        {fmtYM(ym)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(([prod, pm], ri) => (
                    <tr key={prod} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{
                        fontSize: 12, fontWeight: 600, paddingRight: 12,
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        position: 'sticky', left: 0,
                        background: ri % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                        zIndex: 1,
                      }} title={prod}>
                        {prod}
                      </td>
                      {months.map(ym => {
                        const val = pm.byMonth[ym]
                        return (
                          <td key={ym} style={{
                            textAlign: 'right',
                            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                            padding: '5px 8px',
                            background: heatColor(val),
                            color: val === undefined ? 'var(--text-dim)' : val > 0 ? '#92400e' : '#991b1b',
                            borderRadius: 4,
                          }}>
                            {val !== undefined ? (val > 0 ? '+' : '') + abbr(val, 1) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* MoM Trend tab */}
      {data && totalRows > 0 && activeTab === 'mom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary delta chips */}
          {momData.length > 1 && (() => {
            const last  = momData[momData.length - 1]
            const prev  = momData[momData.length - 2]
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {/* Excess chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '12px 18px',
                  flex: '1 1 220px', boxShadow: 'var(--shadow-md)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(217,119,6,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GapUp size={18} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Excess Stock — {last.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#b45309', lineHeight: 1.2 }}>+{abbr(last.excess)}</div>
                    {last.excessDelta !== null && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: last.excessDelta > 0 ? '#b91c1c' : '#15803d', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        {last.excessDelta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {last.excessDelta > 0 ? '+' : ''}{abbr(last.excessDelta)} vs {prev.label}
                      </div>
                    )}
                  </div>
                </div>
                {/* Missing chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '12px 18px',
                  flex: '1 1 220px', boxShadow: 'var(--shadow-md)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(185,28,28,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GapDown size={18} color="#b91c1c" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Stock — {last.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c', lineHeight: 1.2 }}>−{abbr(last.missing)}</div>
                    {last.missingDelta !== null && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: last.missingDelta > 0 ? '#b91c1c' : '#15803d', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        {last.missingDelta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {last.missingDelta > 0 ? '+' : ''}{abbr(last.missingDelta)} vs {prev.label}
                      </div>
                    )}
                  </div>
                </div>
                {/* Net gap chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '12px 18px',
                  flex: '1 1 220px', boxShadow: 'var(--shadow-md)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={18} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Gap — {last.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: last.net >= 0 ? '#b45309' : '#b91c1c', lineHeight: 1.2 }}>
                      {last.net > 0 ? '+' : ''}{abbr(last.net)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{last.stock_rows} stock report rows</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {momData.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={28} style={{ opacity: 0.25, marginBottom: 12 }} />
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No stock report months yet</div>
              <div style={{ fontSize: 13 }}>Upload stock reports for multiple months to see the MoM trend.</div>
            </div>
          ) : (
            <>
              {/* Excess stock area chart */}
              <div className="card" style={{ padding: '18px 20px 14px' }}>
                <div style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#b45309' }}>📈 Excess Stock — Month on Month</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Units where actual stock &gt; expected (distributor holding more than expected)</div>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={momData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="excessGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#d97706" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={v => abbr(v, 0)} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const entry = momData.find(g => g.label === label)
                          return (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10, boxShadow: 'var(--shadow-lg)', minWidth: 160 }}>
                              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6 }}>{label}</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#b45309' }}>+{abbr(entry?.excess ?? 0)}</div>
                              {entry?.excessDelta !== null && (
                                <div style={{ fontSize: 11, color: entry.excessDelta > 0 ? '#b91c1c' : '#15803d', marginTop: 3, fontWeight: 600 }}>
                                  MoM: {entry.excessDelta > 0 ? '+' : ''}{abbr(entry.excessDelta)}
                                </div>
                              )}
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{entry?.excess_rows} rows</div>
                            </div>
                          )
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="excess"
                        name="Excess stock"
                        stroke="#d97706"
                        strokeWidth={2.5}
                        fill="url(#excessGrad)"
                        dot={{ r: 4, fill: '#d97706', strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Missing stock area chart */}
              <div className="card" style={{ padding: '18px 20px 14px' }}>
                <div style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#b91c1c' }}>📉 Missing Stock — Month on Month</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Units where actual stock &lt; expected (potential stock-out or under-reporting)</div>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={momData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="missingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#b91c1c" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={v => abbr(v, 0)} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const entry = momData.find(g => g.label === label)
                          return (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10, boxShadow: 'var(--shadow-lg)', minWidth: 160 }}>
                              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6 }}>{label}</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#b91c1c' }}>−{abbr(entry?.missing ?? 0)}</div>
                              {entry?.missingDelta !== null && (
                                <div style={{ fontSize: 11, color: entry.missingDelta > 0 ? '#b91c1c' : '#15803d', marginTop: 3, fontWeight: 600 }}>
                                  MoM: {entry.missingDelta > 0 ? '+' : ''}{abbr(entry.missingDelta)}
                                </div>
                              )}
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{entry?.missing_rows} rows</div>
                            </div>
                          )
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="missing"
                        name="Missing stock"
                        stroke="#b91c1c"
                        strokeWidth={2.5}
                        fill="url(#missingGrad)"
                        dot={{ r: 4, fill: '#b91c1c', strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Combined overlay chart */}
              <div className="card" style={{ padding: '18px 20px 14px' }}>
                <div style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📊 Combined Trend — Excess vs Missing</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Side-by-side comparison of excess and missing stock across months</div>
                </div>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={momData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={v => abbr(v, 0)} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10, boxShadow: 'var(--shadow-lg)', minWidth: 170 }}>
                              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6 }}>{label}</div>
                              {payload.map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 13, fontWeight: 700, color: p.color }}>
                                  <span>{p.name}</span><span>{abbr(Math.abs(Number(p.value || 0)))}</span>
                                </div>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                      <Bar dataKey="excess"  name="Excess stock"  fill="#d97706" fillOpacity={0.75} radius={[4,4,0,0]} barSize={22} />
                      <Bar dataKey="missing" name="Missing stock" fill="#b91c1c" fillOpacity={0.75} radius={[4,4,0,0]} barSize={22} />
                      <Line type="monotone" dataKey="net" name="Net gap" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MoM delta table */}
              {momData.length > 1 && (
                <div className="card" style={{ padding: '18px 20px 14px' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Month-on-Month Change Summary</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 560 }}>
                      <thead>
                        <tr>
                          {['Month', 'Excess Stock', 'MoM Δ Excess', 'Missing Stock', 'MoM Δ Missing', 'Net Gap'].map(h => (
                            <th key={h} style={{ textAlign: h === 'Month' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {momData.map((g, i) => {
                          const exDir  = g.excessDelta  !== null ? (g.excessDelta  > 0 ? 'up'   : g.excessDelta  < 0 ? 'down' : 'flat') : null
                          const miDir  = g.missingDelta !== null ? (g.missingDelta > 0 ? 'up'   : g.missingDelta < 0 ? 'down' : 'flat') : null
                          const exCol  = exDir === 'up' ? '#b91c1c' : exDir === 'down' ? '#15803d' : 'var(--text-dim)'
                          const miCol  = miDir === 'up' ? '#b91c1c' : miDir === 'down' ? '#15803d' : 'var(--text-dim)'
                          return (
                            <tr key={i}>
                              <td style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{g.label}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#b45309', fontWeight: 700 }}>+{abbr(g.excess)}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: exCol, fontWeight: 700 }}>
                                {g.excessDelta !== null ? (g.excessDelta >= 0 ? '+' : '') + abbr(g.excessDelta) : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c', fontWeight: 700 }}>−{abbr(g.missing)}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: miCol, fontWeight: 700 }}>
                                {g.missingDelta !== null ? (g.missingDelta >= 0 ? '+' : '') + abbr(g.missingDelta) : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: g.net >= 0 ? '#b45309' : '#b91c1c' }}>
                                {g.net >= 0 ? '+' : ''}{abbr(g.net)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Table tab */}
      {data && totalRows > 0 && activeTab === 'table' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
              {showAnomalyOnly ? `Anomalies (${displayRows.length})` : `All Records (${displayRows.length.toLocaleString('en-IN')})`}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Click a row for details</span>
          </div>

          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 940, width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 155 }} />
                <col style={{ width: 175 }} />
                <col style={{ width: 85 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 105 }} />
                <col style={{ width: 105 }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead style={{ backgroundColor: 'var(--surface)' }}>
                <tr>
                  <Th label="Distributor"   sortKey="distributor"         currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Product"       sortKey="product"             currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Month"         sortKey="month"               currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Primary Qty"   sortKey="primary_qty"         currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                  <Th label="Secondary Qty" sortKey="secondary_qty"       currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                  <Th label="Expected Left" sortKey="expected_stock_left" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                  <Th label="Actual Stock"  sortKey="actual_stock"        currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                  <Th label="Discrepancy"   sortKey="discrepancy"         currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const disc = row.discrepancy
                  const discColor = disc === null ? 'var(--text-dim)'
                    : row.is_anomaly ? 'var(--red)'
                    : disc === 0 ? 'var(--green)'
                    : 'var(--amber)'
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedRow(row)}
                      style={{
                        cursor: 'pointer',
                        background: row.is_anomaly ? 'rgba(239,68,68,0.025)' : undefined,
                        borderLeft: row.is_anomaly ? '3px solid var(--red)' : '3px solid transparent',
                      }}
                    >
                      <td style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.distributor}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.product}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtYM(row.month)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{fmt(row.primary_qty, 2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{fmt(row.secondary_qty, 2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{fmt(row.expected_stock_left, 2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: row.has_stock_data ? 'var(--text)' : 'var(--text-dim)' }}>
                        {row.has_stock_data ? fmt(row.actual_stock, 2) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: discColor }}>
                        {disc !== null ? (disc > 0 ? '+' : '') + fmt(disc, 2) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <StatusBadge isAnomaly={row.is_anomaly} hasStock={row.has_stock_data} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 12, color: 'var(--text-muted)' }}>
            <span><strong style={{ color: 'var(--primary)' }}>Expected Left</strong> = Primary Qty − Secondary Qty</span>
            <span><strong style={{ color: 'var(--red)' }}>Anomaly</strong> = |Actual − Expected| &gt; 5% of Expected</span>
          </div>
        </>
      )}

      <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  )
}
