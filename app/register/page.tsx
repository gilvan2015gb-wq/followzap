'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Register() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function criar() {
    setErro('')
    setSucesso('')

    if (!email.trim() || !senha.trim() || !confirmar.trim()) {
      setErro('Preencha todos os campos.')
      return
    }

    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha.trim(),
    })

    if (error) {
      setErro('Não foi possível criar a conta. Verifique o e-mail e tente novamente.')
      setCarregando(false)
      return
    }

    setSucesso('Conta criada com sucesso! Agora faça login.')
    setCarregando(false)

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  }

  function aoApertarEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter') criar()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-green-500 text-2xl">⚡</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Followzap</span>
          </div>
          <p className="text-sm text-gray-500">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 block">
              E-mail
            </label>
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
            <label className="text-xs font-semibold text-gray-500 block">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={aoApertarEnter}
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 block">
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              onKeyDown={aoApertarEnter}
              placeholder="Repita a senha"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2.5 text-sm">
              <span>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 rounded-lg px-3 py-2.5 text-sm">
              <span>✅</span>
              <span>{sucesso}</span>
            </div>
          )}

          <button
            onClick={criar}
            disabled={carregando}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Já tem uma conta?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-green-600 font-semibold hover:underline transition-colors"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  )
}