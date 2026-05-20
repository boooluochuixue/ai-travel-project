'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronRight, Loader2, MapPin, Route } from 'lucide-react'

import { listItineraries } from '@/lib/api'
import type { Itinerary } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

export default function ItineraryListPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItineraries()
  }, [])

  async function loadItineraries() {
    try {
      const res = await listItineraries()
      setItineraries(res.data || [])
    } catch {
      // No data available (no backend)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的行程</h1>
          <p className="text-gray-500 mt-1">共 {itineraries.length} 个行程</p>
        </div>
        <Link
          href="/plan/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <MapPin className="w-4 h-4" />
          新建行程
        </Link>
      </div>

      {itineraries.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Route className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">还没有行程</h3>
              <p className="text-gray-500 mb-4">开始你的第一次 AI 旅行规划吧</p>
              <Link
                href="/plan/create"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <MapPin className="w-4 h-4" />
                规划行程
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {itineraries.map(it => (
            <Link key={it.id} href={`/itineraries/${it.id}`}>
              <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{it.title}</h3>
                        <Badge variant={it.status}>{STATUS_LABELS[it.status] || it.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {it.destinations?.map(d => d.city_name).join(' + ')}
                        </span>
                        {it.total_budget && (
                          <span>预算 ¥{it.total_budget}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
