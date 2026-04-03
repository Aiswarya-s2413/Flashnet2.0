import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: 4, padding: '16px 0', marginTop: 8
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6,
          background: 'var(--surface)', cursor: currentPage === 1 ? 'default' : 'pointer',
          opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center'
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers()[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} style={pageBtn(false)}>1</button>
          {getPageNumbers()[0] > 2 && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>…</span>}
        </>
      )}

      {getPageNumbers().map(p => (
        <button key={p} onClick={() => onPageChange(p)} style={pageBtn(p === currentPage)}>
          {p}
        </button>
      ))}

      {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
        <>
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>…</span>}
          <button onClick={() => onPageChange(totalPages)} style={pageBtn(false)}>{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6,
          background: 'var(--surface)', cursor: currentPage === totalPages ? 'default' : 'pointer',
          opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center'
        }}
      >
        <ChevronRight size={16} />
      </button>

      <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-dim)' }}>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  )
}

const pageBtn = (active) => ({
  padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6,
  background: active ? 'var(--primary)' : 'var(--surface)',
  color: active ? '#fff' : 'var(--text)',
  fontWeight: active ? 600 : 400, cursor: 'pointer', fontSize: 13,
  minWidth: 36, textAlign: 'center'
})
