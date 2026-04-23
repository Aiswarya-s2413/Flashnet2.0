import { useState, useEffect } from 'react'
import API from '../api'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react'
import Pagination from '../components/Pagination'
import { useSortableData, SortHeader } from '../components/SortableTable'

const ROWS_PER_PAGE = 25

export default function UploadOrdersPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [orders, setOrders] = useState([])
  const [fetching, setFetching] = useState(true)
  const { sorted, sortKey, sortDir, requestSort } = useSortableData(orders)

  const [traderTemplates, setTraderTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [fileHeaders, setFileHeaders] = useState([])
  const [columnMapping, setColumnMapping] = useState({
    sold_to: '', ship_to: '', invoice_no: '', invoice_date: '',
    customer: '', material_code: '', material_name: '', packsize: '', qty: ''
  })
  const [traderName, setTraderName] = useState('')
  const [mappingMode, setMappingMode] = useState(false)

  const fetchOrders = async () => {
    setFetching(true)
    try {
      const res = await API.get('/orders/')
      setOrders(res.data)
    } catch(e) {
      console.error(e)
    } finally {
      setFetching(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await API.get('/trader-templates/')
      setTraderTemplates(res.data)
    } catch(e) {
      console.error("Failed to load templates", e)
    }
  }

  useEffect(() => { 
    fetchOrders()
    fetchTemplates()
  }, [])

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setAlert(null)
      
      // If we are creating a new custom mapping, extract headers immediately
      if (selectedTemplate === 'new') {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)
        try {
          const res = await API.post('/orders/extract-headers/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          setFileHeaders(res.data.headers || [])
          setMappingMode(true)
        } catch (e) {
          setAlert({ type: 'error', title: 'Header Extraction Failed', messages: [e.response?.data?.error || e.message] })
        } finally {
          setLoading(false)
        }
      } else {
        setMappingMode(false)
      }
    }
  }

  const handleUpload = async (e, ignoreErrors = false) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!file) return

    setLoading(true)
    setAlert(null)

    // Ensure all mappings are filled if in mapping mode
    if (mappingMode) {
      const missing = Object.entries(columnMapping).filter(([k,v]) => !v).map(([k]) => k)
      if (missing.length > 0) {
        setAlert({ type: 'error', title: 'Incomplete Mapping', messages: [`Please map all fields. Missing: ${missing.join(', ')}`] })
        setLoading(false)
        return
      }
    }

    // Save Template if requested
    if (mappingMode && traderName.trim()) {
      try {
        const tResponse = await API.post('/trader-templates/', {
          trader_name: traderName,
          column_mapping: columnMapping
        })
        fetchTemplates()
        setSelectedTemplate(tResponse.data.id.toString())
      } catch(e) {
        setAlert({ type: 'error', title: 'Template Save Failed', messages: ['A template with this name might already exist.'] })
        setLoading(false)
        return
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    if (ignoreErrors) {
      formData.append('ignore_errors', 'true')
    }
    
    // Attach mapping
    let activeMapping = null
    if (mappingMode) {
      activeMapping = columnMapping
    } else if (selectedTemplate && selectedTemplate !== 'new' && selectedTemplate !== 'standard') {
      const t = traderTemplates.find(x => x.id.toString() === selectedTemplate)
      if (t) activeMapping = t.column_mapping
    }
    
    if (activeMapping) {
      formData.append('mapping', JSON.stringify(activeMapping))
    }

    try {
      const res = await API.post('/orders/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAlert({ type: 'success', title: 'Upload Successful', messages: [res.data.message] })
      setFile(null)
      setMappingMode(false)
      document.getElementById('file-upload').value = ''
      fetchOrders()
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

  const MappingRow = ({ label, fieldKey }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: 14, fontWeight: 500, width: '40%' }}>{label}</span>
      <select 
        style={{ width: '55%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1' }}
        value={columnMapping[fieldKey]}
        onChange={(e) => setColumnMapping({...columnMapping, [fieldKey]: e.target.value})}
      >
        <option value="">-- Select Column --</option>
        {fileHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
      </select>
    </div>
  )

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

      <div style={{ display: 'grid', gridTemplateColumns: mappingMode ? '1fr 1fr' : '1fr', gap: 32, alignItems: 'start' }}>
        
        {/* Upload Card */}
        <div className="card" style={{ padding: 40, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'var(--surface)' }}>
          <form onSubmit={handleUpload} style={{ width: '100%', maxWidth: 500 }}>
            
            <div style={{ textAlign: 'left', width: '100%', marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Document Format Template</label>
              <select 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, backgroundColor: '#f8fafc' }}
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value)
                  setFile(null)
                  setMappingMode(false)
                  if(document.getElementById('file-upload')) document.getElementById('file-upload').value = ''
                }}
              >
                <option value="standard">Standard / Auto-Detect Format</option>
                <optgroup label="Saved Trader Templates">
                  {traderTemplates.map(t => (
                    <option key={t.id} value={t.id.toString()}>{t.trader_name}</option>
                  ))}
                </optgroup>
                <option value="new">+ Create Custom Mapping</option>
              </select>
            </div>

            <div style={{ 
                border: '2px dashed var(--border)', borderRadius: 12, padding: '40px 20px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg)', marginBottom: 24 
              }}>
              <UploadCloud size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select Order Document</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>Only explicitly formatted .xlsx or .xls files</p>
              <input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'block', width: '100%', fontSize: 13 }} required />
            </div>
            
            {!mappingMode && (
              <button className="btn btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', padding: 12, justifyContent: 'center' }}>
                {loading ? <span className="spinner" /> : <FileSpreadsheet size={18} />}
                {loading ? 'Processing Document...' : 'Process Document'}
              </button>
            )}
          </form>
        </div>

        {/* Dynamic Mapping UI */}
        {mappingMode && (
          <div className="card" style={{ padding: '32px 24px', backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={20} color="#3b82f6" /> Map Custom Columns</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
              We've extracted the headers from your file. Match them to our system fields below so this document can be processed correctly.
            </p>

            <MappingRow label="Sold To Region/Code" fieldKey="sold_to" />
            <MappingRow label="Ship To Details" fieldKey="ship_to" />
            <MappingRow label="Invoice Number *" fieldKey="invoice_no" />
            <MappingRow label="Invoice Date *" fieldKey="invoice_date" />
            <MappingRow label="Customer Name" fieldKey="customer" />
            <MappingRow label="Material Code" fieldKey="material_code" />
            <MappingRow label="Material Name *" fieldKey="material_name" />
            <MappingRow label="Packsize (kg)" fieldKey="packsize" />
            <MappingRow label="Quantity (kg) *" fieldKey="qty" />

            <div style={{ marginTop: 24, padding: '16px', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0f766e', display: 'block', marginBottom: 6 }}>Save Mapping Template As (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Trader Alpha Format" 
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #99f6e4', borderRadius: 4, background: '#fff' }}
                value={traderName}
                onChange={(e) => setTraderName(e.target.value)}
              />
              <p style={{ fontSize: 11, color: '#0d9488', marginTop: 6, margin: 0 }}>Save this to skip this step for future uploads from this trader.</p>
            </div>

            <button className="btn btn-primary" onClick={handleUpload} disabled={loading} style={{ width: '100%', padding: 12, justifyContent: 'center', marginTop: 24 }}>
              {loading ? <span className="spinner" /> : <CheckCircle size={18} />}
              {loading ? 'Processing Document...' : 'Confirm Mapping & Process Upload'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{orders.length > 0 ? `Uploaded Sales Register Records (${orders.length})` : 'Required Document Structure'}</h3>
        {orders.length > 0 && (
          <button className="btn btn-outline" onClick={fetchOrders} style={{ fontSize: 13, padding: '4px 12px' }}>
            <RefreshCw size={13} /> Refresh List
          </button>
        )}
      </div>

      <div className="table-wrapper" style={{ overflowX: 'hidden' }}>
        <table style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead style={{ backgroundColor: 'var(--surface)' }}>
            <tr>
              <SortHeader label="Sold To" sortKey="sold_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Ship To" sortKey="ship_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Invoice No." sortKey="invoice_no" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Invoice Date" sortKey="invoice_date" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Customer Name" sortKey="customer" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Material Code" sortKey="material_code" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Material Name" sortKey="material_name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="Packsize(kg)" sortKey="packsize" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
              <SortHeader label="qty(kg)" sortKey="qty" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading Orders…</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-dim)' }}>
                  <FileSpreadsheet size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div>Data mapping aligns strictly downward matching these exact column properties.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Material Names are strictly cross-referenced securely against the absolute Product Master natively.</div>
                </td>
              </tr>
            ) : (
              sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((o, i) => (
                <tr key={o.id || i}>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.sold_to}>{o.sold_to}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.ship_to}>{o.ship_to}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.invoice_no}><span className="badge badge-accent">{o.invoice_no}</span></td>
                  <td>{o.invoice_date}</td>
                  <td style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', borderBottom: 'none' }} title={o.customer}>{o.customer}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.material_code}>{o.material_code}</td>
                  <td style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', borderBottom: 'none' }} title={o.material_name}>{o.material_name}</td>
                  <td>{o.packsize}</td>
                  <td><span className="badge badge-green">{o.qty}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={Math.ceil(orders.length / ROWS_PER_PAGE)} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
