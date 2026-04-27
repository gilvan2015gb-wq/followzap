'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { detectarSugestao } from '@/lib/suggestions'
import type { Lead, Message } from '@/types'

// ─── Status ─────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string }> = {
  novo:           { label: 'Novo',           color: 'bg-blue-100 text-blue-700' },
  em_atendimento: { label: 'Em atendimento', color: 'bg-yellow-100 text-yellow-700' },
  fechado:        { label: 'Fechado',        color: 'bg-green-100 text-green-700' },
  perdido:        { label: 'Perdido',        color: 'bg-red-100 text-red-700' },
}

// ─── Helpers de tempo ────────────────────────────────────────
function minutosDesde(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60)
}

function tempoDesde(dateStr: string) {
  const diff = minutosDesde(dateStr)
  if (diff < 1)   return 'agora mesmo'
  if (diff < 60)  return `${diff} min atrás`
  const h = Math.floor(diff / 60)
  if (h < 24)    return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function descricaoTempo(minutos: number) {
  if (minutos < 60)   return `${minutos} minutos`
  if (minutos < 1440) return `${Math.floor(minutos / 60)} hora${Math.floor(minutos / 60) > 1 ? 's' : ''}`
  return `${Math.floor(minutos / 1440)} dia${Math.floor(minutos / 1440) > 1 ? 's' : ''}`
}

// ─── Reativação ──────────────────────────────────────────────
type NivelReativacao = 'leve' | 'retomada' | 'urgencia'

function getNivel(minutos: number): NivelReativacao {
  if (minutos >= 1440) return 'urgencia'
  if (minutos >= 60)   return 'retomada'
  return 'leve'
}

const configReativacao: Record<NivelReativacao, {
  tag: string; icone: string; cor: string; corBorda: string; mensagem: string
}> = {
  leve: {
    tag: '💬 Tom leve', icone: '👋',
    cor: 'bg-blue-50', corBorda: 'border-blue-200',
    mensagem: 'Oi! Tudo bem? 😊 Só passando pra saber se você ainda tem interesse ou se ficou alguma dúvida que eu possa ajudar.',
  },
  retomada: {
    tag: '🔄 Tom de retomada', icone: '🤝',
    cor: 'bg-yellow-50', corBorda: 'border-yellow-200',
    mensagem: 'Oi! Estava revisando nossas conversas e vi que a gente não falou mais 😊 Ainda posso te ajudar? Se tiver qualquer dúvida, é só falar!',
  },
  urgencia: {
    tag: '🔥 Tom de urgência', icone: '⚡',
    cor: 'bg-red-50', corBorda: 'border-red-200',
    mensagem: 'Oi! Não quero deixar você sem resposta 😊 Ainda tenho interesse em te atender, mas preciso saber se posso contar com você. Me fala: ainda faz sentido conversarmos?',
  },
}

// ─── Pós-venda: dados ────────────────────────────────────────
const posVendaItens = [
  {
    id: 'recebimento',
    icone: '📦',
    titulo: 'Confirmar recebimento',
    descricao: 'Verifique se o produto chegou bem ao cliente.',
    mensagem: 'Oi! Tudo certo com o produto? Chegou direitinho pra você? 😊',
    cor: 'border-green-200',
    corIcone: 'bg-green-50 text-green-600',
  },
  {
    id: 'feedback',
    icone: '⭐',
    titulo: 'Pedir feedback',
    descricao: 'Mostre que você se importa com a experiência do cliente.',
    mensagem: 'Fico feliz que tenha comprado com a gente 😊 Se puder, me conta como foi sua experiência!',
    cor: 'border-yellow-200',
    corIcone: 'bg-yellow-50 text-yellow-600',
  },
  {
    id: 'nova-oferta',
    icone: '🎁',
    titulo: 'Nova oferta',
    descricao: 'Aproveite o momento para apresentar outro produto.',
    mensagem: 'Oi! Como você já comprou com a gente, posso te mandar uma condição especial em outro produto?',
    cor: 'border-blue-200',
    corIcone: 'bg-blue-50 text-blue-600',
  },
]

// ─── Componente: Botão copiar ────────────────────────────────
function BotaoCopiar({ texto, label = 'Copiar mensagem' }: { texto: string; label?: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      onClick={copiar}
      className={`w-full text-sm font-semibold py-2 rounded-lg transition-all
        ${copiado
          ? 'bg-green-500 text-white'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
        }`}
    >
      {copiado ? '✓ Copiado!' : `📋 ${label}`}
    </button>
  )
}

// ─── Componente: Painel pós-venda ────────────────────────────
function PainelPosVenda() {
  return (
    <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
        <span className="text-lg">🏆</span>
        <div>
          <p className="text-sm font-bold text-gray-900">Pós-venda</p>
          <p className="text-xs text-gray-400">Venda fechada — mantenha o cliente satisfeito</p>
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3">
        {posVendaItens.map(item => (
          <div
            key={item.id}
            className={`rounded-xl border ${item.cor} p-4 space-y-3`}
          >
            {/* Título + descrição */}
            <div className="flex items-start gap-3">
              <span className={`text-lg w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.corIcone}`}>
                {item.icone}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.descricao}</p>
              </div>
            </div>

            {/* Mensagem pronta */}
            <p className="text-sm text-gray-700 bg-white rounded-lg px-4 py-3 border border-gray-100 leading-relaxed">
              {item.mensagem}
            </p>

            {/* Botão copiar */}
            <BotaoCopiar texto={item.mensagem} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Componente: Alerta de inatividade ──────────────────────
function AlertaInatividade({ lastInteraction }: { lastInteraction: string }) {
  const minutos = minutosDesde(lastInteraction)
  if (minutos < 15) return null
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
      <span>⚠️</span>
      <span>Lead parado há <strong>{descricaoTempo(minutos)}</strong> — considere enviar uma mensagem</span>
    </div>
  )
}

// ─── Componente: Sugestão por palavra-chave ──────────────────
function CaixaSugestao({ sugestao }: { sugestao: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span>💡</span>
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
          Sugestão baseada na última mensagem
        </p>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed bg-white rounded-lg px-4 py-3 border border-green-100">
        {sugestao}
      </p>
      <BotaoCopiar texto={sugestao} label="Copiar sugestão" />
    </div>
  )
}

// ─── Componente: Painel de reativação ────────────────────────
function PainelReativacao({ lastInteraction }: { lastInteraction: string }) {
  const [aberto, setAberto] = useState(false)
  const minutos = minutosDesde(lastInteraction)
  if (minutos < 15) return null

  const nivel  = getNivel(minutos)
  const config = configReativacao[nivel]

  return (
    <div className={`rounded-xl border ${config.corBorda} ${config.cor} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{config.icone}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Mensagem de reativação</p>
            <p className="text-xs text-gray-500">
              Lead parado há {descricaoTempo(minutos)} · {config.tag}
            </p>
          </div>
        </div>
        {!aberto && (
          <button
            onClick={() => setAberto(true)}
            className="text-xs font-semibold bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
          >
            Gerar mensagem
          </button>
        )}
      </div>

      {aberto && (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {(['leve', 'retomada', 'urgencia'] as NivelReativacao[]).map(n => (
              <div key={n} className={`h-1 flex-1 rounded-full ${
                (n === 'leve')     ? 'bg-blue-400' :
                (n === 'retomada' && (nivel === 'retomada' || nivel === 'urgencia')) ? 'bg-yellow-400' :
                (n === 'urgencia' && nivel === 'urgencia') ? 'bg-red-400' :
                'bg-gray-200'
              }`} />
            ))}
          </div>
          <p className="text-xs text-gray-400">
            {nivel === 'leve'     && 'Nível 1 de 3 — tom leve e amigável'}
            {nivel === 'retomada' && 'Nível 2 de 3 — retomada da conversa'}
            {nivel === 'urgencia' && 'Nível 3 de 3 — urgência e definição'}
          </p>
          <p className="text-sm text-gray-800 bg-white rounded-lg px-4 py-3 border border-gray-100 leading-relaxed">
            {config.mensagem}
          </p>
          <div className="flex gap-2">
            <BotaoCopiar texto={config.mensagem} />
            <button
              onClick={() => setAberto(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────
export default function LeadDetail() {
  const { id }   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [lead, setLead]         = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [novaMsg, setNovaMsg]   = useState('')
  const [direcao, setDirecao]   = useState<'inbound' | 'outbound'>('inbound')
  const [sugestao, setSugestao] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const [{ data: leadData }, { data: msgData }] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).single(),
        supabase.from('messages').select('*').eq('lead_id', id).order('created_at', { ascending: true }),
      ])
      if (leadData) {
        setLead(leadData)
        if (leadData.last_message) setSugestao(detectarSugestao(leadData.last_message))
      }
      if (msgData) setMessages(msgData)
      setLoading(false)
    }
    carregar()
  }, [id])

  useEffect(() => {
    if (direcao === 'inbound' && novaMsg.trim()) {
      setSugestao(detectarSugestao(novaMsg))
    } else if (!novaMsg.trim()) {
      setSugestao(lead?.last_message ? detectarSugestao(lead.last_message) : null)
    }
  }, [novaMsg, direcao])

  async function salvarMensagem() {
    if (!novaMsg.trim()) return
    setSalvando(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({ lead_id: id, content: novaMsg.trim(), direction: direcao })
      .select()
      .single()
    if (!error && data) {
      setMessages(prev => [...prev, data])
      setLead(prev => prev
        ? { ...prev, last_message: novaMsg.trim(), last_interaction: new Date().toISOString() }
        : prev
      )
      if (direcao === 'inbound') setSugestao(detectarSugestao(novaMsg.trim()))
      setNovaMsg('')
    }
    setSalvando(false)
  }

  async function atualizarStatus(novoStatus: string) {
    await supabase.from('leads').update({ status: novoStatus }).eq('id', id)
    setLead(prev => prev ? { ...prev, status: novoStatus as Lead['status'] } : prev)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Carregando...
    </div>
  )

  if (!lead) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Lead não encontrado.
    </div>
  )

  const config   = statusConfig[lead.status] ?? statusConfig.novo
  const fechado  = lead.status === 'fechado'
  const parado   = minutosDesde(lead.last_interaction) >= 15

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{lead.name}</p>
            <p className="text-xs text-gray-400">{lead.phone}</p>
          </div>
        </div>
        <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
          {config.label}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Pós-venda — só quando fechado */}
        {fechado && <PainelPosVenda />}

        {/* Alertas — só quando não fechado */}
        {!fechado && parado && (
          <>
            <AlertaInatividade lastInteraction={lead.last_interaction} />
            <PainelReativacao lastInteraction={lead.last_interaction} />
          </>
        )}

        {/* Dados do lead */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>🕐</span>
            <span>Última interação: <strong className="text-gray-600">{tempoDesde(lead.last_interaction)}</strong></span>
          </div>

          {lead.last_message && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 border border-gray-100">
              <span className="text-xs text-gray-400 block mb-1">Última mensagem registrada</span>
              {lead.last_message}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-2">Alterar status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => atualizarStatus(key)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
                    ${lead.status === key
                      ? `${val.color} border-transparent`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sugestão por palavra-chave — só quando não fechado */}
        {!fechado && sugestao && <CaixaSugestao sugestao={sugestao} />}

        {/* Histórico de mensagens */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Histórico
            <span className="ml-2 text-gray-400 font-normal">({messages.length})</span>
          </h3>
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhuma mensagem registrada ainda.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm
                    ${msg.direction === 'outbound'
                      ? 'bg-green-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === 'inbound' ? ' · cliente' : ' · você'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registrar mensagem */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Registrar mensagem</h3>
          <div className="flex gap-2">
            {(['inbound', 'outbound'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDirecao(d)}
                className={`flex-1 text-sm py-2 rounded-lg border font-medium transition-all
                  ${direcao === d
                    ? 'bg-green-500 text-white border-transparent'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
              >
                {d === 'inbound' ? '← Cliente falou' : '→ Você falou'}
              </button>
            ))}
          </div>
          <textarea
            value={novaMsg}
            onChange={e => setNovaMsg(e.target.value)}
            placeholder={direcao === 'inbound' ? 'O que o cliente disse?' : 'O que você disse?'}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={salvarMensagem}
            disabled={salvando || !novaMsg.trim()}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {salvando ? 'Salvando...' : 'Salvar mensagem'}
          </button>
        </div>

      </main>
    </div>
  )
}