'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Compass } from 'lucide-react'
import { ItineraryForm } from '@/components/ItineraryForm'

export default function PlanCreatePage() {
  const router = useRouter()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        返回首页
      </button>

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
          <Compass className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 旅行规划</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          告诉我想去哪里，AI 自动为你生成完美的行程安排
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <ItineraryForm />
      </div>
    </div>
  )
}
