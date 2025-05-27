import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create an Account | OrangeSmith Luxury Jewelry',
  description: 'Join OrangeSmith to enjoy personalized shopping experiences, quick checkout, order tracking, and exclusive access to our luxury jewelry collection.',
}

export default function RegisterPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <nav className="mb-8 text-sm text-slateGray">
        <Link href="/" className="hover:text-vividOrange">Home</Link>
        <span className="mx-2">/</span>
        <span>Create Account</span>
      </nav>
      
      <RegisterForm />
    </div>
  )
}
