import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | OrangeSmith Luxury Jewelry',
  description: 'Sign in to your OrangeSmith account to view orders, manage your profile, and shop our luxury jewelry collection.',
}

export default function LoginPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <nav className="mb-8 text-sm text-slateGray">
        <Link href="/" className="hover:text-vividOrange">Home</Link>
        <span className="mx-2">/</span>
        <span>Login</span>
      </nav>
      
      <LoginForm />
    </div>
  )
}
