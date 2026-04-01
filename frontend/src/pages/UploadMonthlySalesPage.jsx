import { useState } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

export default function UploadMonthlySalesPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

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

    try {
      const res = await API.post('/monthly-sales/upload/', formData, {
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
        <h1 className="page-title">Monthly Sales to Customers Validation</h1>
        <p className="page-subtitle">Mass import physical dimension sales logs directly via multi-level spreadsheet mappings.</p>
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
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select Monthly Sales Document</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>Supports multi-layer dynamically mapped sheets skipping initial headers seamlessly</p>
            <input id="file-upload" type="file" accept=".xlsx, .xls, .pdf" onChange={handleFileChange} style={{ display: 'block', width: '100%', fontSize: 13 }} required />
          </div>
          
          <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : <UploadCloud size={18} />}
            {loading ? 'Crunching Nested Matrix Mapping...' : 'Process Monthly Sales Document'}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Required Document Structure</h3>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24 }}>
        Your underlying spreadsheet explicitly assumes "Distributor Name" block mapping logic is physically situated at Row 3 accurately mirroring the CSI template exactly.
      </p>

      <div className="table-wrapper">
        <table>
          <thead style={{ backgroundColor: 'var(--surface)' }}>
            <tr>
              <th colSpan="7" style={{textAlign: 'center', borderRight: '1px solid var(--border)'}}>Dimensions</th>
              <th colSpan="4" style={{textAlign: 'center', borderRight: '1px solid var(--border)'}}>Volume (Kgs)</th>
              <th colSpan="4" style={{textAlign: 'center'}}>Value (INR)</th>
            </tr>
            <tr>
              <th>Distributor Name</th>
              <th>Ship To Code</th>
              <th>Customer Name</th>
              <th>Customer Classification</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th style={{borderRight: '1px solid var(--border)'}}>Product BD Group</th>
              <th>Oct-25</th>
              <th>Nov-25</th>
              <th>...</th>
              <th style={{borderRight: '1px solid var(--border)', color: 'var(--primary)'}}>Total Volume (kg)</th>
              <th>Oct-25</th>
              <th>Nov-25</th>
              <th>...</th>
              <th style={{color: 'var(--primary)'}}>Total Value (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={15} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div>Data mapping automatically unpacks horizontally parsing all columns dynamically regardless of explicit months mapped currently.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>"Product Code" properties are forcefully vetted aggressively bypassing non-indexed Product Master fragments natively.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
