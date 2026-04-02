import { useState } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react'

export default function UploadOrdersPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

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
    if (ignoreErrors) {
      formData.append('ignore_errors', 'true')
    }

    try {
      const res = await API.post('/orders/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAlert({ type: 'success', title: 'Upload Successful', messages: [res.data.message] })
      setFile(null)
      document.getElementById('file-upload').value = ''
    } catch (e) {
      const data = e.response?.data
      if (data?.errors) {
        // Validation format errors mapped to UI
        setAlert({
          type: 'error',
          title: data.message || 'Data Validation Checks Failed',
          messages: data.errors, // Shows "Row N: Material ... not matching..." perfectly!
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
        <h1 className="page-title">Sales Register Upload</h1>

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
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select Order Document</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>Only explicitly formatted .xlsx or .xls files</p>
            <input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'block', width: '100%', fontSize: 13 }} required />
          </div>
          
          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <FileSpreadsheet size={18} />}
            {loading ? 'Validating against Product Master...' : 'Process Document'}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Required Document Structure</h3>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24 }}>
        Your underlying spreadsheet must retain structural integrity with identical column headers mimicking the native Order Page. Empty columns and fields are securely parsed as blank.
      </p>

      <div className="table-wrapper">
        <table>
          <thead style={{ backgroundColor: 'var(--surface)' }}>
            <tr>
              <th>Sold To</th>
              <th>Ship To</th>
              <th>Invoice No.</th>
              <th>Invoice Date</th>
              <th>Customer Name</th>
              <th>Material Code</th>
              <th>Material Name</th>
              <th>Packsize(kg)</th>
              <th>qty(kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div>Data mapping aligns strictly downward matching these exact column properties.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Material Names are strictly cross-referenced securely against the absolute Product Master natively.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
