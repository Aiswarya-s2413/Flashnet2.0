import { useState, useEffect } from 'react'
import API from '../api'
import { Package, RefreshCw } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await API.get('/products/')
      setProducts(res.data)
    } catch (e) {
      setAlert({ type: 'error', title: 'Failed to load products', messages: [e.message] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Product Master</h1>
        <p className="page-subtitle">View your product catalogue</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-title">{alert.title}</span>
          <ul>{alert.messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={fetchProducts}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value stat-accent">{products.length}</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Material Code</th>
              <th>Material Name</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={3}>
                <div className="empty-state"><Package size={40} /><p>No products available.</p></div>
              </td></tr>
            ) : products.map((p, i) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                <td><span className="badge badge-accent">{p.material_code}</span></td>
                <td>{p.material_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
