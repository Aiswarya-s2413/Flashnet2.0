import { useState, useEffect } from 'react'
import API from '../api'
import { Package, RefreshCw, Search, X } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)

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

      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-title">{alert.title}</span>
          <ul>{alert.messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <div className="page-actions">
        <div className="search-container" style={{ flex: 1, maxWidth: 350 }}>
          <Search className="search-icon" size={16} />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search material code or name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <button className="btn btn-outline" onClick={fetchProducts}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value stat-accent">{loading ? '-' : products.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Last Updated</span>
          <span className="stat-value" style={{ fontSize: 16 }}>
            {loading ? '-' : products.length > 0 ? (
              new Date(Math.max(...products.map(p => new Date(p.updated_at).getTime()))).toLocaleString(undefined, { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })
            ) : 'Never'}
          </span>
        </div>
        {searchQuery && (
          <div className="stat-card">
            <span className="stat-label">Search Results</span>
            <span className="stat-value" style={{ color: 'var(--text)' }}>{loading ? '-' : filteredProducts.length}</span>
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
              <tr key={p.id} onClick={() => setSelectedRow(p)} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                <td><span className="badge badge-accent">{p.material_code}</span></td>
                <td>{p.material_name}</td>
                <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{packSize}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Product details</h2>
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
