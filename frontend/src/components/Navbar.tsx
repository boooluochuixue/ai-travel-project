import Link from 'next/link'
import { Route } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Route className="w-5 h-5 text-blue-600" />
          <span>AI 旅行规划</span>
        </Link>
      </div>
    </nav>
  )
}
