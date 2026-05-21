'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { confirmItinerary, getItinerary } from '@/lib/api'
import type { HotelInfo, Itinerary, ItineraryDay, ItinerarySlot } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

export default function ItineraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [activeDay, setActiveDay] = useState(0)

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
      router.push('/')
    } catch {
      // handle error
    } finally {
      setConfirming(false)
    }
  }

  const destNames = itinerary?.destinations?.map(d => d.city_name).join('、') || ''
  const travelerStr = itinerary?.destinations?.map(d => `${d.city_name}${d.days}天`).join(' | ') || ''

  const totalBudget = itinerary?.total_budget || 0
  const budgetStr = totalBudget > 0 ? `¥${totalBudget.toLocaleString()}` : ''

  const currentDay: ItineraryDay | undefined = itinerary?.days?.[activeDay]
  const maxDayIdx = (itinerary?.days?.length || 1) - 1

  const daySlots = currentDay?.slots || []
  const dayHotel = currentDay?.hotel

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#5841F8] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">加载中...</span>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <i className="fas fa-map-marked-alt text-gray-300 text-2xl"></i>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">行程不存在</h2>
        <p className="text-sm text-gray-500">该行程可能已被删除</p>
        <button
          onClick={() => router.push('/')}
          className="h-10 px-6 bg-[#5841F8] text-white rounded-full text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white relative overflow-hidden">
      <div className="w-full h-full relative">
        {/* Top navigation */}
        <div className="absolute top-0 left-0 w-full h-[44px] flex items-center justify-between px-[16px] z-20 bg-gradient-to-b from-black/40 to-transparent">
          <i className="fas fa-chevron-left text-[20px] text-white cursor-pointer" onClick={() => router.back()}></i>
          <span className="text-[17px] font-medium text-white">行程方案</span>
          <div className="flex gap-[16px]">
            <i className="fas fa-external-link-alt text-[18px] text-white"></i>
            <i className="fas fa-ellipsis-h text-[20px] text-white"></i>
          </div>
        </div>

        <div className="w-full h-full flex flex-col">
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[120px]">
            {/* Header */}
            <RouteHeader
              cityName={destNames}
              startDate={itinerary.start_date}
              days={itinerary.days?.length || 0}
              travelers={travelerStr}
              budget={budgetStr}
            />

            <div className="bg-[#FAFAFC] min-h-screen">
              {/* Day tabs */}
              <RouteTabs
                days={itinerary.days || []}
                activeIdx={activeDay}
                onChange={setActiveDay}
              />

              {/* Map area */}
              {currentDay && (
                <RouteMapArea
                  hotel={dayHotel}
                  slots={daySlots}
                />
              )}

              {/* Timeline */}
              {currentDay && (
                <RouteTimeline
                  hotel={dayHotel}
                  slots={daySlots}
                />
              )}

              {!currentDay && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <i className="fas fa-calendar-day text-3xl"></i>
                  <span className="text-sm">暂无行程安排</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <RouteBottomBar
          totalBudget={totalBudget}
          budgetBreakdown={itinerary.budget_breakdown}
          status={itinerary.status}
          confirming={confirming}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  )
}

// ─── Sub-components ───

function RouteHeader({
  cityName,
  startDate,
  days,
  travelers,
  budget,
}: {
  cityName: string
  startDate: string | null
  days: number
  travelers: string
  budget: string
}) {
  const dateLabel = startDate
    ? (() => {
        const s = new Date(startDate)
        const e = new Date(s.getTime() + (days - 1) * 86400000)
        return `${s.getMonth() + 1}月${s.getDate()}日 - ${e.getMonth() + 1}月${e.getDate()}日`
      })()
    : `${days}天行程`

  return (
    <div className="relative w-full h-[140px] rounded-b-[24px] overflow-hidden shrink-0">
      <img
        src={`https://l-api.jd.com/relay-aigc/design/image/prompt/Beautiful%20landscape%20of%20${encodeURIComponent(cityName)}%20at%20sunset,%20traditional%20chinese%20architecture,%20highly%20detailed?width=750&height=360`}
        alt={cityName}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-[16px] text-white">
        <h1 className="text-[24px] font-bold leading-tight mb-[4px] shadow-sm">{cityName}</h1>
        <p className="text-[12px] opacity-90 mb-[8px] font-medium">
          {dateLabel} <span className="mx-[8px]">|</span> {travelers}
        </p>
        <div className="flex flex-row items-center gap-[12px]">
          <div className="flex items-center h-[20px] px-[8px] bg-black/30 backdrop-blur-md rounded-full text-[10px]">
            <span className="opacity-80 mr-[4px]">行程节奏</span>
            <span className="text-[#7C66F7] font-medium bg-white/90 px-[4px] py-[1px] rounded-[4px]">适中</span>
          </div>
          {budget && (
            <div className="flex items-center h-[20px] px-[8px] bg-black/30 backdrop-blur-md rounded-full text-[10px]">
              <span className="opacity-80 mr-[4px]">预算概览</span>
              <span className="font-medium">{budget}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RouteTabs({
  days,
  activeIdx,
  onChange,
}: {
  days: ItineraryDay[]
  activeIdx: number
  onChange: (idx: number) => void
}) {
  return (
    <div className="w-full px-[16px] py-[10px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex flex-row gap-[12px] min-w-max">
        {days.map((day, idx) => (
          <button
            key={day.day_number}
            onClick={() => onChange(idx)}
            className={`h-[30px] px-[16px] rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
              idx === activeIdx
                ? 'bg-gradient-to-r from-[#8B63F3] to-[#5841F8] text-white shadow-md'
                : 'bg-white text-[#333333] border-[1px] border-gray-100 shadow-sm'
            }`}
          >
            第{day.day_number}天
          </button>
        ))}
      </div>
    </div>
  )
}

function RouteMapArea({
  hotel,
  slots,
}: {
  hotel?: HotelInfo | null
  slots: ItinerarySlot[]
}) {
  return (
    <div className="w-full px-[16px] mb-[12px]">
      <div className="relative w-full bg-white rounded-[16px] shadow-sm overflow-hidden flex flex-col">
        <div className="relative w-full h-[140px]">
          <img
            src="https://l-api.jd.com/relay-aigc/design/image/prompt/GoogleMapTA?width=686&height=360"
            alt="地图概览"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />

          {/* SVG connections */}
          <div className="absolute inset-0 z-0">
            <svg className="w-full h-full" viewBox="0 0 343 180" preserveAspectRatio="none">
              <defs>
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#5841F8" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                </marker>
              </defs>
              {slots.length > 0 && (
                <>
                  <path d="M 65 85 Q 100 35 125 35" fill="none" stroke="#5841F8" strokeWidth="2" markerEnd="url(#arrow-blue)" />
                  {slots.length > 1 && (
                    <path d="M 125 35 Q 165 35 195 35" fill="none" stroke="#5841F8" strokeWidth="2" markerEnd="url(#arrow-blue)" />
                  )}
                  {slots.length > 2 && (
                    <path d="M 195 35 Q 260 40 260 95" fill="none" stroke="#5841F8" strokeWidth="2" markerEnd="url(#arrow-blue)" />
                  )}
                  {slots.length > 3 && (
                    <path d="M 260 95 L 305 95" fill="none" stroke="#5841F8" strokeWidth="2" markerEnd="url(#arrow-blue)" />
                  )}
                  <path d="M 305 105 Q 190 150 65 95" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="5 4" />
                </>
              )}
            </svg>
          </div>

          {/* Nodes */}
          <div className="absolute inset-0 z-10">
            <div className="absolute left-[45px] top-[50px] flex flex-col items-center">
              <div className="w-[22px] h-[22px] rounded-full bg-[#10B981] border-2 border-white text-white flex items-center justify-center text-[10px] shadow-md">
                <i className="fas fa-bed"></i>
              </div>
              <div className="mt-[4px] flex flex-col items-center">
                <span className="text-[12px] font-bold text-[#333] leading-tight">酒店</span>
                <span className="text-[10px] text-[#333] leading-tight">(起/终)</span>
                <span className="text-[10px] text-[#666] leading-tight mt-[2px]">
                  {slots[0]?.start_time || ''} / {slots[slots.length - 1]?.end_time || ''}
                </span>
              </div>
            </div>
            {slots.slice(0, 4).map((slot, idx) => {
              const positions = [
                { left: 110, top: 12 },
                { left: 180, top: 12 },
                { left: 245, top: 65 },
                { left: 300, top: 60 },
              ]
              const pos = positions[idx] || positions[positions.length - 1]
              return (
                <div key={idx} className="absolute flex flex-col items-center" style={{ left: pos.left, top: pos.top }}>
                  <div className="w-[22px] h-[22px] rounded-full bg-[#5841F8] border-2 border-white text-white flex items-center justify-center text-[12px] font-bold shadow-md">
                    {idx + 1}
                  </div>
                  <div className="mt-[4px] flex flex-col items-center">
                    <span className="text-[12px] font-bold text-[#333] leading-tight">{slot.poi_name}</span>
                    <span className="text-[10px] text-[#666] leading-tight mt-[2px]">{slot.start_time}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="absolute top-[12px] right-[12px] bg-white px-[10px] py-[4px] rounded-full flex items-center shadow-sm z-20 cursor-pointer">
            <span className="text-[11px] text-[#333] font-medium mr-[4px]">查看全图</span>
            <i className="fas fa-expand-arrows-alt text-[11px] text-[#333]"></i>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex justify-center items-center gap-[40px] pt-[8px] pb-[4px] bg-white z-20 relative">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center">
              <div className="w-[60px] h-[2px] bg-gradient-to-r from-[#806BFA] to-[#5841F8] relative mr-[10px]">
                <div className="absolute right-[-4px] top-[-3.5px] w-0 h-0 border-t-[4.5px] border-t-transparent border-b-[4.5px] border-b-transparent border-l-[6px] border-l-[#5841F8]"></div>
              </div>
              <span className="text-[12px] text-[#333] font-medium">去程</span>
            </div>
            <div className="flex items-center">
              <div className="w-[50px] h-[2px] border-b-[2px] border-dashed border-[#5FC896] relative mr-[10px]">
                <div className="absolute right-[-4px] top-[-3.5px] w-0 h-0 border-t-[4.5px] border-t-transparent border-b-[4.5px] border-b-transparent border-l-[6px] border-l-[#5FC896]"></div>
              </div>
              <span className="text-[12px] text-[#333] font-medium">返程</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full flex items-center justify-between text-[10px] text-[#666] pt-[4px] pb-[8px] px-[16px] border-t border-gray-100 bg-white">
          <div className="flex items-center gap-[4px]">
            <i className="fas fa-map-marker-alt text-[12px] text-[#999]"></i>
            <span>{slots.length} 个地点</span>
          </div>
          <div className="w-[1px] h-[10px] bg-[#E5E5E5]"></div>
          <div className="flex items-center gap-[4px]">
            <i className="fas fa-route text-[12px] text-[#999]"></i>
            <span>{slots.filter(s => s.transport_tip).length > 0 ? '步行+打车+地铁' : '步行'}</span>
          </div>
          <div className="w-[1px] h-[10px] bg-[#E5E5E5]"></div>
          <div className="flex items-center gap-[4px]">
            <i className="far fa-clock text-[12px] text-[#999]"></i>
            <span>约 {slots.reduce((acc, s) => acc + (s.duration || 0), 0)} 分钟</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function RouteTimeline({
  hotel,
  slots,
}: {
  hotel?: HotelInfo | null
  slots: ItinerarySlot[]
}) {
  if (!slots.length && !hotel) return null

  // Build timeline items: start from hotel, then each slot, then back to hotel
  const items: TimelineItemData[] = []

  // Depart from hotel
  items.push({
    time: slots[0]?.start_time || '08:00',
    isHotel: true,
    title: hotel ? `从${hotel.name}出发` : '从酒店出发',
    subtitle: '开启美好的一天',
    imagePrompt: 'luxury%20hotel%20room%20interior,%20bright%20morning%20light',
    tags: [],
    nextTrans: slots[0]?.transport_tip
      ? { text: parseTransportTip(slots[0]!.transport_tip), dist: '' }
      : undefined,
    isLast: false,
  })

  // Each slot
  slots.forEach((slot, idx) => {
    const isLast = idx === slots.length - 1
    items.push({
      time: slot.start_time || '',
      isHotel: false,
      title: slot.poi_name,
      subtitle: slot.note || slot.address || '',
      imagePrompt: encodeURIComponent(`${slot.poi_name},${destCityFallback(slot.poi_category)},high%20quality`),
      tags: [slot.poi_category ? categoryLabel(slot.poi_category) : ''].filter(Boolean),
      nextTrans: !isLast && slots[idx + 1]?.transport_tip
        ? { text: parseTransportTip(slots[idx + 1]!.transport_tip), dist: '' }
        : !isLast
          ? { text: '步行前往', dist: '' }
          : undefined,
      isLast: false,
    })
  })

  // Return to hotel
  const lastSlot = slots[slots.length - 1]
  items.push({
    time: lastSlot?.end_time || '19:00',
    isHotel: true,
    title: '返回酒店',
    subtitle: '结束一天行程，休息放松',
    imagePrompt: 'luxury%20hotel%20room%20interior,%20warm%20evening%20light',
    tags: [],
    nextTrans: undefined,
    isLast: true,
  })

  return (
    <div className="w-full flex flex-col pb-[20px]" data-ai-list="true">
      {items.map((item, index) => (
        <TimelineItem key={index} item={item} />
      ))}
    </div>
  )
}

interface TimelineItemData {
  time: string
  isHotel: boolean
  title: string
  subtitle: string
  imagePrompt: string
  tags: string[]
  nextTrans?: { text: string; dist: string }
  isLast: boolean
}

function TimelineItem({ item }: { item: TimelineItemData }) {
  const transportIcon = item.nextTrans?.text.includes('打车') ? 'car'
    : item.nextTrans?.text.includes('地铁') ? 'subway'
    : item.nextTrans?.text.includes('步行') ? 'walking'
    : 'car'

  return (
    <div className="relative w-full flex pl-[16px] pr-[16px] mb-[0px]">
      <div className="w-[60px] shrink-0 flex flex-col items-center relative">
        <div className="text-[14px] font-bold text-[#333] mt-[2px] w-full text-left">
          {item.time}
        </div>
        <div className="absolute left-[45px] top-[2px]">
          {item.isHotel ? (
            <div className="w-[22px] h-[22px] rounded-full bg-[#10B981] text-white flex items-center justify-center text-[11px] shadow-sm z-10 relative">
              <i className="fas fa-bed text-[11px]"></i>
            </div>
          ) : (
            <div className="w-[22px] h-[22px] rounded-full bg-[#5841F8] text-white flex items-center justify-center text-[11px] font-bold shadow-sm z-10 relative">
              {item.title[0]}
            </div>
          )}
        </div>
        {!item.isLast && (
          <div className="absolute left-[56px] top-[24px] bottom-[-20px] w-[2px] border-l-[2px] border-dotted border-[#D1D5DB] z-0"></div>
        )}
      </div>

      <div className="flex-1 ml-[12px] pb-[12px]">
        <div className="bg-white rounded-[12px] p-[10px] shadow-sm border border-gray-100 flex flex-row items-center">
          <img
            src={`https://l-api.jd.com/relay-aigc/design/image/prompt/${item.imagePrompt}?width=132&height=100`}
            alt={item.title}
            className="w-[66px] h-[50px] rounded-[8px] object-cover mr-[10px] shrink-0"
          />
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#333] mb-[2px]">{item.title}</h3>
              <i className="fas fa-ellipsis-v text-[#CCC] px-[4px]"></i>
            </div>
            <p className="text-[11px] text-[#666] mb-[4px] line-clamp-1">{item.subtitle}</p>
            {item.tags.length > 0 && (
              <div className="flex gap-[6px]">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="text-[9px] text-[#5841F8] bg-[#F1F0FE] px-[4px] py-[2px] rounded-[4px]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {!item.isLast && item.nextTrans && (
          <div className="h-[28px] flex flex-row items-center justify-center mt-[2px]">
            <div className="bg-[#F9F9FB] rounded-[16px] px-[12px] py-[2px] flex items-center text-[11px] text-[#666]">
              <i className={`fas fa-${transportIcon} mr-[6px] text-[#999]`}></i>
              <span>{item.nextTrans.text}</span>
              {item.nextTrans.dist && (
                <>
                  <span className="mx-[6px] text-[#D1D5DB]">|</span>
                  <span>{item.nextTrans.dist}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RouteBottomBar({
  totalBudget,
  budgetBreakdown,
  status,
  confirming,
  onConfirm,
}: {
  totalBudget: number
  budgetBreakdown: Record<string, number> | null
  status: string
  confirming: boolean
  onConfirm: () => void
}) {
  const [showBudgetDetail, setShowBudgetDetail] = useState(false)

  const budgetLabels: Record<string, string> = {
    transport: '交通',
    hotel: '住宿',
    food: '美食',
    tickets: '门票',
    other: '其他',
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-t-[20px] z-20">
      <div className="flex flex-col">
        {/* Budget row */}
        <div className="flex items-center justify-between px-[20px] py-[8px] border-b border-gray-100">
          <div className="flex items-center">
            <i className="fas fa-wallet text-[#333] mr-[8px] text-[14px]"></i>
            <span className="text-[12px] text-[#333] font-medium mr-[8px]">总预算</span>
            <span className="text-[14px] font-bold text-[#5841F8]">
              ¥{totalBudget.toLocaleString()}
            </span>
          </div>
          {budgetBreakdown && (
            <div
              className="flex items-center text-[10px] text-[#666] cursor-pointer"
              onClick={() => setShowBudgetDetail(!showBudgetDetail)}
            >
              <span className="mr-[4px]">{showBudgetDetail ? '收起' : '展开详情'}</span>
              <i className={`fas fa-chevron-${showBudgetDetail ? 'up' : 'down'} text-[9px]`}></i>
            </div>
          )}
        </div>

        {/* Budget detail */}
        {showBudgetDetail && budgetBreakdown && (
          <div className="px-[20px] py-[8px] border-b border-gray-50 bg-gray-50/50">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {Object.entries(budgetBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500">{budgetLabels[key] || key}</span>
                  <span className="text-[12px] font-semibold text-gray-800">
                    ¥{Number(value).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminder row */}
        <div className="flex items-center justify-between px-[20px] py-[8px] border-b border-gray-50">
          <div className="flex items-center">
            <i className="far fa-bell text-[#333] mr-[8px] text-[14px]"></i>
            <span className="text-[12px] text-[#333] font-medium mr-[8px]">出行提醒</span>
            <span className="text-[12px] text-[#666]">{status === 'draft' ? '行程尚未确认' : '已确认'}</span>
          </div>
          <i className="fas fa-chevron-right text-[11px] text-[#CCC]"></i>
        </div>
      </div>

      <div className="px-[16px] py-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] flex flex-row gap-[12px] bg-white">
        <button className="w-[120px] h-[48px] flex items-center justify-center bg-[#F5F6FA] text-[#333] rounded-full text-[16px] font-medium cursor-pointer shrink-0">
          <i className="fas fa-sliders-h mr-[6px]"></i>
          调整方案
        </button>
        {status === 'draft' && (
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 h-[48px] flex items-center justify-center bg-gradient-to-r from-[#8B63F3] to-[#5841F8] text-white rounded-full text-[16px] font-bold shadow-md cursor-pointer disabled:opacity-50"
          >
            {confirming ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-[6px]" /> 确认中...</>
            ) : (
              <><i className="fas fa-check-circle mr-[6px]"></i> 确认行程</>
            )}
          </button>
        )}
        {status !== 'draft' && (
          <div className="flex-1 h-[48px] flex items-center justify-center bg-green-50 text-green-700 rounded-full text-[15px] font-medium">
            <i className="fas fa-check-circle mr-[6px]"></i>
            {STATUS_LABELS[status] || status}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ───

function parseTransportTip(tip: string): string {
  // Extract concise transport info: "打车15分钟" or "步行 850m" etc.
  return tip.replace(/^建议/, '').trim() || tip
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    attraction: '景点',
    restaurant: '美食',
    shopping: '购物',
    entertainment: '娱乐',
    hotel: '住宿',
  }
  return map[cat] || cat
}

function destCityFallback(cat: string): string {
  const map: Record<string, string> = {
    attraction: 'scenic%20view',
    restaurant: 'delicious%20food',
    shopping: 'shopping%20street',
    entertainment: 'entertainment',
    hotel: 'hotel',
  }
  return map[cat] || 'travel'
}
