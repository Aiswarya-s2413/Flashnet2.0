import { useState, useEffect } from 'react'
import API from '../api'
import { ShoppingCart, RefreshCw } from 'lucide-react'
import Pagination from '../components/Pagination'
import { useSortableData, SortHeader } from '../components/SortableTable'

const ROWS_PER_PAGE = 25

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { sorted, sortKey, sortDir, requestSort } = useSortableData(orders)

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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>

      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-title">{alert.title}</span>
          <ul>{alert.messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value stat-accent">{orders.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Qty</span>
          <span className="stat-value stat-green">{orders.reduce((s, o) => s + o.qty, 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unique Customers</span>
          <span className="stat-value">{new Set(orders.map(o => o.customer)).size}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unique Products</span>
          <span className="stat-value">{new Set(orders.map(o => o.material_code)).size}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={fetchOrders}>
          <RefreshCw size={15} /> Refresh
        </button>
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
              <SortHeader label="Material Code" sortKey="material_code" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Material Name" sortKey="material_name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Packsize(kg)" sortKey="packsize" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="qty(kg)" sortKey="qty" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={10}>
                <div className="empty-state">
                  <ShoppingCart size={40} />
                  <p>No orders yet.</p>
                  <p style={{ fontSize: 13 }}>Add invoices and use <strong>Extract to Orders</strong> on the Invoices page.</p>
                </div>
              </td></tr>
            ) : sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((o, i) => (
              <tr key={o.id}>
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
        <Pagination currentPage={currentPage} totalPages={Math.ceil(orders.length / ROWS_PER_PAGE)} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
