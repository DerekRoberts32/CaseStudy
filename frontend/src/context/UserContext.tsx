import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { getMe } from '../api'

// All available mock users for the role switcher
export const MOCK_USERS = [
  { id: 'user-r1', label: 'Alice Chen (Researcher, Team Alpha)' },
  { id: 'user-r2', label: 'Bob Patel (Researcher, Team Alpha)' },
  { id: 'user-r3', label: 'Carol Smith (Researcher, Team Beta)' },
  { id: 'user-r4', label: 'Dan Lee (Researcher, Team Beta)' },
  { id: 'user-m1', label: 'Eva Martinez (Researcher, Team Alpha)' },
  { id: 'user-m2', label: 'Frank Wong (Manager, Team Beta)' },
  { id: 'user-e1', label: 'Grace Kim (Manager + Exec, Team Alpha)' },
  { id: 'user-e2', label: 'Henry Ford (Exec only)' },
]

interface UserContextType {
  user: User | null
  userId: string
  setUserId: (id: string) => void
  loading: boolean
  isExec: boolean
  isManager: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  userId: 'user-r1',
  setUserId: () => {},
  loading: true,
  isExec: false,
  isManager: false,
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string>(
    () => localStorage.getItem('userId') ?? 'user-r1'
  )
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const setUserId = (id: string) => {
    localStorage.setItem('userId', id)
    setUserIdState(id)
  }

  useEffect(() => {
    setLoading(true)
    getMe()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [userId])

  const isExec = user?.role === 'exec' || user?.role === 'manager_exec'
  const isManager = user?.role === 'manager' || user?.role === 'manager_exec'

  return (
    <UserContext.Provider value={{ user, userId, setUserId, loading, isExec, isManager }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
