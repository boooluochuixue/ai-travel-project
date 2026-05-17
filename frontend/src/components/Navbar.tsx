'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Route, MapPin, List } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Route className="w-5 h-5 text-blue-600" />
          <span>AI 旅行规划</span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/" active={pathname === '/'}>
            <MapPin className="w-4 h-4" />
            规划行程
          </NavLink>
          <NavLink href="/itineraries" active={pathname.startsWith('/itineraries')}>
            <List className="w-4 h-4" />
            我的行程
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}
