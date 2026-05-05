import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/sign-out')({
  component: SignOut,
})

function SignOut() {
  const navigate = useNavigate()

  useEffect(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate({ to: '/login' }),
      },
    })
  }, [navigate])

  return null
}
