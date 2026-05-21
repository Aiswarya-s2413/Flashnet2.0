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
      if (err.response && (err.response.status === 404 || err.response.status === 204)) {
        setEprs([])
      } else {
        setError("Failed to fetch EPRs: " + (err.response?.data?.detail || err.message))
      }
      setLoading(false)
    }
  }

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
          <button onClick={() => updateStatus(epr.id, 'Pending Pricing & BD Teams')} className="btn btn-primary">
            <ArrowRight size={16} /> Forward to Pricing & BD
          </button>
          <button onClick={() => updateStatus(epr.id, 'Rejected')} className="btn btn-danger">
            <XCircle size={16} /> Reject
          </button>
        </>
      )
    }
    
    if (epr.status === 'Pending Pricing & BD Teams') {
      return (
        <>
          <button onClick={() => updateStatus(epr.id, 'Approved')} className="btn btn-success">
            <CheckCircle size={16} /> Approve
          </button>
          <button onClick={() => updateStatus(epr.id, 'Pending Sales Director')} className="btn btn-primary" style={{ backgroundColor: 'var(--amber)', borderColor: 'var(--amber)', color: '#fff' }}>
            <ArrowRight size={16} /> Escalate to Sales Director
          </button>
          <button onClick={() => updateStatus(epr.id, 'Rejected')} className="btn btn-danger">
            <XCircle size={16} /> Reject
          </button>
        </>
      )
    }
    
    if (epr.status === 'Pending Sales Director') {
      return (
        <>
          <button onClick={() => updateStatus(epr.id, 'Approved')} className="btn btn-success">
            <CheckCircle size={16} /> Director Approve
          </button>
          <button onClick={() => updateStatus(epr.id, 'Rejected')} className="btn btn-danger">
            <XCircle size={16} /> Reject
          </button>
        </>
      )
    }

    return (
      <span style={{ fontWeight: '800', color: epr.status === 'Approved' ? 'var(--green)' : 'var(--red)' }}>
        Status: {epr.status}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="badge badge-green">Approved</span>
    if (status === 'Rejected') return <span className="badge badge-red">Rejected</span>
    if (status === 'Draft') return <span className="badge badge-accent">Draft</span>
    return <span className="badge badge-accent" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>{status}</span>
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">EPR Workflows & Approvals</h1>
          <p className="page-subtitle">Review and manage pending Exceptional Price Requests</p>
        </div>
      </div>

      {error && <div className="alert alert-error"><span className="alert-title">Error</span>{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>URN (ID)</th>
              <th>Customer</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>Loading...</td></tr>
            ) : eprs.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>No requests found.</td></tr>
            ) : eprs.map(epr => (
              <tr key={epr.id} onClick={() => setSelectedEpr(epr)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 700 }}>EPR-{epr.id}</td>
                <td>{epr.soldto_name || 'N/A'} {epr.shipto_name ? `(${epr.shipto_name})` : ''}</td>
                <td>{new Date(epr.created_at).toLocaleString()}</td>
                <td>{getStatusBadge(epr.status)}</td>
                <td>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <FileText size={14} /> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detail View */}
      {selectedEpr && (
        <div className="modal-overlay" onClick={() => setSelectedEpr(null)}>
          <div className="modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>EPR-{selectedEpr.id} Details</h2>
              <button className="btn btn-outline" style={{ padding: '6px 8px', borderRadius: '50%' }} onClick={() => setSelectedEpr(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <div><span style={detailLabelStyle}>Legacy Org</span><div style={detailValueStyle}>{selectedEpr.legacy_organization || 'N/A'}</div></div>
              <div><span style={detailLabelStyle}>Sold-To Details</span><div style={detailValueStyle}>{selectedEpr.soldto_name} ({selectedEpr.soldto_code})</div></div>
              <div><span style={detailLabelStyle}>Ship-To Details</span><div style={detailValueStyle}>{selectedEpr.shipto_name} ({selectedEpr.shipto_code})</div></div>
              <div><span style={detailLabelStyle}>End Customer</span><div style={detailValueStyle}>{selectedEpr.end_customer_name || 'N/A'}</div></div>
              <div><span style={detailLabelStyle}>Status</span><div>{getStatusBadge(selectedEpr.status)}</div></div>
              <div><span style={detailLabelStyle}>Submitted On</span><div style={detailValueStyle}>{new Date(selectedEpr.created_at).toLocaleString()}</div></div>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>Requested Line Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
              {selectedEpr.line_items && selectedEpr.line_items.map((item, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: 'var(--bg)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--surface)', fontWeight: '700' }}>{i + 1}</div>
                    {item.material_name || 'Unnamed Product'}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <div><span style={detailLabelStyle}>Proposal</span><div style={detailValueStyle}>{item.business_proposal || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Req Type</span><div style={detailValueStyle}>{item.price_request_type || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Used in Pkg</span><div style={detailValueStyle}>{item.product_used_in_package || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Pkg Details</span><div style={detailValueStyle}>{item.other_products_details || '-'}</div></div>

                    <div><span style={detailLabelStyle}>Old ICP</span><div style={detailValueStyle}>{item.existing_icp || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Req. ICP</span><div style={{...detailValueStyle, fontWeight: '800', color: 'var(--primary)'}}>{item.requested_icp || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Old Dist Price</span><div style={detailValueStyle}>{item.existing_dist_price || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Req. Dist Price</span><div style={{...detailValueStyle, fontWeight: '800', color: 'var(--primary)'}}>{item.requested_dist_price || '-'}</div></div>

                    <div><span style={detailLabelStyle}>Old Vol</span><div style={detailValueStyle}>{item.existing_sale_volume || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Proposed Vol</span><div style={detailValueStyle}>{item.proposed_sale_volume || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Freight</span><div style={detailValueStyle}>{item.freight_charges || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Remarks</span><div style={detailValueStyle}>{item.remarks || '-'}</div></div>

                    <div><span style={detailLabelStyle}>Dist Terms</span><div style={detailValueStyle}>{item.distributor_payment_terms || '-'}</div></div>
                    <div><span style={detailLabelStyle}>End Cust Terms</span><div style={detailValueStyle}>{item.end_customer_payment_terms || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Comp. Name</span><div style={detailValueStyle}>{item.competition_product_name || '-'}</div></div>
                    <div><span style={detailLabelStyle}>Comp. Price/Vol</span><div style={detailValueStyle}>{item.competition_price ? `${item.competition_price} INR` : '-'} {item.competition_volume ? `(${item.competition_volume} YTD)` : ''}</div></div>
                  </div>
                </div>
              ))}
              {(!selectedEpr.line_items || selectedEpr.line_items.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>No line items found.</div>
              )}
            </div>

            {selectedEpr.additional_remarks && (
               <div style={{ marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>Final Approval Remarks</h3>
                 <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                   {selectedEpr.additional_remarks}
                 </div>
               </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {renderActionButtons(selectedEpr)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const detailLabelStyle = { display: 'block', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }
const detailValueStyle = { fontSize: '13px', color: 'var(--text)', fontWeight: '600' }
