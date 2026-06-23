import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
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
import OnboardingApprovalsPage from './pages/OnboardingApprovalsPage'

import AuthProvider from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import useAuthStore from './auth/useAuth'

import { Package, FileText, ShoppingCart, LayoutDashboard, UploadCloud, Activity, Map, Edit3, CheckCircle, Search, Bell, LogOut, Users } from 'lucide-react'

// AppShell holds the sidebar layout, top header and profile sign out
function AppShell({ children }) {
  const { logout, user } = useAuthStore()

  return (
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
                Monthly Secondary Sales
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
            <div className="sidebar-group-title">Pricing & Access</div>
            <nav className="sidebar-nav">
              <NavLink to="/exceptional-price-request" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Edit3 size={18} />
                Price Request
              </NavLink>
              <NavLink to="/epr-approvals" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <CheckCircle size={18} />
                EPR Approvals
              </NavLink>
              <NavLink to="/onboarding-approvals" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Users size={18} />
                Onboarding Approvals
              </NavLink>
            </nav>
          </div>
        </div>

        {user && (
          <div style={{ padding: '16px 8px 0 8px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>User Session</div>
            <div style={{ color: 'var(--text)', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.upn}</div>
            <button className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--red)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 16px' }} onClick={() => { logout(); window.location.href='/login'; }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </aside>
      <main className="main-content">
        <header className="app-header">
          <div className="app-header-title">
            <h2>Welcome back, {user ? user.name.split(' ')[0] : 'Team'} 👋</h2>
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
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Pipelines */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/pending" element={<PendingApprovalPage />} />

          {/* Secure Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppShell><DashboardPage /></AppShell>} />
            <Route path="/orders" element={<AppShell><OrdersPage /></AppShell>} />
            <Route path="/upload-orders" element={<AppShell><UploadOrdersPage /></AppShell>} />
            <Route path="/upload-stock" element={<AppShell><UploadStockPage /></AppShell>} />
            <Route path="/upload-monthly-sales" element={<AppShell><UploadMonthlySalesPage /></AppShell>} />
            <Route path="/upload-primary-sales" element={<AppShell><UploadPrimarySalesPage /></AppShell>} />
            <Route path="/upload-csi-sales" element={<AppShell><UploadCSISalesPage /></AppShell>} />
            <Route path="/invoices" element={<AppShell><InvoicesPage /></AppShell>} />
            <Route path="/products" element={<AppShell><ProductsPage /></AppShell>} />
            <Route path="/exceptional-price-request" element={<AppShell><ExceptionalPriceRequestPage /></AppShell>} />
            <Route path="/epr-approvals" element={<AppShell><PriceRequestApprovalsPage /></AppShell>} />
            <Route path="/onboarding-approvals" element={<AppShell><OnboardingApprovalsPage /></AppShell>} />
          </Route>

          {/* Catch-all redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
