'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-xl">⚡</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Followzap</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Entrar →
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xl mx-auto space-y-8">

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Demo disponível agora
          </span>

          {/* Título */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Nunca mais perca um cliente{' '}
              <span className="text-green-500">por falta de resposta.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Organize seus leads, receba alertas de clientes parados e use mensagens prontas para vender mais pelo WhatsApp.
            </p>
          </div>

          {/* Benefícios */}
          <ul className="flex flex-col items-center gap-2.5 text-sm text-gray-600">
            {[
              { icon: '📋', text: 'Organize seus leads em um só lugar' },
              { icon: '⚠️', text: 'Recupere clientes parados com alertas automáticos' },
              { icon: '💬', text: 'Venda mais com mensagens prontas para copiar' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-green-100"
            >
              Entrar na demo →
            </button>
            <p className="text-xs text-gray-400">
              Sem cadastro. Sem cartão. Só testar.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Followzap · Feito para vendedores de WhatsApp
      </footer>

    </div>
  )
}