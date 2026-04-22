import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if this is an admin route (but not the login page)
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isApiAdminRoute = pathname.startsWith('/api/admin')

  if (isAdminRoute || isApiAdminRoute) {
    if (!user) {
      if (isApiAdminRoute) {
        return NextResponse.json(
          { error: 'Unauthorized — sign in with an admin account.' },
          { status: 401 }
        )
      }
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check if user is an active admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active, role')
      .eq('id', user.id)
      .single()

    if (!adminUser || !adminUser.is_active) {
      if (isApiAdminRoute) {
        return NextResponse.json(
          { error: 'Forbidden — admin role required.' },
          { status: 403 }
        )
      }
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'not_admin')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
