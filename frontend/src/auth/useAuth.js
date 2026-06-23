import { useState } from 'react'

// Simple store for holding JWT after login
const useAuthStore = () => {
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_profile')) || null)

  const login = (jwt, profile) => {
    localStorage.setItem('jwt_token', jwt)
    localStorage.setItem('user_profile', JSON.stringify(profile))
    setToken(jwt)
    setUser(profile)
  }

  const logout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_profile')
    setToken(null)
    setUser(null)
  }

  return { token, user, login, logout }
}

export default useAuthStore
