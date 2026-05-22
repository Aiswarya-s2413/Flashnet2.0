import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import ProductsPage from './pages/ProductsPage'
import InvoicesPage from './pages/InvoicesPage'
import OrdersPage from './pages/OrdersPage'
import DashboardPage from './pages/DashboardPage'
import UploadOrdersPage from './pages/UploadOrdersPage'
import UploadStockPage from './pages/UploadStockPage'
import UploadMonthlySalesPage from './pages/UploadMonthlySalesPage'
import UploadPrimarySalesPage from './pages/UploadPrimarySalesPage'
import UploadCSISalesPage from './pages/UploadCSISalesPage'
import ExceptionalPriceRequestPage from './pages/ExceptionalPriceRequestPage'
import PriceRequestApprovalsPage from './pages/PriceRequestApprovalsPage'
import { Package, FileText, ShoppingCart, LayoutDashboard, UploadCloud, Activity, Map, Edit3, CheckCircle, Search, Bell } from 'lucide-react'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="FlashNet 2.0" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)', lineHeight: '1.2' }}>FlashNet 2.0</span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginTop: '2px' }}>Archroma Network</span>
            </div>
          </div>
          <div className="sidebar-content">
            <div className="sidebar-group">
              <div className="sidebar-group-title">Core</div>
              <nav className="sidebar-nav">
                <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </NavLink>
                <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <ShoppingCart size={18} />
                  Orders
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
            </div>

            <div className="sidebar-group">
              <div className="sidebar-group-title">Uploads</div>
              <nav className="sidebar-nav">
                <NavLink to="/upload-orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <UploadCloud size={18} />
                  Sales Register Upload
                </NavLink>
                <NavLink to="/upload-stock" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Activity size={18} />
                  Upload Stock Report
                </NavLink>
                <NavLink to="/upload-monthly-sales" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Map size={18} />
                  Monthly Sales
                </NavLink>
                <NavLink to="/upload-primary-sales" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <UploadCloud size={18} />
                  Primary Sales Upload
                </NavLink>
                <NavLink to="/upload-csi-sales" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <UploadCloud size={18} />
                  CSI Sales Upload
                </NavLink>
              </nav>
            </div>

            <div className="sidebar-group">
              <div className="sidebar-group-title">Pricing Requests</div>
              <nav className="sidebar-nav">
                <NavLink to="/exceptional-price-request" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Edit3 size={18} />
                  Price Request
                </NavLink>
                <NavLink to="/epr-approvals" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <CheckCircle size={18} />
                  EPR Approvals
                </NavLink>
              </nav>
            </div>
          </div>
        </aside>
        <main className="main-content">
          <header className="app-header">
            <div className="app-header-title">
              <h2>Welcome back, Team 👋</h2>
              <p>Here's what's happening with your sales today.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="search-container">
                <input type="text" placeholder="Search..." className="search-input" />
                <Search size={18} className="search-icon" />
              </div>
              <div className="notification-bell">
                <Bell size={20} color="var(--text-muted)" />
                <span className="notification-badge"></span>
              </div>
            </div>
          </header>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/upload-orders" element={<UploadOrdersPage />} />
            <Route path="/upload-stock" element={<UploadStockPage />} />
            <Route path="/upload-monthly-sales" element={<UploadMonthlySalesPage />} />
            <Route path="/upload-primary-sales" element={<UploadPrimarySalesPage />} />
            <Route path="/upload-csi-sales" element={<UploadCSISalesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/exceptional-price-request" element={<ExceptionalPriceRequestPage />} />
            <Route path="/epr-approvals" element={<PriceRequestApprovalsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
