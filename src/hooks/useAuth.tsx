import React, { useState, useEffect, useRef } from 'react'
import api from '@/lib/api'
import { AuthContext } from './authContext'
import type { User } from './authContext'

export type { User } from './authContext'
// Only an explicit server-provided boolean grants owner UI access.
function readUser(value: unknown): User {
  if (!value || typeof value !== 'object') throw new Error('Invalid user response')
  const dto = value as Partial<User>
  if (typeof dto.id !== 'string' || typeof dto.name !== 'string' || typeof dto.email !== 'string') {
    throw new Error('Invalid user response')
  }
  return { id: dto.id, name: dto.name, email: dto.email, isAdmin: dto.isAdmin === true }
}
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Every auth transition invalidates older asynchronous responses.
  const revision = useRef(0)
  useEffect(() => {
    const current = ++revision.current
    let active = true
    const isCurrent = () => active && revision.current === current
    const token = localStorage.getItem('token')
    if (!token) setLoading(false)
    else {
      api.get('/auth/profile')
        .then(res => {
          if (isCurrent()) setUser(readUser(res.data))
        })
        .catch(() => {
          if (!isCurrent()) return
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => { if (isCurrent()) setLoading(false) })
    }
    return () => { active = false }
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const current = ++revision.current
    setUser(null)
    localStorage.removeItem('token')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const nextUser = readUser(res.data.user)
      if (typeof res.data.token !== 'string' || !res.data.token) throw new Error('Invalid login response')
      if (revision.current !== current) throw new Error('Login superseded')
      localStorage.setItem('token', res.data.token)
      setUser(nextUser)
      return nextUser
    } finally {
      if (revision.current === current) setLoading(false)
    }
  }
  const logout = () => {
    revision.current++
    localStorage.removeItem('token')
    setUser(null)
    setLoading(false)
  }
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
