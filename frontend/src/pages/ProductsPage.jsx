import { useState, useEffect } from 'react'
import API from '../api'
import { Package, RefreshCw, Search } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredProducts = products.filter(p => 
    (p.material_code || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.material_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search material code or name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', fontSize: 14 }}
          />
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value stat-accent">{products.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Last Updated</span>
          <span className="stat-value" style={{ fontSize: 16 }}>
            {products.length > 0 ? (
              new Date(Math.max(...products.map(p => new Date(p.updated_at).getTime()))).toLocaleString(undefined, { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })
            ) : 'Never'}
          </span>
        </div>
        {searchQuery && (
          <div className="stat-card">
            <span className="stat-label">Search Results</span>
            <span className="stat-value" style={{ color: 'var(--text)' }}>{filteredProducts.length}</span>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Material Code</th>
              <th>Material Name</th>
              <th>Pack Size</th>
            </tr>
          </thead>
        <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading…</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={4}>
                <div className="empty-state"><Package size={40} /><p>{searchQuery ? 'No products match your search.' : 'No products available.'}</p></div>
              </td></tr>
            ) : filteredProducts.map((p, i) => {
              const packSizeMatch = p.material_name?.trim().match(/(\d{4})$/)
              const packSize = packSizeMatch ? packSizeMatch[1] : '-'
              return (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                <td><span className="badge badge-accent">{p.material_code}</span></td>
                <td>{p.material_name}</td>
                <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{packSize}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}
