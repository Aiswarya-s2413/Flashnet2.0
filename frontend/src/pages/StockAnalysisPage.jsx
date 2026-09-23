import { useState, useEffect, useMemo } from 'react'
import API from '../api'
import {
  BarChart2, AlertTriangle, CheckCircle, RefreshCw,
  TrendingDown, TrendingUp, Minus, Filter, Info, X,
  Package, ChevronUp, ChevronDown
} from 'lucide-react'
import Pagination from '../components/Pagination'

const ROWS_PER_PAGE = 30

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtYM(ym) {
  if (!ym || ym === 'Unknown') return ym
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1] || m} ${y}`
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px 24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border)',
      flex: '1 1 180px',
      minWidth: 160,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Anomaly badge ────────────────────────────────────────────────────────────
function AnomalyBadge({ isAnomaly, hasStock }) {
  if (!hasStock) return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, background: 'var(--surface2)', color: 'var(--text-dim)',
    }}>NO STOCK DATA</span>
  )
  if (isAnomaly) return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, background: 'var(--red-soft)', color: 'var(--red)',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <AlertTriangle size={10} /> ANOMALY
    </span>
  )
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, background: 'var(--green-soft)', color: 'var(--green)',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <CheckCircle size={10} /> OK
    </span>
  )
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }) {
  if (!row) return null
  const disc = row.discrepancy
  const isPos = disc > 0
  const isNeg = disc < 0
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640, width: '94%' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>Stock Reconciliation Detail</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {row.product} · {fmtYM(row.month)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AnomalyBadge isAnomaly={row.is_anomaly} hasStock={row.has_stock_data} />
            <button className="btn btn-outline" style={{ padding: '6px 8px', borderRadius: '50%' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Distributor', row.distributor],
            ['Month', fmtYM(row.month)],
            ['Ship To', row.ship_to || '—'],
            ['Sold To', row.sold_to || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Qty reconciliation */}
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Quantity Reconciliation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Primary Qty', fmt(row.primary_qty, 4), 'var(--primary)'],
              ['Secondary Qty', fmt(row.secondary_qty, 4), '#7c3aed'],
              ['Expected Left', fmt(row.expected_stock_left, 4), 'var(--green)'],
            ].map(([lbl, val, col]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: col }}>{val}</div>
              </div>
            ))}
          </div>
          {/* Equation */}
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {fmt(row.primary_qty, 4)} (PS) − {fmt(row.secondary_qty, 4)} (SS) = <strong style={{ color: 'var(--green)' }}>{fmt(row.expected_stock_left, 4)}</strong> expected left
          </div>
        </div>

        {/* Stock comparison */}
        {row.has_stock_data ? (
          <div style={{
            background: row.is_anomaly ? 'var(--red-soft)' : 'var(--green-soft)',
            border: `1px solid ${row.is_anomaly ? 'var(--red)' : 'var(--green)'}`,
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: row.is_anomaly ? 'var(--red)' : 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              {row.is_anomaly ? '⚠ Anomaly Detected' : '✓ Stock Consistent'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Expected Stock Left', fmt(row.expected_stock_left, 4)],
                ['Actual Stock (Upload)', fmt(row.actual_stock, 4)],
                ['Discrepancy', (disc > 0 ? '+' : '') + fmt(disc, 4)],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
            <Info size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            No stock upload data available for this distributor / product / period.
          </div>
        )}

        {/* Value breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {[
            ['Primary Value (₹)', fmt(row.primary_val)],
            ['Secondary Value (₹)', fmt(row.secondary_val)],
            ['Avg 6M Sales', fmt(row.avg_six_month_sales)],
            ['Mid Month Inventory', fmt(row.mid_month_inventory)],
          ].map(([k, v]) => (
            <div key={k} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        {row.remarks && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Remarks: {row.remarks}</div>
        )}
      </div>
    </div>
  )
}

// ── Sortable header ──────────────────────────────────────────────────────────
function Th({ label, sortKey, currentKey, currentDir, onSort }) {
  const active = currentKey === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? currentDir === 'asc'
            ? <ChevronUp size={12} color="var(--green)" />
            : <ChevronDown size={12} color="var(--green)" />
          : <ChevronDown size={12} style={{ opacity: 0.25 }} />
        }
      </span>
    </th>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function StockAnalysisPage() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // Filters
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter]   = useState('')
  const [distFilter, setDistFilter]   = useState('')
  const [showAnomalyOnly, setShowAnomalyOnly] = useState(false)

  // Table state
  const [page, setPage]             = useState(1)
  const [sortKey, setSortKey]       = useState('month')
  const [sortDir, setSortDir]       = useState('asc')
  const [selectedRow, setSelectedRow] = useState(null)

  const currentYear = new Date().getFullYear()
  const yearsRange  = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (monthFilter) params.month = monthFilter
      if (yearFilter)  params.year  = yearFilter
      if (distFilter)  params.dist  = distFilter
      const res = await API.get('/analytics/stock/', { params })
      setData(res.data)
      setPage(1)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, []) // initial load

  // Apply client-side anomaly filter + sorting
  const displayRows = useMemo(() => {
    if (!data) return []
    let rows = showAnomalyOnly ? data.rows.filter(r => r.is_anomaly) : data.rows

    rows = [...rows].sort((a, b) => {
      let av = a[sortKey] ?? ''
      let bv = b[sortKey] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 :  1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return rows
  }, [data, showAnomalyOnly, sortKey, sortDir])

  const totalPages = Math.ceil(displayRows.length / ROWS_PER_PAGE)
  const pageRows   = displayRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const summary = data?.summary || {}
  const anomalyCount   = summary.anomaly_count   ?? 0
  const totalRows      = summary.total_rows       ?? 0
  const totalExpected  = summary.total_expected_left ?? 0
  const totalActual    = summary.total_actual_stock  ?? 0
  const stockDisc      = summary.stock_discrepancy   ?? 0

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={22} style={{ color: 'var(--primary)' }} />
            Stock Analysis
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Reconcile primary &amp; secondary sales quantities against uploaded stock levels. Anomalies are flagged automatically.
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '18px 24px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, marginRight: 4 }}>
          <Filter size={15} /> Filters
        </div>

        {/* Month */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Month</label>
          <select
            id="stock-month-filter"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            style={{ minWidth: 130, fontSize: 13 }}
          >
            <option value="">All Months</option>
            {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        {/* Year */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Year</label>
          <select
            id="stock-year-filter"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            style={{ minWidth: 110, fontSize: 13 }}
          >
            <option value="">All Years</option>
            {yearsRange.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Distributor search */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Distributor</label>
          <input
            id="stock-dist-filter"
            type="text"
            value={distFilter}
            onChange={e => setDistFilter(e.target.value)}
            placeholder="Search distributor…"
            style={{ minWidth: 200, fontSize: 13 }}
            onKeyDown={e => { if (e.key === 'Enter') fetchData() }}
          />
        </div>

        {/* Apply */}
        <button
          id="stock-apply-filter"
          className="btn btn-primary"
          onClick={fetchData}
          disabled={loading}
          style={{ padding: '9px 20px', fontSize: 13 }}
        >
          {loading ? <span className="spinner" /> : <RefreshCw size={14} />}
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>

        {/* Anomaly toggle */}
        <label
          id="stock-anomaly-toggle"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: showAnomalyOnly ? 'var(--red)' : 'var(--text-muted)',
            background: showAnomalyOnly ? 'var(--red-soft)' : 'transparent',
            border: '1px solid ' + (showAnomalyOnly ? 'var(--red)' : 'var(--border)'),
            borderRadius: 'var(--radius)', padding: '8px 14px',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="checkbox"
            checked={showAnomalyOnly}
            onChange={e => { setShowAnomalyOnly(e.target.checked); setPage(1) }}
            style={{ display: 'none' }}
          />
          <AlertTriangle size={14} />
          Anomalies Only
          {anomalyCount > 0 && (
            <span style={{
              background: 'var(--red)', color: '#fff',
              fontSize: 10, fontWeight: 800, borderRadius: 99,
              padding: '1px 7px', marginLeft: 4,
            }}>
              {anomalyCount}
            </span>
          )}
        </label>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ marginRight: 8 }} />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      {data && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <KpiCard
            icon={Package}
            label="Total Products Tracked"
            value={totalRows.toLocaleString('en-IN')}
            sub="Distributor × product × month rows"
            color="var(--primary)"
          />
          <KpiCard
            icon={TrendingDown}
            label="Total Expected Left"
            value={fmt(totalExpected, 0)}
            sub="Primary − Secondary (qty)"
            color="#7c3aed"
          />
          <KpiCard
            icon={Package}
            label="Total Actual Stock"
            value={fmt(totalActual, 0)}
            sub="From uploaded stock reports"
            color="var(--green)"
          />
          <KpiCard
            icon={stockDisc === 0 ? Minus : stockDisc > 0 ? TrendingUp : TrendingDown}
            label="Overall Discrepancy"
            value={(stockDisc > 0 ? '+' : '') + fmt(stockDisc, 2)}
            sub="Actual − Expected"
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

      {/* ── Info Banner (no data) ── */}
      {!loading && data && totalRows === 0 && (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
          padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)',
          marginBottom: 24,
        }}>
          <Package size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No data found</div>
          <div style={{ fontSize: 13 }}>Try clearing your filters or upload primary/secondary/stock data first.</div>
        </div>
      )}

      {/* ── Table ── */}
      {data && totalRows > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
              {showAnomalyOnly ? `Anomalies (${displayRows.length})` : `All Records (${displayRows.length})`}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Click a row for details</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead style={{ backgroundColor: 'var(--surface)' }}>
                <tr>
                  <Th label="Distributor"     sortKey="distributor"          currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Product"         sortKey="product"              currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Month"           sortKey="month"                currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Primary Qty"     sortKey="primary_qty"          currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Secondary Qty"   sortKey="secondary_qty"        currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Expected Left"   sortKey="expected_stock_left"  currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Actual Stock"    sortKey="actual_stock"         currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <Th label="Discrepancy"     sortKey="discrepancy"          currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const disc = row.discrepancy
                  const discColor = disc === null ? 'var(--text-dim)'
                    : Math.abs(disc) === 0 ? 'var(--green)'
                    : row.is_anomaly ? 'var(--red)'
                    : 'var(--amber)'

                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedRow(row)}
                      style={{
                        cursor: 'pointer',
                        background: row.is_anomaly ? 'rgba(239,68,68,0.03)' : undefined,
                        borderLeft: row.is_anomaly ? '3px solid var(--red)' : '3px solid transparent',
                      }}
                    >
                      <td style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.distributor}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.product}
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtYM(row.month)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                        {fmt(row.primary_qty, 2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                        {fmt(row.secondary_qty, 2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                        {fmt(row.expected_stock_left, 2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: row.has_stock_data ? 'var(--text)' : 'var(--text-dim)' }}>
                        {row.has_stock_data ? fmt(row.actual_stock, 2) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: discColor }}>
                        {disc !== null ? (disc > 0 ? '+' : '') + fmt(disc, 2) : '—'}
                      </td>
                      <td>
                        <AnomalyBadge isAnomaly={row.is_anomaly} hasStock={row.has_stock_data} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

          {/* Legend */}
          <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
            <span><strong style={{ color: 'var(--primary)' }}>Expected Left</strong> = Primary Qty − Secondary Qty</span>
            <span><strong style={{ color: 'var(--red)' }}>Anomaly</strong> flagged when |Actual − Expected| &gt; 5% of Expected</span>
            <span>Click any row to see full breakdown</span>
          </div>
        </>
      )}

      {/* ── Detail Modal ── */}
      <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  )
}
