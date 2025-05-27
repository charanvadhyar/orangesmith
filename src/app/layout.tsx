import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Providers } from "@/providers";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', 
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OrangeSmith Luxury Jewelry',
  description: 'Discover exquisite luxury jewelry at OrangeSmith. Timeless elegance and craftsmanship for every occasion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <Providers>
          <div className="sticky top-0 z-50">
            <Navbar />
          </div>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
