import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  LogOut,
  User,
  Settings,
  History,
  GitCompare,
  FileCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FolderOpen
} from 'lucide-react'
import { useState } from 'react'
import { logout, selectUser } from '../store/slices/authSlice'
import clsx from 'clsx'

function Sidebar() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const mainNavItems = [
    { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/projets', label: 'Projets', icon: FolderOpen },
    { path: '/essais', label: 'Essais', icon: FileText },
    { path: '/comparaison', label: 'Comparaison', icon: GitCompare },
    { path: '/historique', label: 'Historique', icon: History },
    { path: '/statistiques', label: 'Statistiques', icon: BarChart3 },
  ]

  const adminNavItems = [
    { path: '/utilisateurs', label: 'Utilisateurs', icon: Users },
    { path: '/templates', label: 'Modèles', icon: FileCheck },
  ]

  const NavItem = ({ item, collapsed }) => {
    const Icon = item.icon
    const active = isActive(item.path)
    
    return (
      <Link
        to={item.path}
        className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
          active
            ? 'bg-gray-900 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        )}
        title={collapsed ? item.label : ''}
      >
        <Icon className={clsx('flex-shrink-0', active ? 'w-5 h-5' : 'w-5 h-5')} />
        {!collapsed && (
          <span className="font-medium text-sm">{item.label}</span>
        )}
      </Link>
    )
  }

  return (
    <div
      className={clsx(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col shadow-sm',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed ? (
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gray-900 rounded-lg p-2">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">GeoLab</h1>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
          </Link>
        ) : (
          <div className="bg-gray-900 rounded-lg p-2 mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title={collapsed ? 'Agrandir' : 'Réduire'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNavItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}

        {/* Séparateur */}
        {user?.role === 'admin' && (
          <>
            <div className="my-4 border-t border-gray-200"></div>
            <div className={clsx('px-4 py-2', collapsed && 'hidden')}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminNavItems.map((item) => (
              <NavItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="bg-gray-900 rounded-full p-2">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-gray-900 rounded-full p-2">
              <User className="w-4 h-4 text-white" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar

