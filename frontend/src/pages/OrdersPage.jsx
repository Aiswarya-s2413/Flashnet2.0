import { useState, useEffect } from 'react'
import API from '../api'
import { ShoppingCart, RefreshCw } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

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
        <p className="page-subtitle">Extracted and validated orders from distributor invoices</p>
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
              <th>Sold To</th>
              <th>Ship To</th>
              <th>Invoice No.</th>
              <th>Invoice Date</th>
              <th>Customer</th>
              <th>Material Code</th>
              <th>Material Name</th>
              <th>Packsize(kg)</th>
              <th>qty(kg)</th>
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
            ) : orders.map((o, i) => (
              <tr key={o.id}>
                <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
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
      </div>
    </div>
  )
}
