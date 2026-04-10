import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <SignUp />
      <p className="text-xs text-gray-400 text-center max-w-xs">
        By signing up you agree to our{' '}
        <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        We&apos;ll only email you to confirm class attendance.
      </p>
    </div>
  )
}
