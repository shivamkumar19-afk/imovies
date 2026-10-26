import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { TOKEN_KEY } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY))

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  // On first load, if we have a token, ask the server who we are.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [logout])

  useEffect(() => {
    window.addEventListener('imovies:unauthorized', logout)
    return () => window.removeEventListener('imovies:unauthorized', logout)
  }, [logout])

  const saveSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(user)
    return user
  }

  const login = async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data)
  const register = async (name, email, password) =>
    saveSession((await api.post('/auth/register', { name, email, password })).data)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
