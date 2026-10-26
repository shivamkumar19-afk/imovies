import axios from 'axios'

export const TOKEN_KEY = 'imovies_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the server says our token is bad, tell AuthContext to log out.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new Event('imovies:unauthorized'))
    }
    return Promise.reject(err)
  }
)

// Pull a human-readable message out of any axios error.
export function errorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running on port 5000?'
  return err.message || 'Something went wrong'
}

export default api
