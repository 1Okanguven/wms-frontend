import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Warehouse, 
  PackageSearch, 
  ShoppingCart, 
  Users,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard 
  },
  {
    name: 'Firma Yönetimi',
    icon: Building2,
    children: [
      { name: 'Firmalar', href: '/admin/companies' },
      { name: 'Şubeler / Bayiler', href: '/admin/branches' }
    ]
  },
  {
    name: 'Depo & Lokasyon',
    icon: Warehouse,
    children: [
      { name: 'Depolar', href: '/admin/warehouses' },
      { name: 'Depo Bölgeleri', href: '/admin/zones' },
      { name: 'Koridorlar', href: '/admin/aisles' },
      { name: 'Raflar', href: '/admin/racks' }
    ]
  },
  {
    name: 'Envanter & Stok',
    icon: PackageSearch,
    children: [
      { name: 'Kategori Yönetimi', href: '/admin/categories' },
      { name: 'Ürün Kataloğu', href: '/admin/inventory' },
      { name: 'Anlık Stok Durumu', href: '/admin/stocks' },
      { name: 'Stok Hareketleri', href: '/admin/stock-movements' }
    ]
  },
  {
    name: 'Operasyon',
    icon: ShoppingCart,
    children: [
      { name: 'Mal Kabul', href: '/admin/inbound' },
      { name: 'Toplama Listeleri', href: '/admin/picklists' },
      { name: 'Sevkiyat', href: '/admin/outbound' }
    ]
  },
  {
    name: 'Organizasyon',
    icon: Users,
    children: [
      { name: 'Çalışanlar', href: '/admin/users' },
      { name: 'Roller & Yetkiler', href: '/admin/roles' }
    ]
  }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Hangi menülerin açık olduğunu tutan state
  const [openMenus, setOpenMenus] = useState({});

  // Sayfa değiştiğinde, eğer alt (child) bir sayfada isek onun ebeveyn (parent) menüsünü açık tut
  useEffect(() => {
    const newOpenMenus = { ...openMenus };
    let hasChanges = false;
    
    navigation.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => location.pathname.startsWith(child.href));
        if (isChildActive && !openMenus[item.name]) {
          newOpenMenus[item.name] = true;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setOpenMenus(newOpenMenus);
    }
  }, [location.pathname]);

  const toggleMenu = (name) => {
    setOpenMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-900 border-r border-gray-800 transition-all duration-300">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900 border-b border-gray-800">
            <span className="text-white text-xl font-bold tracking-wider">WMS ADMIN</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto wms-scrollbar custom-scrollbar">
            <nav className="flex-1 px-3 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = item.href ? location.pathname.startsWith(item.href) : false;
                const isChildActive = item.children?.some(child => location.pathname.startsWith(child.href));
                const isOpen = openMenus[item.name];

                // Eğer alt menüsü yoksa statik Link renderla
                if (!item.children) {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-400'
                        } mr-3 flex-shrink-0 h-5 w-5 transition-colors`}
                      />
                      {item.name}
                    </Link>
                  );
                }

                // Eğer alt menüsü varsa Dropdown buton renderla
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`${
                        isChildActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      } w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none`}
                    >
                      <div className="flex items-center">
                        <item.icon
                           className={`${
                             isChildActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-400'
                           } mr-3 flex-shrink-0 h-5 w-5 transition-colors`}
                        />
                        {item.name}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="ml-2 h-4 w-4 text-gray-500 transition-transform" />
                      ) : (
                        <ChevronRight className="ml-2 h-4 w-4 text-gray-500 transition-transform" />
                      )}
                    </button>

                    {/* Dropdown contents (Alt linkler) */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="space-y-1 pl-10 pr-2">
                        {item.children.map(child => {
                          const isCurrentChildActive = location.pathname.startsWith(child.href);
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`${
                                isCurrentChildActive
                                  ? 'bg-blue-600/10 text-white border-l-2 border-blue-500 shadow-sm'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-2 border-transparent'
                              } group flex items-center pl-3 pr-2 py-2 text-sm font-medium rounded-r-md transition-all`}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Topbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center sm:px-6 lg:px-8">
            <div className="flex-1"></div>
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-gray-700">{user?.email || 'Admin User'}</span>
                <span className="text-xs text-gray-500">{user?.role || 'Admin Yetkilisi'}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
