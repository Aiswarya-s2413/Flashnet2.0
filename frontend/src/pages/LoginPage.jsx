import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../auth/msalConfig'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import useAuthStore from '../auth/useAuth'

export default function LoginPage() {
  const { instance } = useMsal()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Popup Entra ID login
      const loginResponse = await instance.loginPopup(loginRequest)
      const idToken = loginResponse.idToken

      // 2. Send token to our generic Backend callback
      const res = await API.post('/auth/entra-callback/', { id_token: idToken })
      
      const { status, data, message } = res.data

      // 3. Routing logic precisely specified in instructions
      if (status === 'onboarding_required') {
        // user not found locally, route to email signup
        navigate('/onboarding', { state: { token: idToken, claims: data } })
      } else if (status === 'pending_approval') {
        // onboarding request exists but not fully approved
        navigate('/pending', { state: { token: idToken } })
      } else if (status === 'authenticated') {
        // success! Cache JWT perfectly using the state engine
        const { login } = useAuthStore()
        login(data.access, { upn: data.upn, name: data.name })
        navigate('/')
      }

    } catch (e) {
      console.error(e)
      setError("Login process failed or was interrupted. Check console logs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 40 }}>
        <h1 className="page-title" style={{ marginBottom: 12 }}>Distributor Portal</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>Sign in sequentially with your Archroma credentials</p>

        {error && (
           <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign in with Microsoft'}
        </button>
      </div>
    </div>
  )
}
