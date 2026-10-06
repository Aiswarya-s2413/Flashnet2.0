import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import API from '../api'

export default function PendingApprovalPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const idToken = location.state?.token
  
  const [status, setStatus] = useState('pending')
  const [reviewerComment, setReviewerComment] = useState('')

  useEffect(() => {
    if (!idToken) return;

    // Check status once on mount
    API.post('/onboarding/status/', { id_token: idToken })
      .then(res => {
        setStatus(res.data.data.status)
        setReviewerComment(res.data.data.comment || res.data.data.notes || '')
        if (res.data.data.status === 'approved') {
          // Send them back to login to natively get their JWT
          navigate('/login')
        }
      })
      .catch(console.error)
  }, [idToken, navigate])

  if (!idToken) {
    return <p style={{textAlign: 'center', marginTop: 100}}>No authentication context. Please log in.</p>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: '40px', textAlign: 'center' }}>
        <h2 className="page-title" style={{ marginBottom: 16 }}>Pending Approval</h2>
        
        {status === 'pending' && (
          <p className="page-subtitle">
            Your distributor registration request has been submitted successfully to the Archroma Customer Service Department (CSD) queue. <br/><br/>
            You typically receive approval routing through Sales and IT within 1-2 business days.
          </p>
        )}

        {status === 'sales_approved' && (
          <p className="page-subtitle" style={{ color: 'var(--primary)' }}>
            Your registration has been approved by your Archroma Sales Representative. <br/><br/>
            It is currently pending review by the Customer Service Department (CSD).
          </p>
        )}

        {status === 'csd_approved' && (
          <p className="page-subtitle" style={{ color: 'var(--primary)' }}>
            Your registration has been approved by the Customer Service Department (CSD). <br/><br/>
            It is currently undergoing final IT Admin authentication setup.
          </p>
        )}

        {status === 'clarification' && (
           <div className="alert alert-warning" style={{ textAlign: 'left' }}>
             <strong>Clarification Requested.</strong> The approvers have requested further details about your legal entity or business scope. Please contact your Archroma Sales Representative.
             {reviewerComment && (
               <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: 6, fontSize: '13px' }}>
                 <strong>Approver Note:</strong> {reviewerComment}
               </div>
             )}
           </div>
        )}
        
        {(status === 'sent_back' || status === 'send_back' || status === 'rejected') && (
           <div className="alert alert-warning" style={{ textAlign: 'left', borderLeft: '4px solid var(--amber)' }}>
             <strong style={{ display: 'block', fontSize: '15px', color: '#92400e', marginBottom: '6px' }}>
               Request Sent Back to Distributor
             </strong>
             <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#78350f' }}>
               Your registration request has been sent back by the reviewer for updates or corrections.
             </p>
             {reviewerComment && (
               <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
                 <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#92400e', display: 'block', marginBottom: '4px' }}>Reviewer Comments:</strong>
                 <div style={{ fontSize: '13px', color: '#1e293b' }}>{reviewerComment}</div>
               </div>
             )}
             <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
               Please contact your Archroma Sales Representative or update your registration details.
             </p>
           </div>
        )}

        <button className="btn btn-outline" style={{ marginTop: 32, padding: 10, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
          Return to Sign in
        </button>
      </div>
    </div>
  )
}
