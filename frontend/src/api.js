import axios from 'axios'

const getBaseURL = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim()
  if (!envUrl || envUrl.includes('trycloudflare.com') || (typeof window !== 'undefined' && envUrl.includes('localhost') && window.location.hostname !== 'localhost')) {
    return '/api'
  }
  return envUrl
}

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 900000, // 15-minute global timeout to handle large bulk data operations
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt_token')
      if (error.config && !error.config._retry) {
        error.config._retry = true
        delete error.config.headers.Authorization
        return API(error.config)
      }
    }
    return Promise.reject(error)
  }
)

export default API
