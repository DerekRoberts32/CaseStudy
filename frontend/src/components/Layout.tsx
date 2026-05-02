import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useUser, MOCK_USERS } from '../context/UserContext'
import { RoleBadge } from './Badges'

export default function Layout() {
  const { user, setUserId } = useUser()
  const navigate = useNavigate()

  const navItems = [
    { to: '/signals', label: 'Signals' },
    { to: '/golden', label: 'Golden Library' },
  ]

  const canViewDashboard =
    user?.role === 'manager' ||
    user?.role === 'exec' ||
    user?.role === 'manager_exec'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-accent font-semibold tracking-tight text-sm">
              SIG/
            </span>
            <span className="font-mono text-text-secondary text-sm">PLATFORM</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `font-mono text-xs px-3 py-1.5 rounded transition-colors duration-150 ${
                    isActive
                      ? 'text-accent bg-accent-dim'
                      : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {canViewDashboard && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `font-mono text-xs px-3 py-1.5 rounded transition-colors duration-150 ${
                    isActive
                      ? 'text-accent bg-accent-dim'
                      : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                Dashboard
              </NavLink>
            )}
          </nav>

          <div className="flex-1" />

          {/* Role switcher */}
          <div className="flex items-center gap-3">
            {user && <RoleBadge role={user.role} />}
            <select
              className="bg-muted border border-border rounded px-2 py-1 text-xs font-mono
                         text-text-secondary focus:outline-none focus:border-accent/50
                         transition-colors max-w-[220px]"
              value={user?.id ?? ''}
              onChange={e => {
                setUserId(e.target.value)
                navigate('/signals')
              }}
            >
              {MOCK_USERS.map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
