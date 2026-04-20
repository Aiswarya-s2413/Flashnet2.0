import React, { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, ArrowRight, X } from 'lucide-react'

export default function PriceRequestApprovalsPage() {
  const [eprs, setEprs] = useState([])
  const [selectedEpr, setSelectedEpr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEPRs = () => {
    setLoading(true)
    fetch('/api/epr/')
      .then(res => res.json())
      .then(data => {
        setEprs(data)
        setLoading(false)
      })
      .catch(err => {
        setError("Failed to fetch EPRs")
        setLoading(false)
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEPRs()
  }, [])

  const updateStatus = async (eprId, newStatus) => {
    try {
      const response = await fetch(`/api/epr/${eprId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setSelectedEpr(null)
        fetchEPRs()
      } else {
        alert("Failed to update status")
      }
    } catch (err) {
      alert("Error updating status: " + err.message)
    }
  }

  const renderActionButtons = (epr) => {
    if (epr.status === 'Pending Sales Exec Review') {
      return (
        <>
          <button onClick={() => updateStatus(epr.id, 'Pending Pricing & BD Teams')} style={btnApproveStyle}>
            <ArrowRight size={16} /> Forward to Pricing & BD
          </button>
          <button onClick={() => updateStatus(epr.id, 'Rejected')} style={btnRejectStyle}>
            <XCircle size={16} /> Reject
          </button>
        </>
      )
    }
    
    if (epr.status === 'Pending Pricing & BD Teams') {
      return (
        <>
          <button onClick={() => updateStatus(epr.id, 'Approved')} style={btnApproveStyle}>
            <CheckCircle size={16} /> Approve
          </button>
          <button onClick={() => updateStatus(epr.id, 'Pending Sales Director')} style={btnEscalateStyle}>
            <ArrowRight size={16} /> Escalate to Sales Director
          </button>
          <button onClick={() => updateStatus(epr.id, 'Rejected')} style={btnRejectStyle}>
            <XCircle size={16} /> Reject
          </button>
        </>
      )
    }
    
    if (epr.status === 'Pending Sales Director') {
      return (
        <>
          <button onClick={() => updateStatus(epr.id, 'Approved')} style={btnApproveStyle}>
            <CheckCircle size={16} /> Director Approve
          </button>
          <button onClick={() => updateStatus(epr.id, 'Rejected')} style={btnRejectStyle}>
            <XCircle size={16} /> Reject
          </button>
        </>
      )
    }

    return (
      <span style={{ fontWeight: 'bold', color: epr.status === 'Approved' ? '#15803d' : '#b91c1c' }}>
        Status: {epr.status}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span style={{...badgeBase, background: '#dcfce7', color: '#166534'}}>Approved</span>
    if (status === 'Rejected') return <span style={{...badgeBase, background: '#fee2e2', color: '#b91c1c'}}>Rejected</span>
    if (status === 'Draft') return <span style={{...badgeBase, background: '#f3f4f6', color: '#374151'}}>Draft</span>
    return <span style={{...badgeBase, background: '#fef9c3', color: '#854d0e'}}>{status}</span>
  }

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '100%' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>EPR Workflows & Approvals</h1>
        <p style={{ color: '#666' }}>Review and manage pending Exceptional Price Requests</p>
      </div>

      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={thStyle}>URN (ID)</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
            ) : eprs.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No requests found.</td></tr>
            ) : eprs.map(epr => (
              <tr key={epr.id} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setSelectedEpr(epr)} className="hover-row">
                <td style={tdStyle}>EPR-{epr.id}</td>
                <td style={tdStyle}>{epr.soldto_name || 'N/A'} {epr.shipto_name ? `(${epr.shipto_name})` : ''}</td>
                <td style={tdStyle}>{new Date(epr.created_at).toLocaleString()}</td>
                <td style={tdStyle}>{getStatusBadge(epr.status)}</td>
                <td style={tdStyle}><button style={btnViewStyle}><FileText size={14} /> Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal / Detail View */}
      {selectedEpr && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>EPR-{selectedEpr.id} Details</h2>
              <button onClick={() => setSelectedEpr(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="#666" /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div><strong>Sold-To:</strong> {selectedEpr.soldto_name} ({selectedEpr.soldto_code})</div>
              <div><strong>Ship-To:</strong> {selectedEpr.shipto_name} ({selectedEpr.shipto_code})</div>
              <div><strong>End Customer:</strong> {selectedEpr.end_customer_name || 'N/A'}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedEpr.status)}</div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Requested Line Items</h3>
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={thStyle}>Material</th>
                    <th style={thStyle}>Old ICP</th>
                    <th style={thStyle}>Req. ICP</th>
                    <th style={thStyle}>Old Dist Price</th>
                    <th style={thStyle}>Req. Dist Price</th>
                    <th style={thStyle}>Vol (kg)</th>
                    <th style={thStyle}>Comp. Name</th>
                    <th style={thStyle}>Comp. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEpr.line_items && selectedEpr.line_items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={tdStyle}>{item.material_name}</td>
                      <td style={tdStyle}>{item.existing_icp}</td>
                      <td style={{...tdStyle, fontWeight: 'bold', color: '#1d4ed8'}}>{item.requested_icp}</td>
                      <td style={tdStyle}>{item.existing_dist_price}</td>
                      <td style={{...tdStyle, fontWeight: 'bold', color: '#1d4ed8'}}>{item.requested_dist_price}</td>
                      <td style={tdStyle}>{item.proposed_sale_volume}</td>
                      <td style={tdStyle}>{item.competition_product_name || '-'}</td>
                      <td style={tdStyle}>{item.competition_price || '-'}</td>
                    </tr>
                  ))}
                  {(!selectedEpr.line_items || selectedEpr.line_items.length === 0) && (
                    <tr><td colSpan="8" style={tdStyle}>No line items found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedEpr.additional_remarks && (
               <div style={{ marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Additional Remarks</h3>
                 <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                   {selectedEpr.additional_remarks}
                 </div>
               </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              {renderActionButtons(selectedEpr)}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .hover-row:hover { background-color: #f1f5f9; }
      `}</style>
    </div>
  )
}

const thStyle = { padding: '12px', fontWeight: '600', color: '#475569', fontSize: '12px', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px', fontSize: '14px', color: '#334155' }
const badgeBase = { padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500' }

const btnViewStyle = { background: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }
const btnApproveStyle = { background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }
const btnRejectStyle = { background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }
const btnEscalateStyle = { background: '#ca8a04', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
  display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px'
}
const modalContentStyle = {
  background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '900px',
  maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
}
