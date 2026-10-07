import React from 'react'
import { Loader2 } from 'lucide-react'

export default function StatLoader({ size, color, sub = false, width, style = {} }) {
  const iconSize = size || (sub ? 11 : 16)
  return (
    <span
      className={sub ? 'stat-loading-placeholder-sub' : 'stat-loading-placeholder'}
      style={{
        width: width || undefined,
        ...style,
      }}
    >
      <Loader2
        size={iconSize}
        className="animate-spin"
        style={{ color: color || 'currentColor', opacity: 0.85 }}
      />
    </span>
  )
}
