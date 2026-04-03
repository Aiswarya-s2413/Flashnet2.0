import { useState, useMemo } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

export function useSortableData(data) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]

      // Handle nulls
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''

      // Numeric comparison
      const aNum = parseFloat(aVal)
      const bNum = parseFloat(bVal)
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum
      }

      // String comparison
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  const requestSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return { sorted, sortKey, sortDir, requestSort }
}

export function SortHeader({ label, sortKey, currentSortKey, currentSortDir, onSort }) {
  const isActive = currentSortKey === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isActive ? (
          currentSortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
        ) : (
          <ArrowUpDown size={13} style={{ opacity: 0.3 }} />
        )}
      </span>
    </th>
  )
}
