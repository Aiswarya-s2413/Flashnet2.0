import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import API from '../api'

export default function PendingApprovalPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const idToken = location.state?.token
  
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    if (!idToken) return;

    // Check status once on mount
    API.post('/onboarding/status/', { id_token: idToken })
      .then(res => {
        setStatus(res.data.data.status)
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
           </div>
        )}
        
        {status === 'rejected' && (
           <div className="alert alert-error" style={{ textAlign: 'left' }}>
             <strong>Request Rejected.</strong> Your registration was denied by the administrator. Please contact your Archroma Sales Representative.
           </div>
        )}

        <button className="btn btn-outline" style={{ marginTop: 32, padding: 10, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
          Return to Sign in
        </button>
      </div>
    </div>
  )
}
