'use client'

import { useUser, UserButton as ClerkUserButton, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function UserButton() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect">
        <button className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-sm font-semibold hover:bg-white/80 transition-colors">
          Sign in
        </button>
      </SignInButton>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-sm font-semibold hover:bg-white/80 transition-colors"
      >
        My Progress
      </Link>
      <ClerkUserButton />
    </div>
  )
}
