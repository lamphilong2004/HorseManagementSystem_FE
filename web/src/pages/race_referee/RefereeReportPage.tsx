import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { RaceReport } from '../../types'
import { createRaceReport, getRaceReport, getPublicRace } from '../../api'

export function RefereeReportPage() {
  const { raceId } = useParams<{ raceId: string }>()
  const [raceName, setRaceName] = useState('')
  const [report, setReport] = useState<RaceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    summary: '',
    weatherCondition: '',
    trackCondition: '',
    incidentDetails: '',
    additionalNotes: '',
  })

  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    Promise.all([
      getRaceReport(raceId).catch(() => null),
      getPublicRace(raceId).catch(() => null),
    ]).then(([rep, race]) => {
      if (rep && rep._id) {
        setReport(rep)
        setForm({
          summary: rep.summary || '',
          weatherCondition: rep.weatherCondition || '',
          trackCondition: rep.trackCondition || '',
          incidentDetails: rep.incidentDetails || '',
          additionalNotes: rep.additionalNotes || '',
        })
      } else {
        setEditing(true) // No report yet, show form
      }
      if (race) setRaceName(race.name)
    }).finally(() => setLoading(false))
  }, [raceId])

  async function handleSave() {
    if (!raceId) return
    setSaving(true)
    setMsg(null)
    try {
      await createRaceReport(raceId, form)
      setMsg({ type: 'success', text: 'Lưu biên bản thành công!' })
      setEditing(false)
      // Reload report
      const rep = await getRaceReport(raceId).catch(() => null)
      if (rep) setReport(rep)
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Lỗi khi lưu biên bản' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <Link to={raceId ? `/referee/races/${raceId}` : '/referee/races'} className="back-link">← Quay lại cuộc đua</Link>

      <div className="card">
        <div className="flex justify-between items-center flex-wrap gap-8 mb-16">
          <div>
            <h1 style={{ margin: 0 }}>📝 Biên bản thi đấu</h1>
            {raceName && <p className="muted mt-8">🏇 {raceName}</p>}
          </div>
          {report && !editing && (
            <button className="btn btnPrimary" onClick={() => setEditing(true)}>
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>

        {msg && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-16`}>{msg.text}</div>}

        {/* Stats if report exists */}
        {report && (
          <div className="stat-grid mb-16">
            <div className="stat-card">
              <div className="stat-icon">🐴</div>
              <div className="stat-label">Số ngựa tham gia</div>
              <div className="stat-value">{report.totalParticipants ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-label">Tổng vi phạm</div>
              <div className="stat-value" style={{ color: (report.totalViolations || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {report.totalViolations ?? 0}
              </div>
            </div>
            {report.refereeId && (
              <div className="stat-card">
                <div className="stat-icon">⚖️</div>
                <div className="stat-label">Trọng tài</div>
                <div className="stat-value" style={{ fontSize: 16 }}>
                  {report.refereeId?.fullName || report.refereeId?.email || '—'}
                </div>
              </div>
            )}
            <div className="stat-card">
              <div className="stat-icon">🕐</div>
              <div className="stat-label">Cập nhật</div>
              <div className="stat-value" style={{ fontSize: 14 }}>
                {report.updatedAt ? new Date(report.updatedAt).toLocaleString('vi-VN') : '—'}
              </div>
            </div>
          </div>
        )}

        {editing ? (
          /* Edit form */
          <div style={{ maxWidth: 700 }}>
            <div className="form-group">
              <label>Tóm tắt cuộc đua *</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Mô tả tổng quan cuộc đua..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Điều kiện thời tiết</label>
                <input
                  value={form.weatherCondition}
                  onChange={(e) => setForm({ ...form, weatherCondition: e.target.value })}
                  placeholder="Ví dụ: Nắng nhẹ, gió nhẹ"
                />
              </div>
              <div className="form-group">
                <label>Tình trạng đường đua</label>
                <input
                  value={form.trackCondition}
                  onChange={(e) => setForm({ ...form, trackCondition: e.target.value })}
                  placeholder="Ví dụ: Khô ráo, tốt"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Chi tiết sự cố</label>
              <textarea
                value={form.incidentDetails}
                onChange={(e) => setForm({ ...form, incidentDetails: e.target.value })}
                placeholder="Mô tả các sự cố (nếu có)..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Ghi chú bổ sung</label>
              <textarea
                value={form.additionalNotes}
                onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                placeholder="Ghi chú khác..."
                rows={2}
              />
            </div>

            <div className="flex gap-8 mt-16">
              {report && (
                <button className="btn" onClick={() => setEditing(false)}>Hủy</button>
              )}
              <button
                className="btn btnPrimary"
                disabled={!form.summary || saving}
                onClick={handleSave}
              >
                {saving ? 'Đang lưu...' : '💾 Lưu biên bản'}
              </button>
            </div>
          </div>
        ) : (
          /* Read-only view */
          report ? (
            <div style={{ maxWidth: 700 }}>
              <div className="section mb-16">
                <div className="section-title">📋 Tóm tắt</div>
                <p>{report.summary}</p>
              </div>

              <div className="form-row mb-16">
                {report.weatherCondition && (
                  <div>
                    <div className="section-title">🌤️ Thời tiết</div>
                    <p>{report.weatherCondition}</p>
                  </div>
                )}
                {report.trackCondition && (
                  <div>
                    <div className="section-title">🛤️ Đường đua</div>
                    <p>{report.trackCondition}</p>
                  </div>
                )}
              </div>

              {report.incidentDetails && (
                <div className="section mb-16">
                  <div className="section-title">🚨 Sự cố</div>
                  <p>{report.incidentDetails}</p>
                </div>
              )}

              {report.additionalNotes && (
                <div className="section mb-16">
                  <div className="section-title">📝 Ghi chú</div>
                  <p>{report.additionalNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-text">Chưa có biên bản</div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
