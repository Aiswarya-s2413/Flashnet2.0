import { useState, useEffect } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import Pagination from '../components/Pagination'
import { useSortableData, SortHeader } from '../components/SortableTable'

const ROWS_PER_PAGE = 25

export default function UploadStockPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [stocks, setStocks] = useState([])
  const [fetching, setFetching] = useState(true)
  const { sorted, sortKey, sortDir, requestSort } = useSortableData(stocks)

  const fetchStocks = async () => {
    setFetching(true)
    try {
      const res = await API.get('/stocks/')
      setStocks(res.data)
    } catch(e) {
      console.error(e)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchStocks()
  }, [])


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
      const res = await API.post('/stocks/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAlert({ type: 'success', title: 'Upload Successful', messages: [res.data.message] })
      setFile(null)
      document.getElementById('file-upload').value = ''
      fetchStocks()
      setCurrentPage(1)
    } catch (e) {
      const data = e.response?.data
      if (data?.errors) {
        setAlert({
          type: 'error',
          title: data.message || 'Validation Encountered Failures',
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
        <h1 className="page-title">Stock Level Inventory Upload</h1>

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
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
               <FileSpreadsheet size={42} style={{ color: 'var(--primary)' }} />
               <FileText size={42} style={{ color: 'var(--text-dim)' }} />
            </div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select Stock Report Document</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>Supports robust multi-format matching across .xlsx or .pdf files natively</p>
            <input id="file-upload" type="file" accept=".xlsx, .xls, .pdf" onChange={handleFileChange} style={{ display: 'block', width: '100%', fontSize: 13 }} required />
          </div>
          
          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <UploadCloud size={18} />}
            {loading ? 'Crunching Master Code Validations...' : 'Process Document Securely'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{stocks.length > 0 ? `Uploaded Stock Level Records (${stocks.length})` : 'Required Document Structure'}</h3>
        {stocks.length > 0 && (
          <button className="btn btn-outline" onClick={fetchStocks} style={{ fontSize: 13, padding: '4px 12px' }}>
            <RefreshCw size={13} /> Refresh List
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead style={{ backgroundColor: 'var(--surface)' }}>
            <tr>
              <SortHeader label="Sold To" sortKey="sold_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Ship To" sortKey="ship_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Product Code" sortKey="product_code" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Prod Desc" sortKey="product_desc" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Avg 6M Sales" sortKey="avg_six_month_sales" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Month End Inv" sortKey="month_end_inventory" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Mid Month Inv" sortKey="mid_month_inventory" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Remarks" sortKey="remarks" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading Stock Data…</td></tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                  <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div>Data mapping automatically dynamically binds and evaluates rows structurally.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>"Product Code" properties are forcefully vetted aggressively avoiding unregistered Product Master data leaks.</div>
                </td>
              </tr>
            ) : (
              sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((s, i) => (
                <tr key={s.id || i}>
                  <td>{s.sold_to}</td>
                  <td>{s.ship_to}</td>
                  <td style={{ fontFamily: 'monospace' }}>{s.product_code}</td>
                  <td>{s.product_desc}</td>
                  <td>{s.avg_six_month_sales?.toFixed(2) || '-'}</td>
                  <td>{s.month_end_inventory?.toFixed(2) || '-'}</td>
                  <td>{s.mid_month_inventory?.toFixed(2) || '-'}</td>
                  <td>{s.remarks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={Math.ceil(stocks.length / ROWS_PER_PAGE)} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
