import { useState } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

export default function UploadStockPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [ignoreErrors, setIgnoreErrors] = useState(false)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setAlert(null)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setAlert(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('ignore_errors', ignoreErrors)

    try {
      const res = await API.post('/stocks/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAlert({ type: 'success', title: 'Upload Successful', messages: [res.data.message] })
      setFile(null)
      document.getElementById('file-upload').value = ''
    } catch (e) {
      const data = e.response?.data
      if (data?.errors) {
        setAlert({
          type: 'error',
          title: data.message || 'Validation Encountered Failures',
          messages: data.errors 
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
          <ul style={{ margin: 0, paddingLeft: 24, maxHeight: 150, overflowY: 'auto' }}>
            {alert.messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
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
            <input id="file-upload" type="file" accept=".xlsx, .xls, .pdf" onChange={handleFileChange} style={{ display: 'block', width: '100%', fontSize: 13, marginBottom: 16 }} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', userSelect: 'none', width: '100%', justifyContent: 'flex-start' }}>
              <input type="checkbox" checked={ignoreErrors} onChange={(e) => setIgnoreErrors(e.target.checked)} style={{ cursor: 'pointer', scale: '1.2' }} />
              <span style={{ color: 'var(--text)' }}>Ignore validation errors (skip conflicting rows securely)</span>
            </label>
          </div>
          
          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <UploadCloud size={18} />}
            {loading ? 'Crunching Master Code Validations...' : 'Process Document Securely'}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Required Document Structure</h3>


      <div className="table-wrapper">
        <table>
          <thead style={{ backgroundColor: 'var(--surface)' }}>
            <tr>
              <th>Sold To</th>
              <th>Ship To</th>
              <th>Product Code</th>
              <th>Prod Desc</th>
              <th>Avg Last six month sales in kg</th>
              <th>Month End Inventory</th>
              <th>Mid Month Inventory</th>
              <th>Remarks/Comments</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div>Data mapping automatically dynamically binds and evaluates rows structurally.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>"Product Code" properties are forcefully vetted aggressively avoiding unregistered Product Master data leaks.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
