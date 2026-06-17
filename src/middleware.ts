import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session'ı tazele ve kullanıcıyı al (güvenli yöntem)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Eğer kullanıcı giriş yapmamışsa ve korumalı bir sayfaya erişmek istiyorsa login'e yönlendir
  if (!user) {
    if (pathname.startsWith('/panel') || pathname.startsWith('/admin')) {
      const loginUrl = new URL('/login', request.url)
      // Kullanıcının gitmek istediği sayfayı redirect parametresi olarak ekleyelim
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } else {
    // Kullanıcı giriş yapmışsa ve /login sayfasına gitmek istiyorsa /panel'e yönlendir
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/panel', request.url))
    }

    // Admin sayfalarına erişim kontrolü (Sadece super_admin veya brand_owner rolleri)
    if (pathname.startsWith('/admin')) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const allowedRoles = ['super_admin', 'brand_owner']
      if (!roleData || !allowedRoles.includes(roleData.role)) {
        // Yetkisiz erişim durumunda ana panele yönlendir
        return NextResponse.redirect(new URL('/panel', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, sounds etc. (static public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
}
