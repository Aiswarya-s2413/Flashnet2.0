import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import ProductsPage from './pages/ProductsPage'
import InvoicesPage from './pages/InvoicesPage'
import OrdersPage from './pages/OrdersPage'
import DashboardPage from './pages/DashboardPage'
import UploadOrdersPage from './pages/UploadOrdersPage'
import UploadStockPage from './pages/UploadStockPage'
import UploadMonthlySalesPage from './pages/UploadMonthlySalesPage'
import { Package, FileText, ShoppingCart, LayoutDashboard, UploadCloud, Activity, Map } from 'lucide-react'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <ShoppingCart size={24} />
            <span>Sales Manager</span>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <ShoppingCart size={18} />
              Orders
            </NavLink>
            <NavLink to="/upload-orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <UploadCloud size={18} />
              Upload Orders
            </NavLink>
            <NavLink to="/upload-stock" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Activity size={18} />
              Upload Stock Report
            </NavLink>
            <NavLink to="/upload-monthly-sales" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Map size={18} />
              Monthly Sales
            </NavLink>
            <NavLink to="/invoices" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FileText size={18} />
              Distributor Invoices
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Package size={18} />
              Product Master
            </NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/upload-orders" element={<UploadOrdersPage />} />
            <Route path="/upload-stock" element={<UploadStockPage />} />
            <Route path="/upload-monthly-sales" element={<UploadMonthlySalesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/products" element={<ProductsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
