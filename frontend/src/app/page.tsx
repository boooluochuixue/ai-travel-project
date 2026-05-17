import { Compass } from 'lucide-react'
import { ItineraryForm } from '@/components/ItineraryForm'

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
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
