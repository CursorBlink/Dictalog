import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

const getSession = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  return auth.api.getSession({ headers })
})

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    // Merges into route context — accessible to all child routes via useRouteContext()
    return { user: session.user }
  },
  component: () => <Outlet />,
})
