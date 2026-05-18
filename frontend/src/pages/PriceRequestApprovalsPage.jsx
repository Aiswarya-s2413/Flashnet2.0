import React, { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, ArrowRight, X } from 'lucide-react'
import API from '../api'

export default function PriceRequestApprovalsPage() {
  const [eprs, setEprs] = useState([])
  const [selectedEpr, setSelectedEpr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEPRs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await API.get('/epr/')
      setEprs(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (err) {
      // Don't show error for empty responses or 404s — just show empty table
      if (err.response && (err.response.status === 404 || err.response.status === 204)) {
        setEprs([])
      } else {
        setError("Failed to fetch EPRs: " + (err.response?.data?.detail || err.message))
      }
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEPRs()
  }, [])

  const updateStatus = async (eprId, newStatus) => {
    try {
      const response = await API.patch(`/epr/${eprId}/`, { status: newStatus })

      if (response.status === 200 || response.status === 204) {
        setSelectedEpr(null)
        fetchEPRs()
      } else {
        alert("Failed to update status")
      }
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.error || err.message))
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <div><strong>Legacy Org:</strong> {selectedEpr.legacy_organization || 'N/A'}</div>
              <div><strong>Sold-To:</strong> {selectedEpr.soldto_name} ({selectedEpr.soldto_code})</div>
              <div><strong>Ship-To:</strong> {selectedEpr.shipto_name} ({selectedEpr.shipto_code})</div>
              <div><strong>End Customer:</strong> {selectedEpr.end_customer_name || 'N/A'}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedEpr.status)}</div>
              <div><strong>Submitted On:</strong> {new Date(selectedEpr.created_at).toLocaleString()}</div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Requested Line Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {selectedEpr.line_items && selectedEpr.line_items.map((item, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#f8fafc', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#475569' }}>{i + 1}</div>
                    {item.material_name || 'Unnamed Product'}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '14px' }}>
                    <div><span style={detailLabelStyle}>Business Proposal</span><div style={detailValueStyle}>{item.business_proposal || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Request Type</span><div style={detailValueStyle}>{item.price_request_type || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Used in Package</span><div style={detailValueStyle}>{item.product_used_in_package || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Package Details</span><div style={detailValueStyle}>{item.other_products_details || '-'}</div></div>

                    <div><span style={detailLabelStyle}>Old ICP</span><div style={detailValueStyle}>{item.existing_icp || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Req. ICP</span><div style={{...detailValueStyle, fontWeight: '700', color: '#1d4ed8'}}>{item.requested_icp || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Old Dist Price</span><div style={detailValueStyle}>{item.existing_dist_price || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Req. Dist Price</span><div style={{...detailValueStyle, fontWeight: '700', color: '#1d4ed8'}}>{item.requested_dist_price || '-'}</div></div>

                    <div><span style={detailLabelStyle}>Old Vol (kg)</span><div style={detailValueStyle}>{item.existing_sale_volume || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Proposed Vol (kg)</span><div style={detailValueStyle}>{item.proposed_sale_volume || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Freight Charges</span><div style={detailValueStyle}>{item.freight_charges || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Remarks</span><div style={detailValueStyle}>{item.remarks || '-'}</div></div>

                    <div><span style={detailLabelStyle}>Dist Payment Terms</span><div style={detailValueStyle}>{item.distributor_payment_terms || '-'}</div></div>
                    <div><span style={detailLabelStyle}>End Cust Payment Terms</span><div style={detailValueStyle}>{item.end_customer_payment_terms || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Comp. Name</span><div style={detailValueStyle}>{item.competition_product_name || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Comp. Price / Vol</span><div style={detailValueStyle}>{item.competition_price ? `${item.competition_price} INR/kg` : '-'} {item.competition_volume ? `(${item.competition_volume} YTD)` : ''}</div></div>
                  </div>
                </div>
              ))}
              {(!selectedEpr.line_items || selectedEpr.line_items.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>No line items found.</div>
              )}
            </div>

            {selectedEpr.additional_remarks && (
               <div style={{ marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Final Approval Remarks</h3>
                 <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#4b5563' }}>
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

const detailLabelStyle = { display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }
const detailValueStyle = { fontSize: '14px', color: '#0f172a', fontWeight: '500' }

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
