import { useState, useEffect, useMemo } from 'react'
import API from '../api'
import {
  BarChart2, AlertTriangle, CheckCircle, RefreshCw,
  TrendingDown, TrendingUp, Minus, Filter, Info, X,
  Package, ChevronUp, ChevronDown
} from 'lucide-react'
import Pagination from '../components/Pagination'

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

      {/* KPI Cards — 5-column grid, numbers abbreviated so they never overflow */}
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

      {/* Table — fixed-layout with colgroup widths, overflowX:auto so nothing is cut off */}
      {data && totalRows > 0 && (
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
