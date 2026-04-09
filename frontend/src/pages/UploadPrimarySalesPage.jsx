import { useState, useEffect } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
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

      <div className="card" style={{ padding: 40, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'var(--surface)' }}>
        <form onSubmit={handleUpload} style={{ width: '100%', maxWidth: 500 }}>
          <div style={{ 
              border: '2px dashed var(--border)', borderRadius: 12, padding: '40px 20px', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg)', marginBottom: 24 
            }}>
            <UploadCloud size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select Primary Sales Document</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>Only explicitly formatted .xlsx or .xls files</p>
            <input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'block', width: '100%', fontSize: 13 }} required />
          </div>
          
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
              <SortHeader label="Material Code" sortKey="material_code" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Material Desc" sortKey="material_desc" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Assessable Value" sortKey="assessable_value" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Sold To Party" sortKey="sold_to_party_name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading Primary Sales…</td></tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                  <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div>Data mapping aligns strictly downward matching these exact column properties natively.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Material Names are strictly cross-referenced securely against the absolute Product Master natively.</div>
                </td>
              </tr>
            ) : (
              sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((s, i) => (
                <tr key={s.id || i}>
                  <td><span className="badge badge-accent">{s.billing_no}</span></td>
                  <td>{s.tax_invoice_no}</td>
                  <td>{s.sales_order}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.material_code}</td>
                  <td>{s.material_desc}</td>
                  <td><span className="badge badge-green">{Math.round(s.assessable_value).toLocaleString('en-IN')}</span></td>
                  <td>{s.sold_to_party}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={Math.ceil(sales.length / ROWS_PER_PAGE)} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
