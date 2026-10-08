import React, { useState, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  Filter, 
  X, 
  IndianRupee, 
  PackageCheck,
  Layers
} from 'lucide-react'

export const EPR_LEVEL_CONFIG = [
  {
    key: 'Pending Sales Exec Review',
    level: 'Level 1',
    name: 'Sales Exec Review',
    color: '#3B82F6', // Blue
    bgSoft: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    description: 'Initial review by Sales Executive'
  },
  {
    key: 'Pending Pricing & BD Teams',
    level: 'Level 2',
    name: 'Pricing & BD Teams',
    color: '#8B5CF6', // Purple
    bgSoft: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
    description: 'Commercial & BD verification'
  },
  {
    key: 'Pending Commercial Manager',
    level: 'Level 3',
    name: 'Commercial Manager',
    color: '#EC4899', // Pink
    bgSoft: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.3)',
    description: 'Escalated to Commercial Manager'
  },
  {
    key: 'Pending Sales Director',
    level: 'Level 4',
    name: 'Sales Director',
    color: '#F59E0B', // Amber
    bgSoft: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    description: 'Final director approval stage'
  },
  {
    key: 'Approved',
    level: 'Approved',
    name: 'Approved',
    color: '#10B981', // Emerald
    bgSoft: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    description: 'Approved and finalized'
  },
  {
    key: 'Sent Back to Distributor',
    aliases: ['Rejected', 'Sent Back to Distributor'],
    level: 'Sent Back',
    name: 'Sent Back to Distributor',
    color: '#EF4444', // Red
    bgSoft: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    description: 'Returned to distributor for revision'
  },
  {
    key: 'Draft',
    level: 'Draft',
    name: 'Draft',
    color: '#6B7280', // Gray
    bgSoft: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.3)',
    description: 'Draft requests'
  }
]

export const formatINR = (val) => {
  if (!val || isNaN(val)) return '₹0'
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(val))}`
}

export const formatVolume = (val) => {
  if (!val || isNaN(val)) return '0 kg'
  if (val >= 1000) return `${(val / 1000).toFixed(1)} MT`
  return `${new Intl.NumberFormat('en-IN').format(Math.round(val))} kg`
}

export default function EPRAnalysisPieChart({ eprs = [], activeFilter = null, onSelectFilter = () => {} }) {
  const [metricMode, setMetricMode] = useState('count') // 'count' | 'value' | 'volume'

  // Normalize and aggregate EPR financial and volume figures
  const analysisData = useMemo(() => {
    let totalRequests = eprs.length
    let totalValue = 0
    let totalVolume = 0
    let pendingApprovalCount = 0
    let approvedCount = 0
    let sentBackCount = 0

    // Grouping map
    const levelStats = {}
    EPR_LEVEL_CONFIG.forEach(lvl => {
      levelStats[lvl.key] = {
        ...lvl,
        count: 0,
        value: 0,
        volume: 0,
        eprs: []
      }
    })

    eprs.forEach(epr => {
      let rawStatus = epr.status || 'Draft'
      let normalizedStatus = rawStatus === 'Rejected' ? 'Sent Back to Distributor' : rawStatus

      if (!levelStats[normalizedStatus]) {
        // Fallback for unknown status
        levelStats[normalizedStatus] = {
          key: normalizedStatus,
          level: 'Other',
          name: normalizedStatus,
          color: '#8B5CF6',
          bgSoft: 'rgba(139, 92, 246, 0.1)',
          border: 'rgba(139, 92, 246, 0.3)',
          description: normalizedStatus,
          count: 0,
          value: 0,
          volume: 0,
          eprs: []
        }
      }

      let eprVal = 0
      let eprVol = 0
      if (Array.isArray(epr.line_items)) {
        epr.line_items.forEach(item => {
          const v = Number(item.proposed_sale_volume || item.existing_sale_volume) || 0
          const p = Number(item.requested_dist_price || item.requested_icp || item.existing_dist_price || item.existing_icp) || 0
          eprVol += v
          eprVal += (v * p)
        })
      }

      levelStats[normalizedStatus].count += 1
      levelStats[normalizedStatus].value += eprVal
      levelStats[normalizedStatus].volume += eprVol
      levelStats[normalizedStatus].eprs.push(epr)

      totalValue += eprVal
      totalVolume += eprVol

      if (normalizedStatus.startsWith('Pending')) {
        pendingApprovalCount += 1
      } else if (normalizedStatus === 'Approved') {
        approvedCount += 1
      } else if (normalizedStatus === 'Sent Back to Distributor') {
        sentBackCount += 1
      }
    })

    // Prepare pie chart slices (only include items with value > 0 for selected metric)
    const allLevelsList = Object.values(levelStats)

    const pieSlices = allLevelsList
      .map(lvl => {
        let val = 0
        if (metricMode === 'count') val = lvl.count
        else if (metricMode === 'value') val = lvl.value
        else if (metricMode === 'volume') val = lvl.volume

        const pct = totalRequests > 0 
          ? (metricMode === 'count' 
              ? ((lvl.count / totalRequests) * 100) 
              : metricMode === 'value' && totalValue > 0 
                ? ((lvl.value / totalValue) * 100) 
                : totalVolume > 0 ? ((lvl.volume / totalVolume) * 100) : 0)
          : 0

        return {
          ...lvl,
          pieValue: val,
          pct: pct
        }
      })
      .filter(item => item.pieValue > 0)

    return {
      totalRequests,
      totalValue,
      totalVolume,
      pendingApprovalCount,
      approvedCount,
      sentBackCount,
      allLevelsList,
      pieSlices
    }
  }, [eprs, metricMode])

  const {
    totalRequests,
    totalValue,
    totalVolume,
    pendingApprovalCount,
    approvedCount,
    sentBackCount,
    allLevelsList,
    pieSlices
  } = analysisData

  if (eprs.length === 0) {
    return null
  }

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
      {/* Top Header Row with Title and Metric Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Layers size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                EPR Status & Level Analysis
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Distribution of requests across review levels and financial exposure
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: '10px', padding: '3px', gap: '4px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setMetricMode('count')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: metricMode === 'count' ? '700' : '600',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: metricMode === 'count' ? 'var(--surface)' : 'transparent',
              color: metricMode === 'count' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: metricMode === 'count' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} />
            By Requests Count
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('value')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: metricMode === 'value' ? '700' : '600',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: metricMode === 'value' ? 'var(--surface)' : 'transparent',
              color: metricMode === 'value' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: metricMode === 'value' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IndianRupee size={13} />
            By Value (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('volume')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: metricMode === 'volume' ? '700' : '600',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: metricMode === 'volume' ? 'var(--surface)' : 'transparent',
              color: metricMode === 'volume' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: metricMode === 'volume' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PackageCheck size={13} />
            By Volume (kg)
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
            Total Requests
          </span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>
            {totalRequests}
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.06)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
            Pending Workflow
          </span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB' }}>
            {pendingApprovalCount}
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
            Approved
          </span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
            {approvedCount}
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
            Sent Back
          </span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626' }}>
            {sentBackCount}
          </div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
            Requested Value
          </span>
          <div style={{ fontSize: '19px', fontWeight: '800', color: 'var(--primary)' }}>
            {formatINR(totalValue)}
          </div>
        </div>
      </div>

      {/* Main Grid: Pie Chart (Left) + Level-by-Level Breakdown (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'center' }}>
        {/* Left: Donut Pie Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '300px' }}>
          <div style={{ width: '100%', height: '280px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieSlices}
                  dataKey="pieValue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={108}
                  paddingAngle={3}
                  labelLine={false}
                  label={({ percent }) => {
                    const p = percent * 100
                    return p >= 6 ? `${p.toFixed(0)}%` : null
                  }}
                  onClick={(entry) => {
                    if (entry && entry.key) {
                      onSelectFilter(activeFilter === entry.key ? null : entry.key)
                    }
                  }}
                  cursor="pointer"
                >
                  {pieSlices.map((entry) => (
                    <Cell
                      key={`cell-${entry.key}`}
                      fill={entry.color}
                      stroke={activeFilter === entry.key ? 'var(--text)' : 'var(--surface)'}
                      strokeWidth={activeFilter === entry.key ? 3 : 2}
                      style={{
                        filter: activeFilter === entry.key ? 'drop-shadow(0 0 8px rgba(0,0,0,0.25))' : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload
                      return (
                        <div style={{
                          background: 'var(--surface)',
                          border: `1px solid ${item.color || 'var(--border)'}`,
                          padding: '12px 14px',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-lg)',
                          minWidth: '200px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                            <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{item.name}</strong>
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: item.bgSoft, color: item.color, fontWeight: '700' }}>
                              {item.level}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Requests:</span>
                              <strong style={{ color: 'var(--text)' }}>{item.count} ({item.pct.toFixed(1)}%)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total Value:</span>
                              <strong style={{ color: 'var(--text)' }}>{formatINR(item.value)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total Volume:</span>
                              <strong style={{ color: 'var(--text)' }}>{formatVolume(item.volume)}</strong>
                            </div>
                          </div>
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-dim)', textAlign: 'center' }}>
                            Click to filter table
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', lineHeight: 1.1 }}>
                {metricMode === 'count' ? totalRequests : metricMode === 'value' ? formatINR(totalValue) : formatVolume(totalVolume)}
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
                {metricMode === 'count' ? 'Total Requests' : metricMode === 'value' ? 'Total Value' : 'Total Volume'}
              </div>
            </div>
          </div>
          
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '-8px' }}>
            Tip: Click a slice to filter the requests table below
          </span>
        </div>

        {/* Right: Detailed Approval Levels Breakdown Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approval Level Breakdown
            </span>
            {activeFilter && (
              <button
                type="button"
                onClick={() => onSelectFilter(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11.5px',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={12} /> Clear Filter
              </button>
            )}
          </div>

          {allLevelsList.map(lvl => {
            const isSelected = activeFilter === lvl.key
            const sharePct = totalRequests > 0 ? ((lvl.count / totalRequests) * 100).toFixed(1) : 0

            return (
              <div
                key={lvl.key}
                onClick={() => onSelectFilter(isSelected ? null : lvl.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: isSelected ? lvl.bgSoft : 'var(--surface2)',
                  border: `1.5px solid ${isSelected ? lvl.color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: (activeFilter && !isSelected) ? 0.6 : 1
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = lvl.color
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                {/* Left: Indicator & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: lvl.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
                        {lvl.name}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: lvl.color, background: lvl.bgSoft, padding: '1px 5px', borderRadius: '4px' }}>
                        {lvl.level}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>
                      {lvl.description}
                    </span>
                  </div>
                </div>

                {/* Right: Quantities & Amounts */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: lvl.count > 0 ? 'var(--text)' : 'var(--text-dim)' }}>
                      {lvl.count} {lvl.count === 1 ? 'req' : 'reqs'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
                      ({sharePct}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: '600', color: lvl.value > 0 ? 'var(--primary)' : 'var(--text-dim)' }}>
                    {formatINR(lvl.value)} · {formatVolume(lvl.volume)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
