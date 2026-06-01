import React from 'react'

interface PaginationProps {
  total: number
  page: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pagination({ total, page, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 4) pages.push('ellipsis')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 3) pages.push('ellipsis')
    pages.push(totalPages)
  }

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    height: 34,
    padding: '0 8px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--muted)',
    transition: 'all 150ms',
    fontFamily: 'inherit',
  }

  const activeStyle: React.CSSProperties = {
    ...base,
    background: 'linear-gradient(180deg, #059669, #047857)',
    borderColor: '#047857',
    color: '#fff',
    cursor: 'default',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {/* Prev */}
      <button
        style={{ ...base, opacity: page === 1 ? 0.4 : 1 }}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ← Trước
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} style={{ color: 'var(--muted)', padding: '0 4px', fontSize: 13 }}>…</span>
        ) : (
          <button
            key={p}
            style={p === page ? activeStyle : base}
            onClick={() => p !== page && onChange(p)}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        style={{ ...base, opacity: page === totalPages ? 0.4 : 1 }}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau →
      </button>

      <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
      </span>
    </div>
  )
}
