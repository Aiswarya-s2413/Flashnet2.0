import { useState, useEffect } from 'react'
import API from '../api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, Package, Map, ShoppingCart } from 'lucide-react'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await API.get('/dashboard/metrics/')
        // Sort stock levels descending explicitly
        const data = res.data
        if (data.stock_levels) {
          data.stock_levels.sort((a, b) => b.stock - a.stock)
        }
        setMetrics(data)
      } catch (e) {
        console.error("Dashboard fetch error:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
         <span className="spinner" style={{ width: 40, height: 40, borderBottomColor: 'var(--primary)', marginBottom: 16 }} />
         <p style={{ color: 'var(--text-dim)' }}>Aggregating dynamic matrices natively...</p>
      </div>
    )
  }

  if (!metrics) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Unable to load dashboard gracefully.</div>
  }

  const { top_products, top_customers, monthly_progression, stock_levels } = metrics

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Executive Dashboard</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Top Product Card */}
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Top Product</p>
            <h3 style={{ fontSize: 20, margin: '0 0 4px 0', lineHeight: 1.3 }}>
              {top_products && top_products.length > 0 ? top_products[0].name : 'N/A'}
            </h3>
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 18 }}>
              {top_products && top_products.length > 0 ? formatNumber(top_products[0].volume) : 0} <span style={{fontSize: 14, color: 'var(--text-dim)', fontWeight: 400}}>KGs</span>
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 12, color: 'var(--primary)' }}>
            <Package size={24} />
          </div>
        </div>

        {/* Top Customer Card */}
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Top Customer</p>
             <h3 style={{ fontSize: 20, margin: '0 0 4px 0', lineHeight: 1.3 }}>
              {top_customers && top_customers.length > 0 ? top_customers[0].name : 'N/A'}
            </h3>
            <p style={{ color: '#10b981', fontWeight: 600, fontSize: 18 }}>
              {top_customers && top_customers.length > 0 ? formatNumber(top_customers[0].volume) : 0} <span style={{fontSize: 14, color: 'var(--text-dim)', fontWeight: 400}}>KGs</span>
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, color: '#10b981' }}>
            <ShoppingCart size={24} />
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: 24, height: 400 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Monthly Progression Overview</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: '4px 0 0 0' }}>Volume fluctuations extracted from monthly sales</p>
          </div>
          {monthly_progression && monthly_progression.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={monthly_progression} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} width={60} tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [formatNumber(value) + ' KGs', 'Volume']}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Area type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No monthly sales data found natively.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Top Products Volume Chart */}
        <div className="card" style={{ padding: 24, height: 350 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>Top Products by Volume</h3>
          {top_products && top_products.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart layout="vertical" data={top_products} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: 'var(--text-dim)', fontSize: 11}} width={120} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [formatNumber(value) + ' KGs', 'Volume']}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  cursor={{fill: 'var(--bg)'}}
                />
                <Bar dataKey="volume" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No products found structurally.
            </div>
          )}
        </div>

        {/* Top Monthly Stock Levels */}
        <div className="card" style={{ padding: 24, height: 350 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>Top Current Monthly Stock Levels</h3>
          {stock_levels && stock_levels.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={stock_levels.slice(0, 5)} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fill: 'var(--text-dim)', fontSize: 11}} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} width={60} tick={{fill: 'var(--text-dim)'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [formatNumber(value) + ' KGs', 'Inventory']}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  cursor={{fill: 'var(--bg)'}}
                />
                <Bar dataKey="stock" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No stock levels extracted.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
