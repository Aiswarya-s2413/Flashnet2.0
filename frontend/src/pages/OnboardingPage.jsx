import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import API from '../api'
import { Mail, ShieldCheck } from 'lucide-react'

export default function OnboardingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const idToken = location.state?.token
  const claims = location.state?.claims || {}
  
  const [email1, setEmail1] = useState('')
  const [email2, setEmail2] = useState('')
  const [otp, setOtp] = useState('')
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  if (!idToken) {
    return <p style={{textAlign: 'center', marginTop: 100}}>No authentication token provided. Please return to login.</p>
  }

  const handleRegisterEmails = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)
    
    const emails = [email1.trim(), email2.trim()].filter(Boolean)
    if (emails.length === 0) {
      setAlert({ type: 'error', messages: ['At least one business email is required.'] })
      setLoading(false)
      return
    }

    try {
      const res = await API.post('/onboarding/register-email/', { id_token: idToken, emails })
      setAlert({ type: 'success', messages: [res.data.message] })
      setStep(2)
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to register emails.'
      setAlert({ type: 'error', messages: [msg] })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)
    
    try {
      await API.post('/onboarding/verify-email/', { id_token: idToken, otp })
      // Now registered and verified, push them to pending approval
      navigate('/pending', { state: { token: idToken } })
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to verify OTP.'
      setAlert({ type: 'error', messages: [msg] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 450, width: '100%', padding: '40px 30px' }}>
        <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 8 }}>Welcome, {claims.name}</h2>
        <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>
          {step === 1 ? "Let's set up your distributor account." : "Verify your email to continue."}
        </p>

        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {alert.messages.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegisterEmails}>
            <div className="form-group">
              <label>Primary Business Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--text-dim)' }} />
                <input type="email" value={email1} onChange={e => setEmail1(e.target.value)} required placeholder="your.name@company.com" style={{ flex: 1 }} />
              </div>
              <small style={{ color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>Do not use Gmail, Yahoo, Hotmail, etc.</small>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Secondary Business Email (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--text-dim)' }} />
                <input type="email" value={email2} onChange={e => setEmail2(e.target.value)} placeholder="manager@company.com" style={{ flex: 1 }} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 24, padding: 12, justifyContent: 'center' }}>
              {loading ? 'Sending OTPs...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
             <div className="form-group">
              <label>Enter 6-Digit OTP</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={18} style={{ color: 'var(--text-dim)' }} />
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="e.g. A3F8K9" style={{ flex: 1, letterSpacing: 2 }} maxLength={6} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 24, padding: 12, justifyContent: 'center' }}>
              {loading ? 'Verifying...' : 'Verify Email & Complete Registry'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
