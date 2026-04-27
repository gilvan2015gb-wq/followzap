'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types'

// ─── Helpers ────────────────────────────────────────────────
function minutosDesde(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60)
}

function tempoDesde(dateStr: string) {
  const diff = minutosDesde(dateStr)
  if (diff < 1) return 'agora mesmo'
  if (diff < 60) return `${diff} min atrás`
  const h = Math.floor(diff / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

// ─── Status config ───────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  em_atendimento: { label: 'Em atendimento', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  fechado: { label: 'Fechado', color: 'bg-green-50 text-green-700 border-green-200' },
  perdido: { label: 'Perdido', color: 'bg-red-50 text-red-700 border-red-200' },
}

// ─── Card de métrica ─────────────────────────────────────────
function MetricCard({
  label,
  value,
  icon,
  onClick,
  active,
}: {
  label: string
  value: number
  icon: string
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border p-5 transition-all hover:shadow-md
      ${active ? 'border-green-400 shadow-md ring-2 ring-green-100' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${active ? 'text-green-600' : 'text-gray-900'}`}>
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </button>
  )
}

// ─── Card do lead ────────────────────────────────────────────
function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const parado = minutosDesde(lead.last_interaction) >= 15
  const config = statusConfig[lead.status] ?? statusConfig.novo

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md hover:border-green-300
      ${parado ? 'border-red-200' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{lead.name}</p>
            <p className="text-xs text-gray-400 truncate">{lead.phone}</p>
          </div>
        </div>

        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
          {config.label}
        </span>
      </div>

      {lead.last_message && (
        <p className="text-xs text-gray-500 mt-3 truncate pl-[52px]">
          {lead.last_message}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pl-[52px]">
        <span className="text-xs text-gray-400">
          🕐 {tempoDesde(lead.last_interaction)}
        </span>
        {parado && (
          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            ⚠️ Parado
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('last_interaction', { ascending: false })

      if (data) setLeads(data)
      setLoading(false)
    }

    carregar()
  }, [])

  // ── Métricas ──────────────────────────────────────────────
  const total = leads.length
  const novos = leads.filter(l => l.status === 'novo').length
  const parados = leads.filter(
    l =>
      minutosDesde(l.last_interaction) >= 15 &&
      l.status !== 'fechado' &&
      l.status !== 'perdido'
  ).length
  const fechados = leads.filter(l => l.status === 'fechado').length
  const perdidos = leads.filter(l => l.status === 'perdido').length

  // ── Filtro + busca ────────────────────────────────────────
  const leadsFiltrados = leads.filter(lead => {
    const buscaOk =
      busca.trim() === '' ||
      lead.name.toLowerCase().includes(busca.toLowerCase()) ||
      lead.phone.includes(busca)

    if (!buscaOk) return false

    if (filtro === 'novos') return lead.status === 'novo'
    if (filtro === 'parados')
      return (
        minutosDesde(lead.last_interaction) >= 15 &&
        lead.status !== 'fechado' &&
        lead.status !== 'perdido'
      )
    if (filtro === 'fechados') return lead.status === 'fechado'
    if (filtro === 'perdidos') return lead.status === 'perdido'

    return true
  })

  function toggleFiltro(key: string) {
    setFiltro(prev => (prev === key ? null : key))
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xl">⚡</span>
            <span className="font-bold text-gray-900 text-lg">Followzap</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Total de leads" value={total} icon="👥" onClick={() => toggleFiltro('total')} active={!filtro} />
          <MetricCard label="Leads novos" value={novos} icon="🆕" onClick={() => toggleFiltro('novos')} active={filtro === 'novos'} />
          <MetricCard label="Leads parados" value={parados} icon="⚠️" onClick={() => toggleFiltro('parados')} active={filtro === 'parados'} />
          <MetricCard label="Leads fechados" value={fechados} icon="✅" onClick={() => toggleFiltro('fechados')} active={filtro === 'fechados'} />
          <MetricCard label="Leads perdidos" value={perdidos} icon="❌" onClick={() => toggleFiltro('perdidos')} active={filtro === 'perdidos'} />
        </div>

        {/* Busca */}
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        {/* Lista */}
        {loading ? (
          <p>Carregando...</p>
        ) : leadsFiltrados.length === 0 ? (
          <p>Nenhum lead encontrado.</p>
        ) : (
          <>
            <p className="text-xs text-gray-400">
              {leadsFiltrados.length} lead{leadsFiltrados.length !== 1 ? 's' : ''} encontrado{leadsFiltrados.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {leadsFiltrados.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}