export type Lead = {
  id: string
  user_id: string
  name: string
  phone: string
  status: 'novo' | 'em_atendimento' | 'fechado' | 'perdido'
  last_message: string | null
  last_interaction: string
  created_at: string
}

export type Message = {
  id: string
  lead_id: string
  content: string
  direction: 'inbound' | 'outbound'
  created_at: string
}