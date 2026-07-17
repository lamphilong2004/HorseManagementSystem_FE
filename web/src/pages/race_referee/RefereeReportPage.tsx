import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { RaceReport } from '../../types'
import { createRaceReport, getRaceReport, getPublicRace } from '@/api'
import { ScrollReveal } from '@/components/ui/scroll-text'
import {
  FileText, ArrowLeft, Save, Edit, Cloud, Route, ShieldAlert,
  ClipboardList, CheckCircle2, Clock, Users, Scale, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Navigation */}
      <Link 
        to={raceId ? `/app/referee/races/${raceId}` : '/app/referee/races'} 
        className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-amber-500 font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại cuộc đua
      </Link>

      <ScrollReveal direction="up" distance={30} duration={0.6}>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden relative">
          
          {/* Top Decorative Banner */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
          
          <div className="p-6 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <FileText className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight m-0 mb-1">
                    Biên bản thi đấu
                  </h1>
                  {raceName && (
                    <div className="flex items-center gap-2 text-[var(--muted)] font-medium">
                      <span className="text-amber-500">🏇</span>
                      {raceName}
                    </div>
                  )}
                </div>
              </div>
              
              {report && !editing && (
                <Button 
                  onClick={() => setEditing(true)}
                  className="bg-[var(--bg2)] hover:bg-amber-500/10 text-[var(--text)] hover:text-amber-500 border border-[var(--border)] shadow-sm gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa biên bản
                </Button>
              )}
            </div>

            {msg && (
              <div className={`flex items-center gap-3 p-4 mb-8 rounded-xl font-semibold border ${
                msg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {msg.text}
              </div>
            )}

            {/* Quick Stats Grid */}
            {report && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-amber-500/30">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">Số ngựa tham gia</p>
                    <p className="text-lg font-black text-[var(--text)] leading-none">{report.totalParticipants ?? '—'}</p>
                  </div>
                </div>
                
                <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-amber-500/30">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    (report.totalViolations || 0) > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
                  }`}>
                    <ShieldAlert className={`w-5 h-5 ${
                      (report.totalViolations || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">Tổng vi phạm</p>
                    <p className={`text-lg font-black leading-none ${
                      (report.totalViolations || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {report.totalViolations ?? 0}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-amber-500/30">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">Trọng tài</p>
                    <p className="text-sm font-black text-[var(--text)] truncate leading-tight">
                      {report.refereeId?.fullName || report.refereeId?.email || '—'}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-amber-500/30">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">Cập nhật</p>
                    <p className="text-xs font-bold text-[var(--text)] mt-0.5 truncate">
                      {report.updatedAt ? new Date(report.updatedAt).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Area (Form or View) */}
            <div className="bg-[var(--bg2)]/50 rounded-2xl border border-[var(--border)] p-6 md:p-8">
              {editing ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-500" />
                      Tóm tắt cuộc đua <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      placeholder="Mô tả tổng quan diễn biến chính của cuộc đua..."
                      rows={4}
                      className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 text-[var(--text)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-sky-400" />
                        Điều kiện thời tiết
                      </label>
                      <input
                        type="text"
                        value={form.weatherCondition}
                        onChange={(e) => setForm({ ...form, weatherCondition: e.target.value })}
                        placeholder="Ví dụ: Nắng nhẹ, gió đông bắc..."
                        className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                        <Route className="w-4 h-4 text-emerald-400" />
                        Tình trạng đường đua
                      </label>
                      <input
                        type="text"
                        value={form.trackCondition}
                        onChange={(e) => setForm({ ...form, trackCondition: e.target.value })}
                        placeholder="Ví dụ: Khô ráo, bùn lầy, cỏ tốt..."
                        className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      Chi tiết sự cố
                    </label>
                    <textarea
                      value={form.incidentDetails}
                      onChange={(e) => setForm({ ...form, incidentDetails: e.target.value })}
                      placeholder="Mô tả các sự cố, va chạm, hoặc lý do truất quyền thi đấu (nếu có)..."
                      rows={3}
                      className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 text-[var(--text)] focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-medium resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--muted)]" />
                      Ghi chú bổ sung
                    </label>
                    <textarea
                      value={form.additionalNotes}
                      onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                      placeholder="Các ghi chú khác dành cho ban tổ chức..."
                      rows={3}
                      className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 text-[var(--text)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium resize-y"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 mt-6 border-t border-[var(--border)]">
                    {report && (
                      <Button 
                        variant="ghost"
                        onClick={() => setEditing(false)}
                        className="w-full sm:w-auto hover:bg-[var(--surface-3)] text-[var(--text)]"
                      >
                        Hủy thay đổi
                      </Button>
                    )}
                    <Button
                      onClick={handleSave}
                      disabled={!form.summary || saving}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-2 min-w-[140px]"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? 'Đang lưu...' : 'Lưu biên bản'}
                    </Button>
                  </div>
                </div>
              ) : (
                report ? (
                  <div className="space-y-8">
                    {/* View Mode */}
                    <div>
                      <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        Tóm tắt diễn biến
                      </h3>
                      <div className="bg-[var(--bg2)] rounded-xl p-5 border border-[var(--border)] text-[var(--text)] leading-relaxed shadow-inner">
                        {report.summary}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {report.weatherCondition && (
                        <div>
                          <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Cloud className="w-4 h-4 text-sky-400" />
                            Thời tiết
                          </h3>
                          <div className="bg-[var(--bg2)] rounded-xl p-4 border border-[var(--border)] text-[var(--text)] font-medium">
                            {report.weatherCondition}
                          </div>
                        </div>
                      )}
                      {report.trackCondition && (
                        <div>
                          <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Route className="w-4 h-4 text-emerald-400" />
                            Đường đua
                          </h3>
                          <div className="bg-[var(--bg2)] rounded-xl p-4 border border-[var(--border)] text-[var(--text)] font-medium">
                            {report.trackCondition}
                          </div>
                        </div>
                      )}
                    </div>

                    {report.incidentDetails && (
                      <div>
                        <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          Ghi nhận sự cố
                        </h3>
                        <div className="bg-red-500/5 rounded-xl p-5 border border-red-500/20 text-red-200/90 leading-relaxed font-medium">
                          {report.incidentDetails}
                        </div>
                      </div>
                    )}

                    {report.additionalNotes && (
                      <div>
                        <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-[var(--muted)]" />
                          Ghi chú bổ sung
                        </h3>
                        <div className="bg-[var(--bg2)] rounded-xl p-5 border border-[var(--border)] text-[var(--text)] leading-relaxed italic">
                          {report.additionalNotes}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg2)] border border-[var(--border)] flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-[var(--muted)]/50" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text)] mb-2">Chưa có biên bản</h3>
                    <p className="text-[var(--muted)] mb-6 max-w-sm">
                      Cuộc đua này chưa được lập biên bản. Hãy tạo biên bản để ghi nhận kết quả và các sự cố.
                    </p>
                    <Button 
                      onClick={() => setEditing(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Lập biên bản ngay
                    </Button>
                  </div>
                )
              )}
            </div>
            
          </div>
        </div>
      </ScrollReveal>
    </div>
  )
}
