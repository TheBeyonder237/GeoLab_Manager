import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  FlaskConical,
  LineChart,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  Folder,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logout } from '../../store/slices/authSlice';
import NotificationsCenter from '../notifications/NotificationsCenter';

const navigation = [
  {
    name: 'Tableau de bord',
    path: '/dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Projets',
    path: '/dashboard/projets',
    icon: Folder,
    badge: null
  },
  {
    name: 'Essais',
    path: '/dashboard/essais',
    icon: FlaskConical,
    badge: null
  },
  {
    name: 'Analyses',
    path: '/dashboard/analyses',
    icon: LineChart,
    children: [
      { name: 'Statistiques', path: '/dashboard/statistiques' },
      { name: 'Comparaison', path: '/dashboard/comparaison' },
      { name: 'Historique', path: '/dashboard/historique' }
    ]
  },
  {
    name: 'Qualité',
    path: '/dashboard/qualite',
    icon: Shield,
    children: [
      { name: 'Contrôles', path: '/dashboard/qualite/controles' },
      { name: 'Calibrations', path: '/dashboard/qualite/calibrations' },
      { name: 'Non-conformités', path: '/dashboard/qualite/non-conformites' }
    ]
  },
  {
    name: 'Utilisateurs',
    path: '/dashboard/utilisateurs',
    icon: Users,
    badge: null,
    adminOnly: true
  }
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector((state) => state.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleMenu = (name) => {
    setOpenMenus(prev => 
      prev.includes(name) 
        ? prev.filter(m => m !== name)
        : [...prev, name]
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">GeoLab</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            
            const isActive = item.children
              ? item.children.some(child => location.pathname === child.path)
              : location.pathname === item.path;
            
            const isOpen = openMenus.includes(item.name);

            return (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-1 ml-4 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`block px-3 py-2 text-sm font-medium rounded-md ${
                              location.pathname === child.path
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenus(prev => 
                  prev.includes('user') ? prev.filter(m => m !== 'user') : [...prev, 'user']
                )}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {openMenus.includes('user') && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border">
                  <div className="py-1">
                    <Link
                      to="/dashboard/parametres"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Paramètres
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Notifications panel */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setNotificationsOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-96 bg-white shadow-xl">
            <NotificationsCenter onClose={() => setNotificationsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
