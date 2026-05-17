'use client'

import { Clock, DollarSign, Sun, Cloud, Navigation } from 'lucide-react'
import type { ItineraryDay } from '@/types'
import { Badge } from './ui/Badge'

const SLOT_LABELS: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}

const CATEGORY_LABELS: Record<string, string> = {
  attraction: '景点',
  restaurant: '美食',
  shopping: '购物',
  entertainment: '娱乐',
  hotel: '住宿',
}

export function ItineraryTimeline({ days }: { days: ItineraryDay[] }) {
  if (!days || days.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无行程安排
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {days.map(day => (
        <DayBlock key={day.day_number} day={day} />
      ))}
    </div>
  )
}

function DayBlock({ day }: { day: ItineraryDay }) {
  return (
    <div className="relative">
      {/* Day header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
            {day.day_number}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">第 {day.day_number} 天</h3>
            {day.weather_forecast && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                <Cloud className="w-3.5 h-3.5" />
                {day.weather_forecast.weather as string || '未知'}
                <span className="text-gray-300">|</span>
                <Sun className="w-3.5 h-3.5" />
                {day.weather_forecast.temp_min as string}°~{day.weather_forecast.temp_max as string}°
              </div>
            )}
          </div>
        </div>
        {day.notes && <p className="mt-2 text-sm text-gray-600 ml-16">{day.notes}</p>}
      </div>

      {/* Timeline */}
      <div className="relative ml-6 pl-8 border-l-2 border-gray-200 space-y-6">
        {day.slots.map((slot, idx) => (
          <div key={idx} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[calc(2rem+5px)] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />

            {/* Slot card */}
            <div className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={slot.slot_type}>
                      {SLOT_LABELS[slot.slot_type] || slot.slot_type}
                    </Badge>
                    <Badge variant={slot.poi_category}>
                      {CATEGORY_LABELS[slot.poi_category] || slot.poi_category}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900">{slot.poi_name}</h4>
                  {slot.address && (
                    <p className="text-sm text-gray-500 mt-0.5">{slot.address}</p>
                  )}
                  {slot.note && (
                    <p className="text-sm text-gray-600 mt-1">{slot.note}</p>
                  )}
                </div>

                <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                  {slot.start_time && slot.end_time && (
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.start_time} - {slot.end_time}</span>
                    </div>
                  )}
                  {slot.cost !== null && slot.cost !== undefined && slot.cost > 0 && (
                    <div className="flex items-center gap-1 justify-end">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>约 ¥{slot.cost}</span>
                    </div>
                  )}
                </div>
              </div>

              {slot.transport_tip && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 border-t border-gray-100 pt-2">
                  <Navigation className="w-3 h-3" />
                  <span>{slot.transport_tip}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
