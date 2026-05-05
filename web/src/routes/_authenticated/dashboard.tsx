import { createFileRoute, useRouteContext } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useRouteContext({ from: '/_authenticated' })

  return <div>Hello, {user.name}!</div>
}
