import { createContext } from 'react'

export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
