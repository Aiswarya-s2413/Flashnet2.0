import { useState } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react'

export default function UploadCSISalesPage() {
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
    if (ignoreErrors) formData.append('ignore_errors', 'true')

    try {
      const res = await API.post('/csi-sales/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAlert({ type: 'success', title: 'Upload Successful', messages: [res.data.message] })
      setFile(null)
      document.getElementById('csi-file-upload').value = ''
    } catch (e) {
      const data = e.response?.data
      if (data?.errors) {
        setAlert({
          type: 'error',
          title: data.message || 'Validation Failed',
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
        <h1 className="page-title">CSI Sales Upload</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
          Upload CSI (Customer Sales Intelligence) distributor files. Monthly columns are converted to individual secondary sales records dated the 1st of each month.
        </p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 24, fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {alert.type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
            <span className="alert-title" style={{ margin: 0 }}>{alert.title}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 24, maxHeight: 180, overflowY: 'auto', marginBottom: alert.ignorable ? 16 : 0 }}>
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

      {/* How it works */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24, backgroundColor: 'var(--surface)', borderLeft: '4px solid var(--primary)' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>How This Works</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          <li>Upload one CSI file per distributor (e.g. <strong>CSI_ME</strong> for Mikhail Enterprises, <strong>CSI_VTC</strong> for Vikram Trading)</li>
          <li>Each monthly column (Oct-25, Nov-25…) becomes a separate secondary sales record</li>
          <li><strong>Invoice date</strong> is automatically set to the <strong>1st of that month</strong></li>
          <li>Records appear instantly in the Dashboard and Primary vs Secondary Analytics</li>
        </ul>
      </div>

      <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'var(--surface)' }}>
        <form onSubmit={handleUpload} style={{ width: '100%', maxWidth: 500 }}>
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 12, padding: '40px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg)', marginBottom: 24
          }}>
            <UploadCloud size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select CSI Sales Document</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
              CSI_ME or CSI_VTC Excel files (.xlsx / .xls)
            </p>
            <input
              id="csi-file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'block', width: '100%', fontSize: 13 }}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <FileSpreadsheet size={18} />}
            {loading ? 'Processing months...' : 'Process CSI Document'}
          </button>
        </form>
      </div>
    </div>
  )
}
