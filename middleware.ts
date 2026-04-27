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

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const rotaProtegida = pathname.startsWith('/dashboard') || pathname.startsWith('/leads')
  const rotaDeAuth    = pathname === '/login' || pathname === '/register'

  // Não logado tentando acessar área protegida → vai para login
  if (!user && rotaProtegida) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logado tentando acessar login ou register → vai para dashboard
  if (user && rotaDeAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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