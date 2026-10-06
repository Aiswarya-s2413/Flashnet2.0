import { useState, useEffect } from 'react'
import API from '../api'
import { Check, HelpCircle, Users, Clipboard, MapPin, Building, Key, RotateCcw } from 'lucide-react'

export default function OnboardingApprovalsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'sent_back', 'approved'
  
  // Action state
  const [activeRequest, setActiveRequest] = useState(null)
  const [actionType, setActionType] = useState('') // 'approve', 'send_back', 'clarification'
  const [approverRole, setApproverRole] = useState('sales') // 'sales', 'csd', 'it_admin'
  const [finalApproval, setFinalApproval] = useState(false)
  const [distributorCode, setDistributorCode] = useState('')
  const [legalEntity, setLegalEntity] = useState('')
  const [territory, setTerritory] = useState('')
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.get('/onboarding/requests/')
      if (res.data.status === 'success') {
        setRequests(res.data.data)
      } else {
        setError(res.data.message || 'Failed to fetch onboarding requests.')
      }
    } catch (err) {
      console.error(err)
      setError('Error loading onboarding requests from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const openActionModal = (req, type) => {
    setActiveRequest(req)
    const effectiveType = (type === 'reject' || type === 'rejected') ? 'send_back' : type
    setActionType(effectiveType)
    setComment('')
    setDistributorCode(req.distributor_code || '')
    setLegalEntity(req.legal_entity || '')
    setTerritory(req.territory || '')
    
    // Auto-infer approver role based on request current status
    if (req.status === 'pending') {
      setApproverRole('sales')
    } else if (req.status === 'sales_approved') {
      setApproverRole('csd')
    } else {
      setApproverRole('it_admin')
    }
    setFinalApproval(false)
  }

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    if (!activeRequest) return
    
    setActionLoading(true)
    setMessage(null)
    try {
      const effectiveAction = (actionType === 'reject' || actionType === 'rejected') ? 'send_back' : actionType
      const payload = {
        action: effectiveAction,
        approver_role: approverRole,
        comment,
        distributor_code,
        legal_entity,
        territory,
        final_approval: finalApproval
      }
      
      const res = await API.post(`/onboarding/requests/${activeRequest.id}/action/`, payload)
      if (res.data.status === 'success') {
        setMessage({ type: 'success', text: res.data.message })
        fetchRequests()
        setActiveRequest(null)
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Failed to submit action.' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error executing action.' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 0' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Onboarding Approvals</h1>
          <p className="page-subtitle">Verify distributor profiles, assign codes, and authorize access levels sequentially.</p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: 24 }}>
          <div className="alert-title">{message.type === 'success' ? 'Success' : 'Error'}</div>
          <div>{message.text}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Retrieving onboarding requests...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <div className="alert-title">Failed to load requests</div>
          <p>{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>
          <Users size={48} style={{ marginBottom: 16, strokeWidth: 1.5, opacity: 0.5 }} />
          <h3>No Onboarding Requests Found</h3>
          <p style={{ marginTop: 8, fontSize: 13 }}>All distributor registration queues are currently empty.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: 12.5 }}
              onClick={() => setFilter('all')}
            >
              All Requests ({requests.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: 12.5 }}
              onClick={() => setFilter('pending')}
            >
              Pending ({requests.filter(r => r.status === 'pending' || r.status === 'sales_approved' || r.status === 'csd_approved' || r.status === 'clarification').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'sent_back' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '6px 14px', 
                fontSize: 12.5,
                backgroundColor: filter === 'sent_back' ? 'var(--amber)' : undefined,
                borderColor: filter === 'sent_back' ? 'var(--amber)' : undefined,
                color: filter === 'sent_back' ? '#fff' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              onClick={() => setFilter('sent_back')}
            >
              <RotateCcw size={13} />
              Sent Back to Distributor ({requests.filter(r => r.status === 'sent_back' || r.status === 'send_back' || r.status === 'rejected' || r.status === 'reject').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: 12.5 }}
              onClick={() => setFilter('approved')}
            >
              Approved ({requests.filter(r => r.status === 'approved').length})
            </button>
          </div>

          {/* Requests List */}
          {requests
            .filter(r => {
              if (filter === 'sent_back') return r.status === 'sent_back' || r.status === 'send_back' || r.status === 'rejected' || r.status === 'reject'
              if (filter === 'pending') return r.status === 'pending' || r.status === 'sales_approved' || r.status === 'csd_approved' || r.status === 'clarification'
              if (filter === 'approved') return r.status === 'approved'
              return true
            })
            .map((req) => {
              const isSentBack = req.status === 'sent_back' || req.status === 'send_back' || req.status === 'rejected' || req.status === 'reject'

              return (
                <div key={req.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Header Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, color: 'var(--text)' }}>
                        {req.user.display_name}
                        <span className={`badge ${
                          req.status === 'approved' ? 'badge-green' : 
                          isSentBack ? 'badge-amber' : 
                          req.status === 'clarification' ? 'badge-amber' : 'badge-accent'
                        }`}>
                          {isSentBack ? 'Sent Back to Distributor' : req.status.replace('_', ' ')}
                        </span>
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>UPN: <strong>{req.user.upn}</strong> | Requested: {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    {req.status !== 'approved' && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => openActionModal(req, 'clarification')}>
                          <HelpCircle size={14} /> Need Clarification
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 16px', fontSize: 12, backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: 6 }} 
                          onClick={() => openActionModal(req, 'send_back')}
                        >
                          <RotateCcw size={14} /> Send Back to Distributor
                        </button>
                        <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => openActionModal(req, 'approve')}>
                          <Check size={14} /> Approve / Progress
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sent Back Banner if applicable */}
                  {isSentBack && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <RotateCcw size={16} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#92400e', fontSize: 13, display: 'block' }}>Sent Back to Distributor</strong>
                        <div style={{ fontSize: 12.5, color: '#78350f', marginTop: 2 }}>
                          {req.notes || (req.logs?.slice().reverse().find(l => l.action === 'sent_back' || l.action === 'send_back' || l.action === 'rejected' || l.action === 'reject')?.comment) || 'This onboarding request was sent back to the distributor for updates or clarifications.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, background: '#fafbfc', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Key size={18} style={{ color: 'var(--text-dim)' }} />
                      <div>
                        <small style={{ display: 'block', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Distributor Code</small>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{req.distributor_code || 'Not Assigned'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Building size={18} style={{ color: 'var(--text-dim)' }} />
                      <div>
                        <small style={{ display: 'block', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Legal Entity</small>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{req.legal_entity || 'Not Verified'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <MapPin size={18} style={{ color: 'var(--text-dim)' }} />
                      <div>
                        <small style={{ display: 'block', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Territory / Region</small>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{req.territory || 'Not Specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Emails */}
                  <div>
                    <h5 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Verified Corporate Communications Emails:</h5>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {req.verified_emails.length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--red)', fontStyle: 'italic' }}>No verified emails yet</span>
                      ) : (
                        req.verified_emails.map((e, idx) => (
                          <span key={idx} className="badge badge-accent" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}>
                            {e}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Logs / Audit Trail */}
                  {req.logs && req.logs.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <h5 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clipboard size={14} /> Onboarding Approval Logs & Audit Trail
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {req.logs.map((log, lIdx) => {
                          const isLogSentBack = log.action === 'sent_back' || log.action === 'send_back' || log.action === 'rejected' || log.action === 'reject'
                          return (
                            <div key={lIdx} style={{ fontSize: 12, display: 'flex', gap: 12, background: 'rgba(0,0,0,0.01)', padding: 10, borderRadius: 8, border: '1px solid #f1f5f9' }}>
                              <div style={{ fontWeight: 700, minWidth: 100, textTransform: 'capitalize', color: 'var(--primary)' }}>
                                {log.approver_role.replace('_', ' ')}
                              </div>
                              <div style={{ flex: 1 }}>
                                <span className={`badge ${log.action === 'approved' ? 'badge-green' : isLogSentBack ? 'badge-amber' : 'badge-amber'}`} style={{ padding: '1px 6px', fontSize: 9, marginRight: 8 }}>
                                  {isLogSentBack ? 'Sent Back to Distributor' : log.action}
                                </span>
                                <span style={{ color: 'var(--text)' }}>{log.comment || 'No comment provided.'}</span>
                                <span style={{ display: 'block', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                                  By {log.approver_upn} on {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* Action Dialog / Modal */}
      {activeRequest && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <h3 className="modal-title" style={{ textTransform: 'capitalize' }}>
              {(actionType === 'send_back' || actionType === 'reject' || actionType === 'rejected') ? 'Send Back to Distributor' : `${actionType} Onboarding Request`}
            </h3>
            
            <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Approver Role (Simulation)</label>
                <select value={approverRole} onChange={(e) => setApproverRole(e.target.value)}>
                  <option value="sales">Sales Executive</option>
                  <option value="csd">CSD (Customer Service Dept)</option>
                  <option value="it_admin">IT Admin (Final Approver)</option>
                </select>
              </div>

              {approverRole === 'csd' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--accent-soft)', borderRadius: 8 }}>
                  <input type="checkbox" id="finalCSD" checked={finalApproval} onChange={(e) => setFinalApproval(e.target.checked)} style={{ width: 'auto', boxShadow: 'none' }} />
                  <label htmlFor="finalCSD" style={{ textTransform: 'none', fontSize: 12, cursor: 'pointer' }}>Mark CSD approval as the final step (Skip IT Admin)</label>
                </div>
              )}

              {actionType === 'approve' && (
                <>
                  <div className="form-group">
                    <label>Assign Distributor Code</label>
                    <input type="text" value={distributorCode} onChange={(e) => setDistributorCode(e.target.value.toUpperCase())} placeholder="e.g. DIST_0987" required />
                  </div>
                  <div className="form-group">
                    <label>Verify Legal Entity</label>
                    <input type="text" value={legalEntity} onChange={(e) => setLegalEntity(e.target.value)} placeholder="e.g. Vikram Trading Corp Ltd" required />
                  </div>
                  <div className="form-group">
                    <label>Add Territory / Region</label>
                    <input type="text" value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="e.g. Mumbai Suburbs" required />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>
                  {(actionType === 'send_back' || actionType === 'reject' || actionType === 'rejected') ? 'Reason for Sending Back (Visible to Distributor)' : 'Approver Comments / Notes'}
                </label>
                <textarea 
                  rows="3" 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder={(actionType === 'send_back' || actionType === 'reject' || actionType === 'rejected') ? 'Explain what information or corrections the distributor needs to provide...' : 'Provide context, observations, or instructions...'} 
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveRequest(null)} disabled={actionLoading}>Cancel</button>
                <button 
                  type="submit" 
                  className={(actionType === 'send_back' || actionType === 'reject' || actionType === 'rejected') ? 'btn btn-secondary' : 'btn btn-primary'} 
                  style={(actionType === 'send_back' || actionType === 'reject' || actionType === 'rejected') ? { backgroundColor: 'var(--amber)', borderColor: 'var(--amber)', color: '#fff' } : {}}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Executing...' : (actionType === 'send_back' || actionType === 'reject' || actionType === 'rejected') ? 'Send Back to Distributor' : 'Submit Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
