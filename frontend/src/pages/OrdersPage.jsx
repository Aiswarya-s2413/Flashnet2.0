import { useState, useEffect, useMemo } from 'react'
import API from '../api'
import { ShoppingCart, RefreshCw, X, Calendar, Search, RotateCcw } from 'lucide-react'
import Pagination from '../components/Pagination'
import { useSortableData, SortHeader } from '../components/SortableTable'

const ROWS_PER_PAGE = 25

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState(null)

  // Filter States
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await API.get('/orders/')
      setOrders(res.data)
    } catch (e) {
      setAlert({ type: 'error', title: 'Error', messages: [e.message] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  // Filter orders based on invoice_date and search text
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date filter
      if (startDate) {
        if (!o.invoice_date || o.invoice_date < startDate) return false
      }
      if (endDate) {
        if (!o.invoice_date || o.invoice_date > endDate) return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches = (
          (o.invoice_no || '').toLowerCase().includes(q) ||
          (o.customer || '').toLowerCase().includes(q) ||
          (o.material_code || '').toLowerCase().includes(q) ||
          (o.material_name || '').toLowerCase().includes(q) ||
          (o.sold_to || '').toLowerCase().includes(q) ||
          (o.ship_to || '').toLowerCase().includes(q)
        )
        if (!matches) return false
      }
      return true
    })
  }, [orders, startDate, endDate, searchQuery])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, searchQuery])

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(filteredOrders)

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
  }

  const isFiltered = Boolean(startDate || endDate || searchQuery)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Track and query all customer orders generated from processed invoices.</p>
        </div>
        <div>
          <button className="btn btn-outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-title">{alert.title}</span>
          <ul>{alert.messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      {/* Date & Search Filter Bar */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Date Filter Inputs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <span>Invoice Date:</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              className="search-input"
              style={{ padding: '6px 10px', fontSize: '13px', background: 'var(--surface2)', borderRadius: '8px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="From Date"
            />
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>to</span>
            <input
              type="date"
              className="search-input"
              style={{ padding: '6px 10px', fontSize: '13px', background: 'var(--surface2)', borderRadius: '8px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="To Date"
            />
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '12px', height: 'auto', borderRadius: '6px' }}
              onClick={() => {
                const d = new Date()
                const today = d.toISOString().split('T')[0]
                const past = new Date()
                past.setDate(d.getDate() - 30)
                setStartDate(past.toISOString().split('T')[0])
                setEndDate(today)
              }}
            >
              Last 30 Days
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '12px', height: 'auto', borderRadius: '6px' }}
              onClick={() => {
                const d = new Date()
                const today = d.toISOString().split('T')[0]
                const past = new Date()
                past.setDate(d.getDate() - 90)
                setStartDate(past.toISOString().split('T')[0])
                setEndDate(today)
              }}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {/* Search & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', maxWidth: '360px', minWidth: '240px' }}>
          <div className="search-container" style={{ flex: 1 }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search invoice, customer, material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 32px', fontSize: '13px' }}
            />
          </div>
          {isFiltered && (
            <button
              className="btn btn-outline"
              onClick={clearFilters}
              title="Clear all filters"
              style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--red)', borderColor: 'var(--red-soft)', height: '34px', whiteSpace: 'nowrap' }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">
            {isFiltered ? 'Filtered Orders' : 'Total Orders'}
          </span>
          <span className="stat-value stat-accent">
            {loading ? '-' : filteredOrders.length}
            {isFiltered && <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500, marginLeft: 6 }}>/ {orders.length}</span>}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Qty</span>
          <span className="stat-value stat-green">
            {loading ? '-' : (
              <>
                {new Intl.NumberFormat('en-IN').format(filteredOrders.reduce((s, o) => s + (Number(o.qty) || 0), 0))}{' '}
                <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>KGs</span>
              </>
            )}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unique Customers</span>
          <span className="stat-value">{loading ? '-' : new Set(filteredOrders.map(o => o.customer)).size}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unique Products</span>
          <span className="stat-value">{loading ? '-' : new Set(filteredOrders.map(o => o.material_code)).size}</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <SortHeader label="Sold To" sortKey="sold_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Ship To" sortKey="ship_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Invoice No." sortKey="invoice_no" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Invoice Date" sortKey="invoice_date" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Customer" sortKey="customer" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Mat. Code" sortKey="material_code" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Material" sortKey="material_name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Pack" sortKey="packsize" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Qty" sortKey="qty" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading…</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={10}>
                <div className="empty-state">
                  <ShoppingCart size={40} />
                  <p>{isFiltered ? 'No orders match the selected date range or search query.' : 'No orders yet.'}</p>
                  {isFiltered ? (
                    <button className="btn btn-outline" style={{ marginTop: 10, fontSize: 13 }} onClick={clearFilters}>
                      <RotateCcw size={13} /> Clear Filters
                    </button>
                  ) : (
                    <p style={{ fontSize: 13 }}>Add invoices and use <strong>Extract to Orders</strong> on the Invoices page.</p>
                  )}
                </div>
              </td></tr>
            ) : sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((o, i) => (
              <tr key={o.id} onClick={() => setSelectedRow(o)} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-dim)' }}>{(currentPage - 1) * ROWS_PER_PAGE + i + 1}</td>
                <td>{o.sold_to}</td>
                <td>{o.ship_to}</td>
                <td><span className="badge badge-accent">{o.invoice_no}</span></td>
                <td>{o.invoice_date}</td>
                <td>{o.customer}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.material_code}</td>
                <td>{o.material_name}</td>
                <td>{o.packsize}</td>
                <td><span className="badge badge-green">{o.qty}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredOrders.length / ROWS_PER_PAGE)} onPageChange={setCurrentPage} />
        )}
      </div>

      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Order details</h2>
              <button className="btn btn-outline" style={{ padding: '6px 8px', borderRadius: '50%' }} onClick={() => setSelectedRow(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxHeight: '450px', overflowY: 'auto' }}>
              {Object.entries(selectedRow).map(([key, val]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <div key={key} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{formattedKey}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: '600', wordBreak: 'break-all' }}>{String(val ?? '-')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
