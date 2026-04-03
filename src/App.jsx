import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CompanyList from './pages/admin/CompanyList';
import BranchList from './pages/admin/BranchList';
import WarehouseList from './pages/admin/WarehouseList';
import ZoneList from './pages/admin/ZoneList';
import AisleList from './pages/admin/AisleList';
import RackList from './pages/admin/RackList';
import InventoryList from './pages/admin/InventoryList';
import CategoryList from './pages/admin/CategoryList';
import StockList from './pages/admin/StockList';
import StockMovementList from './pages/admin/StockMovementList';
import Receiving from './pages/admin/Receiving';
import Shipping from './pages/admin/Shipping';
import PickingLists from './pages/admin/PickingLists';


const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-500">Bu alan henüz yapım aşamasındadır. Çok yakında devreye alınacaktır.</p>
    </div>
  </div>
);

export default function App() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'WORKER']} />}>
        <Route element={<AdminLayout />}>
          
          <Route path="dashboard" element={<AdminDashboard />} />
          

          <Route path="companies" element={<CompanyList />} />
          <Route path="branches" element={<BranchList />} />
          

          <Route path="warehouses" element={<WarehouseList />} />
          <Route path="zones" element={<ZoneList />} />
          <Route path="aisles" element={<AisleList />} />
          <Route path="racks" element={<RackList />} />
          

          <Route path="inventory" element={<InventoryList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="stocks" element={<StockList />} />
          <Route path="stock-movements" element={<StockMovementList />} />
          

          <Route path="receiving" element={<Receiving />} />
          <Route path="inbound" element={<Receiving />} />
          <Route path="picking-lists" element={<PickingLists />} />
          <Route path="shipping" element={<Shipping />} />
          

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<Placeholder title="Çalışanlar" />} />
            <Route path="roles" element={<Placeholder title="Roller & Yetkiler" />} />
          </Route>

        </Route>
      </Route>
      

      <Route path="/" element={
        !isAuthenticated ? <Navigate to="/login" replace /> :
        <Navigate to="/admin/dashboard" replace />
      } />
      

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
