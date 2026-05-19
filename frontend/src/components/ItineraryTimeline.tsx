'use client'

import { useCallback, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Clock, DollarSign, ExternalLink, Hotel, Loader2, MapPin, Navigation, Star, Sun, Cloud } from 'lucide-react'
import type { HotelInfo, ItineraryDay } from '@/types'
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

const PRICE_LABELS: Record<number, string> = {
  1: '经济',
  2: '舒适',
  3: '豪华',
}

export function ItineraryTimeline({ days, itineraryId, disabled }: { days: ItineraryDay[]; itineraryId?: number; disabled?: boolean }) {
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
        <DayBlock key={day.day_number} day={day} itineraryId={itineraryId} disabled={disabled} />
      ))}
    </div>
  )
}

function PriceLevel({ level }: { level: number }) {
  return (
    <span className="text-xs text-gray-400">
      {'¥'.repeat(level)}
    </span>
  )
}

function DayBlock({ day: initialDay, itineraryId, disabled }: { day: ItineraryDay; itineraryId?: number; disabled?: boolean }) {
  const [day, setDay] = useState(initialDay)
  const [selecting, setSelecting] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const selectHotel = useCallback(async (hotel: HotelInfo) => {
    if (!itineraryId || disabled) return
    setSelecting(true)
    try {
      const res = await fetch(`/api/v1/itineraries/${itineraryId}/days/${day.day_number}/select-hotel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel }),
      })
      const json = await res.json()
      if (json.code === 0) {
        setDay(prev => ({ ...prev, hotel }))
      }
    } catch {
      // ignore network errors
    }
    setSelecting(false)
  }, [itineraryId, day.day_number, disabled])

  const options = day.hotel_options ? [...day.hotel_options] : (day.hotel ? [day.hotel] : [])
  // Put selected hotel first when it came from the server (page load / refresh),
  // not when user just clicked to select — keeps list stable during interaction.
  const isInitialHotel = day.hotel?.name === initialDay.hotel?.name
  if (day.hotel && isInitialHotel) {
    const idx = options.findIndex(h => h.name === day.hotel!.name)
    if (idx > 0) {
      const [item] = options.splice(idx, 1)
      options.unshift(item)
    }
  }
  const selected = day.hotel
  const hasMultiple = options.length > 1

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
            <div className="absolute -left-[calc(2rem+5px)] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
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

        {/* Hotel Selection */}
        {options.length > 0 && (
          <div className="relative">
            <div className="absolute -left-[calc(2rem+5px)] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-500" />
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-gray-900">住宿推荐</span>
                </div>
                {selected && (
                  <div className="flex items-center gap-2">
                    <Badge variant="hotel">已选 {selected.name}</Badge>
                    {disabled && (
                      <a
                        href={`https://www.baidu.com/s?wd=${encodeURIComponent(selected.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        预订
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Options list */}
              <div className="space-y-2">
                {(hasMultiple && !showAll ? options.slice(0, 1) : options).map((hotel, idx) => {
                  const isSelected = selected?.name === hotel.name
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50 shadow-sm'
                          : disabled
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-white hover:border-amber-300 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!isSelected && !selecting && !disabled) {
                          selectHotel(hotel)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{hotel.name}</span>
                            {hotel.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-sm text-amber-600">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {hotel.rating}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-green-600 shrink-0" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {hotel.address ? <p><MapPin className="w-3 h-3 inline mr-0.5" />{hotel.address}</p> : null}
                            <p>
                              {hotel.cost_per_night > 0 ? `¥${hotel.cost_per_night}/晚` : ''}
                              {hotel.room_type ? ` · ${hotel.room_type}` : ''}
                              <span className="ml-1">
                                <PriceLevel level={hotel.price_level} />
                                <span className="ml-1 text-gray-400">{PRICE_LABELS[hotel.price_level] || ''}</span>
                              </span>
                            </p>
                          </div>
                          {hotel.note && (
                            <p className="text-xs text-gray-400 mt-1 italic">{hotel.note}</p>
                          )}
                        </div>
                        {!isSelected && !disabled && (
                          <button
                            disabled={selecting}
                            className="shrink-0 rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              selectHotel(hotel)
                            }}
                          >
                            {selecting ? <Loader2 className="w-3 h-3 animate-spin" /> : '选择'}
                          </button>
                        )}
                        {isSelected && !disabled && (
                          <span className="text-xs text-amber-600 font-medium">已选择</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Show more/less toggle */}
              {hasMultiple && options.length > 1 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-2 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                >
                  {showAll ? (
                    <>收起 <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>查看其他 {options.length - 1} 个选项 <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
