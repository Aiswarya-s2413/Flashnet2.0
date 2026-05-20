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
          <div className="sidebar-brand">
            <img src="/logo.png" alt="FlashNet" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span>FlashNet</span>
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
            <NavLink to="/invoices" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FileText size={18} />
              Distributor Invoices
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Package size={18} />
              Product Master
            </NavLink>
            <NavLink to="/exceptional-price-request" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Edit3 size={18} />
              Price Request
            </NavLink>
            <NavLink to="/epr-approvals" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <CheckCircle size={18} />
              EPR Approvals
            </NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Welcome back, Team 👋</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, marginTop: '4px' }}>Here's what's happening with your sales today.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Search..." style={{ width: '280px', paddingLeft: '40px', borderRadius: '999px', background: '#ffffff', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} />
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <Bell size={20} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: '#ffffff', padding: '6px 16px 6px 6px', borderRadius: '999px', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>AS</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.2 }}>Aiswarya</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin</span>
                </div>
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
