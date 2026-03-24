import { useState, useEffect } from 'react'
import API from '../api'
import { Plus, FileText, X, ArrowUpCircle, RefreshCw } from 'lucide-react'

const EMPTY_FORM = {
  invoice_no: '', invoice_date: '', material_code: '', material_name: '',
  packsize: '', qty: '', customer: '', ship_to: '', sold_to: '',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [alert, setAlert] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, prodRes] = await Promise.all([
        API.get('/invoices/'),
        API.get('/products/')
      ])
      setInvoices(invRes.data)
      setProducts(prodRes.data)
    } catch (e) {
      setAlert({ type: 'error', title: 'Error', messages: [e.message] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleProductChange = (e) => {
    const selectedName = e.target.value;
    const matchedProduct = products.find(p => p.material_name === selectedName);
    setForm(f => ({
      ...f,
      material_name: selectedName,
      material_code: matchedProduct ? matchedProduct.material_code : ''
    }))
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Enforce Corporate Hard-Validation: No fields can be entirely whitespace
    const hasEmptyField = Object.entries(form).some(([key, val]) => String(val).trim() === '');
    if (hasEmptyField) {
      setAlert({ type: 'error', title: 'Validation Error', messages: ['All fields are strictly required. Fields cannot be empty or contain only blank spaces.'] });
      return;
    }

    // Validation for DD-MM-YYYY format
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(form.invoice_date)) {
      setAlert({ type: 'error', title: 'Validation Error', messages: ['Invoice date must be in DD-MM-YYYY format.'] })
      return;
    }

    const [day, month, year] = form.invoice_date.split('-');
    const invoiceDateObj = new Date(year, month - 1, day);
    const currentDate = new Date();
    
    // Check for valid calendar date
    if (
      invoiceDateObj.getFullYear() != year ||
      invoiceDateObj.getMonth() != month - 1 ||
      invoiceDateObj.getDate() != day
    ) {
      setAlert({ type: 'error', title: 'Validation Error', messages: ['Invoice date is not a valid calendar date.'] })
      return;
    }

    // Check if future
    if (invoiceDateObj > currentDate) {
      setAlert({ type: 'error', title: 'Validation Error', messages: ['Invoice date cannot be in the future.'] })
      return;
    }

    // Enforce that qty is a multiple of packsize
    const packsizeNum = parseFloat(form.packsize);
    const qtyNum = parseFloat(form.qty);
    
    if (!isNaN(packsizeNum) && packsizeNum > 0) {
      if (qtyNum % packsizeNum !== 0) {
        setAlert({ type: 'error', title: 'Validation Error', messages: ['qty(kg) must be a strict multiple of the Packsize(kg).'] })
        return;
      }
    }

    setSaving(true)
    try {
      await API.post('/invoices/', { ...form, qty: parseInt(form.qty) })
      setAlert({ type: 'success', title: 'Invoice Added', messages: ['Distributor invoice saved successfully.'] })
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchData()
    } catch (e) {
      const data = e.response?.data
      const msgs = data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`) : [e.message]
      setAlert({ type: 'error', title: 'Save Failed', messages: msgs })
    } finally {
      setSaving(false)
    }
  }

  const handleExtract = async () => {
    setExtracting(true)
    setAlert(null)
    try {
      const res = await API.post('/orders/extract/')
      setAlert({ type: 'success', title: 'Extraction Complete', messages: [res.data.message] })
    } catch (e) {
      const data = e.response?.data
      if (data?.errors) {
        setAlert({
          type: 'error',
          title: data.message || 'Extraction had validation errors',
          messages: data.errors,
        })
      } else {
        setAlert({ type: 'error', title: 'Extraction Failed', messages: [e.message] })
      }
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Distributor Invoices</h1>
        <p className="page-subtitle">Secondary sales — Distributor to Customer</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-title">{alert.title}</span>
          <ul>{alert.messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <div className="page-actions">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setAlert(null) }}>
            <Plus size={15} /> Add Invoice
          </button>
          <button className="btn btn-success" onClick={handleExtract} disabled={extracting || invoices.length === 0}>
            {extracting ? <><span className="spinner" /> Extracting…</> : <><ArrowUpCircle size={15} /> Extract to Orders</>}
          </button>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Invoices</span>
          <span className="stat-value stat-accent">{invoices.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Qty</span>
          <span className="stat-value stat-green">{invoices.reduce((s, i) => s + i.qty, 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unique Customers</span>
          <span className="stat-value">{new Set(invoices.map(i => i.customer)).size}</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
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
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state"><FileText size={40} /><p>No invoices yet. Add your first distributor invoice.</p></div>
              </td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id}>
                <td>{inv.sold_to}</td>
                <td>{inv.ship_to}</td>
                <td><span className="badge badge-accent">{inv.invoice_no}</span></td>
                <td>{inv.invoice_date}</td>
                <td>{inv.customer}</td>
                <td>{inv.material_code}</td>
                <td>{inv.material_name}</td>
                <td>{inv.packsize}</td>
                <td><span className="badge badge-green">{inv.qty}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>Add Distributor Invoice</h2>
              <button className="btn btn-outline" style={{ padding: '6px 8px' }} onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sold_to">Sold To ID</label>
                  <input id="sold_to" type="number" step="1" name="sold_to" value={form.sold_to} onChange={handleChange} required placeholder="e.g. 100567" />
                </div>
                <div className="form-group">
                  <label htmlFor="ship_to">Ship To ID</label>
                  <input id="ship_to" type="number" step="1" name="ship_to" value={form.ship_to} onChange={handleChange} required placeholder="e.g. 100234" />
                </div>
                <div className="form-group">
                  <label htmlFor="invoice_no">Invoice No.</label>
                  <input id="invoice_no" name="invoice_no" value={form.invoice_no} onChange={handleChange} required placeholder="INV-001" />
                </div>
                <div className="form-group">
                  <label htmlFor="invoice_date">Invoice Date</label>
                  <input id="invoice_date" name="invoice_date" type="text" value={form.invoice_date} onChange={handleChange} required placeholder="DD-MM-YYYY" />
                </div>
                <div className="form-group full">
                  <label htmlFor="customer">Customer Name</label>
                  <input id="customer" name="customer" value={form.customer} onChange={handleChange} required placeholder="Corporate designation" />
                </div>
                <div className="form-group">
                  <label htmlFor="material_code">Material Code</label>
                  <input id="material_code" name="material_code" value={form.material_code} readOnly required placeholder="Auto-fills on selection" style={{ backgroundColor: 'var(--bg)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="material_name">Material Name</label>
                  <select id="material_name" name="material_name" value={form.material_name} onChange={handleProductChange} required>
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.material_name}>{p.material_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="packsize">Packsize(kg)</label>
                  <input id="packsize" type="number" step="any" name="packsize" value={form.packsize} onChange={handleChange} required placeholder="40" />
                </div>
                <div className="form-group">
                  <label htmlFor="qty">qty(kg)</label>
                  <input id="qty" name="qty" type="number" step="any" min="1" value={form.qty} onChange={handleChange} required placeholder="120" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : <><Plus size={15} /> Save Invoice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
