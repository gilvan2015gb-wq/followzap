'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const supabase = createClient()

  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [erro, setErro]             = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha o e-mail e a senha.')
      return
    }

    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha.trim(),
    })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    // Reload completo para garantir que a sessão seja reconhecida
    window.location.href = '/dashboard'
  }

  function aoApertarEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter') entrar()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-green-500 text-2xl">⚡</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Followzap</span>
          </div>
          <p className="text-sm text-gray-500">Entre na sua conta para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={aoApertarEnter}
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={aoApertarEnter}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2.5 text-sm">
              <span>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          <button
            onClick={entrar}
            disabled={carregando}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

        </div>

        <p className="text-center text-xs text-gray-400">
          <a href="/" className="hover:text-gray-700 transition-colors">
            ← Voltar para o início
          </a>
        </p>

      </div>
    </div>
  )
}