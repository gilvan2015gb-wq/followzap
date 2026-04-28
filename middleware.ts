import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession lê o cookie direto — funciona no edge runtime
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  const rotaProtegida = pathname.startsWith('/dashboard') ||
                        pathname.startsWith('/leads')
  const rotaDeAuth    = pathname === '/login' ||
                        pathname === '/register'

  // Sem sessão tentando entrar em área protegida
  if (!session && rotaProtegida) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Com sessão tentando acessar login/register
  if (session && rotaDeAuth) {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/login',
    '/register',
  ],
}