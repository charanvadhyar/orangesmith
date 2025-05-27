'use client'

import { ReactNode } from 'react'
import HomepageDebug from './diagnostics/HomepageDebug'

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV !== 'production' && <HomepageDebug />}
    </>
  )
}
