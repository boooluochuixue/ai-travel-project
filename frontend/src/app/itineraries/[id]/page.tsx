'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, DollarSign, Loader2, MapPin, RefreshCw } from 'lucide-react'

import { confirmItinerary, getItinerary } from '@/lib/api'
import type { Itinerary } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ItineraryTimeline } from '@/components/ItineraryTimeline'

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

export default function ItineraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    loadItinerary()
  }, [id])

  async function loadItinerary() {
    try {
      const res = await getItinerary(Number(id))
      setItinerary(res.data)
    } catch {
      // not found
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!itinerary) return
    setConfirming(true)
    try {
      await confirmItinerary(itinerary.id)
      setItinerary({ ...itinerary, status: 'confirmed' })
    } catch {
      // handle error
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">行程不存在</h2>
        <p className="text-gray-500 mb-4">该行程可能已被删除</p>
        <Link href="/itineraries" className="text-blue-600 hover:underline">
          返回行程列表
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/itineraries"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{itinerary.title}</h1>
          <Badge variant={itinerary.status}>
            {STATUS_LABELS[itinerary.status] || itinerary.status}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {itinerary.destinations?.map(d => `${d.city_name} ${d.days}天`).join(' | ')}
          </span>
          {itinerary.total_budget && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              预算 ¥{itinerary.total_budget.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          {itinerary.status === 'draft' && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {confirming ? '确认中...' : '确认行程'}
            </button>
          )}
        </div>
      </div>

      {/* Budget breakdown */}
      {itinerary.budget_breakdown && (
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">预算分配</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(itinerary.budget_breakdown).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ¥{Number(value).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {BUDGET_LABELS[key] || key}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <ItineraryTimeline days={itinerary.days} itineraryId={itinerary.id} disabled={itinerary.status !== 'draft'} />
    </div>
  )
}

const BUDGET_LABELS: Record<string, string> = {
  transport: '交通',
  hotel: '住宿',
  food: '美食',
  tickets: '门票',
  other: '其他',
}
