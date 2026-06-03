import { useState, useEffect } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw, X } from 'lucide-react'
import Pagination from '../components/Pagination'
import { useSortableData, SortHeader } from '../components/SortableTable'

const ROWS_PER_PAGE = 25

export default function UploadPrimarySalesPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sales, setSales] = useState([])
  const [fetching, setFetching] = useState(true)
  const { sorted, sortKey, sortDir, requestSort } = useSortableData(sales)
  const [selectedRow, setSelectedRow] = useState(null)

  const fetchSales = async () => {
    setFetching(true)
    try {
      const res = await API.get('/primary-sales/')
      setSales(res.data)
    } catch(e) {
      console.error(e)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchSales() }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setAlert(null)
    }
  }

  const handleUpload = async (e, ignoreErrors = false) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!file) return

    setLoading(true)
    setAlert(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('ignore_errors', ignoreErrors)
    if (ignoreErrors) {
      formData.append('ignore_errors', 'true')
    }

    try {
      const res = await API.post('/primary-sales/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAlert({ type: 'success', title: 'Upload Successful', messages: [res.data.message] })
      setFile(null)
      document.getElementById('file-upload').value = ''
      fetchSales()
      setCurrentPage(1)
    } catch (e) {
      const data = e.response?.data
      if (data?.errors) {
        setAlert({
          type: 'error',
          title: data.message || 'Data Validation Checks Failed',
          messages: data.errors,
          ignorable: true
        })
      } else {
        setAlert({ type: 'error', title: 'Upload Failed', messages: [data?.error || e.message] })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Primary Sales Upload</h1>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 24, fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {alert.type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
            <span className="alert-title" style={{ margin: 0 }}>{alert.title}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 24, maxHeight: 150, overflowY: 'auto', marginBottom: alert.ignorable ? 16 : 0 }}>
            {alert.messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
          {alert.ignorable && (
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 12 }}>
              <button 
                type="button" 
                onClick={() => handleUpload(null, true)}
                className="btn" 
                style={{ backgroundColor: '#fff', color: '#d9534f', border: '1px solid #d9534f', fontSize: 13, padding: '6px 12px' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Ignore Errors and Upload Valid Data'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 40, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--surface)' }}>
        <form onSubmit={handleUpload} style={{ width: '100%', maxWidth: 500 }}>
          <label className="upload-area" style={{ display: 'block', marginBottom: 24 }}>
            <div className="upload-area-icon">
              <UploadCloud size={24} />
            </div>
            <p>{file ? file.name : "Select Primary Sales Document"}</p>
            <small>{file ? `${(file.size / 1024).toFixed(1)} KB` : "Only explicitly formatted .xlsx or .xls files"}</small>
            <input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange} required />
          </label>
          
          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <FileSpreadsheet size={18} />}
            {loading ? 'Validating against Product Master...' : 'Process Document'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{sales.length > 0 ? `Uploaded Primary Sales Records (${sales.length})` : 'Required Document Structure'}</h3>
        {sales.length > 0 && (
          <button className="btn btn-outline" onClick={fetchSales} style={{ fontSize: 13, padding: '4px 12px' }}>
            <RefreshCw size={13} /> Refresh List
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead style={{ backgroundColor: 'var(--surface)' }}>
            <tr>
              <SortHeader label="Billing No" sortKey="billing_no" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Tax Invoice No" sortKey="tax_invoice_no" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Sales Order" sortKey="sales_order" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="SO Date" sortKey="so_creation_date" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Division" sortKey="division" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Sold To" sortKey="sold_to_party" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Sold To Addr" sortKey="sold_to_party_address" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Ship To" sortKey="ship_to_party" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Ship To Name" sortKey="ship_to_party_name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Mat. Code" sortKey="material_code" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Material Desc" sortKey="material_desc" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Billing Date" sortKey="billing_date" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Plant" sortKey="plant" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Rate" sortKey="rate_per_unit" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Billed Qty" sortKey="billed_quantity" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Assessable Value" sortKey="assessable_value" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={16} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading Primary Sales…</td></tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                  <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div>Data mapping aligns strictly downward matching these exact column properties natively.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Material Names are strictly cross-referenced securely against the absolute Product Master natively.</div>
                </td>
              </tr>
            ) : (
              sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((s, i) => (
                <tr key={s.id || i} onClick={() => setSelectedRow(s)} style={{ cursor: 'pointer' }}>
                  <td><span className="badge badge-accent">{s.billing_no}</span></td>
                  <td>{s.tax_invoice_no}</td>
                  <td>{s.sales_order}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{s.so_creation_date}</td>
                  <td>{s.division}</td>
                  <td>{s.sold_to_party}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.sold_to_party_address}>{s.sold_to_party_address}</td>
                  <td>{s.ship_to_party}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.ship_to_party_name}>{s.ship_to_party_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.material_code}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.material_desc}>{s.material_desc}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{s.billing_date}</td>
                  <td>{s.plant}</td>
                  <td>{s.rate_per_unit}</td>
                  <td>{s.billed_quantity}</td>
                  <td><span className="badge badge-green" style={{ whiteSpace: 'nowrap' }}>{Math.round(s.assessable_value || 0).toLocaleString('en-IN')}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={Math.ceil(sales.length / ROWS_PER_PAGE)} onPageChange={setCurrentPage} />
      </div>
      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Primary Sales record details</h2>
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
