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


      <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--surface)' }}>
        <form onSubmit={handleUpload} style={{ width: '100%', maxWidth: 500 }}>
          <label className="upload-area" style={{ display: 'block', marginBottom: 24 }}>
            <div className="upload-area-icon">
              <UploadCloud size={24} />
            </div>
            <p>{file ? file.name : "Select CSI Sales Document"}</p>
            <small>{file ? `${(file.size / 1024).toFixed(1)} KB` : "CSI_ME or CSI_VTC Excel files (.xlsx / .xls)"}</small>
            <input
              id="csi-file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              required
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <FileSpreadsheet size={18} />}
            {loading ? 'Processing months...' : 'Process CSI Document'}
          </button>
        </form>
      </div>
    </div>
  )
}
