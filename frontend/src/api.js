import axios from 'axios'

const API = axios.create({
  baseURL: 'https://virtually-neighborhood-markets-absolute.trycloudflare.com/api',
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
