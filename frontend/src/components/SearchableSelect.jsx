import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option...',
  labelKey = 'label',
  valueKey = 'value',
  required = false,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  // Find the selected option's label
  const selectedOption = options.find(opt => {
    const optVal = typeof opt === 'object' ? opt[valueKey] : opt
    return String(optVal) === String(value)
  })

  const displayLabel = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption[labelKey] : selectedOption)
    : ''

  // Filter options based on search query
  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'object' ? opt[labelKey] : opt
    return String(label || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSelect = (opt) => {
    const optVal = typeof opt === 'object' ? opt[valueKey] : opt
    onChange(optVal)
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div 
      ref={containerRef} 
      className="searchable-select-container"
      style={{ 
        position: 'relative', 
        width: '100%',
        ...style 
      }}
    >
      {/* Trigger Button */}
      <div
        className="form-control"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px 12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md, 8px)',
          minHeight: '38px',
          userSelect: 'none'
        }}
      >
        <span style={{ 
          color: displayLabel ? 'var(--text)' : 'var(--text-dim)',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          marginRight: '8px'
        }}>
          {displayLabel || placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          {value && !required && (
            <X 
              size={15} 
              onClick={handleClear} 
              style={{ cursor: 'pointer' }}
              className="hover-opacity"
            />
          )}
          <ChevronDown 
            size={18} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'none', 
              transition: 'transform 0.2s ease' 
            }} 
          />
        </div>
      </div>

      {/* Hidden input to support form validation/required attribute */}
      <input 
        type="text" 
        value={value} 
        onChange={() => {}}
        required={required} 
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          opacity: 0,
          border: 'none',
          pointerEvents: 'none'
        }}
      />

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1010,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg, #fafafa)'
          }}>
            <Search size={15} style={{ color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13.5px',
                padding: '4px 0',
                color: 'var(--text)'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{
            overflowY: 'auto',
            maxHeight: '220px',
            padding: '4px 0'
          }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => {
                const optVal = typeof opt === 'object' ? opt[valueKey] : opt
                const optLabel = typeof opt === 'object' ? opt[labelKey] : opt
                const isSelected = String(optVal) === String(value)

                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className="searchable-select-option"
                    style={{
                      padding: '8px 16px',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--accent-soft, rgba(11,59,44,0.08))' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text)',
                      fontWeight: isSelected ? '700' : 'normal',
                      transition: 'background 0.15s, color 0.15s'
                    }}
                  >
                    {optLabel}
                  </div>
                )
              })
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '13px'
              }}>
                No results found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
