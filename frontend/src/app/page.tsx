'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { listItineraries, confirmItinerary, unconfirmItinerary } from '@/lib/api'
import type { Itinerary } from '@/types'

const CITY_IMAGES: Record<string, string> = {
  '北京': 'https://l-api.jd.com/relay-aigc/design/image/prompt/Forbidden%20City%20Beijing,%20ancient%20architecture,%20sunny%20day?width=512&height=512',
  '上海': 'https://l-api.jd.com/relay-aigc/design/image/prompt/Shanghai%20skyline,%20the%20Bund,%20Oriental%20Pearl%20Tower,%20sunny%20day?width=512&height=512',
  '桂林': 'https://l-api.jd.com/relay-aigc/design/image/prompt/Guilin%20landscape,%20beautiful%20mountains%20and%20river,%20boat,%20sunny%20day?width=512&height=512',
  '成都': 'https://l-api.jd.com/relay-aigc/design/image/prompt/Giant%20panda%20eating%20bamboo,%20cute,%20high%20quality?width=512&height=512',
}

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  draft: { text: '未启用', className: 'bg-[#F5F6F8] text-[#999]' },
  confirmed: { text: '待出发', className: 'bg-[#EAF2FF] text-[#2C68FF]' },
  completed: { text: '已完成', className: 'bg-[#E8F8E8] text-[#4FA15C]' },
  cancelled: { text: '已取消', className: 'bg-[#FFF0F0] text-[#FA5151]' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function getDestinationImage(destinations: { city_name: string }[]): string {
  if (!destinations?.length) return ''
  return CITY_IMAGES[destinations[0].city_name] || ''
}

function getDaysText(destinations: { city_name: string; days: number }[]): string {
  if (!destinations?.length) return ''
  const total = destinations.reduce((sum, d) => sum + d.days, 0)
  return `${total}天${total - 1}晚`
}

export default function HomePage() {
  const router = useRouter()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    setAnimIn(true)
    loadItineraries()
  }, [])

  async function loadItineraries() {
    try {
      const res = await listItineraries()
      setItineraries(res.data || [])
    } catch {
      // No backend available — show empty state
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(itinerary: Itinerary) {
    if (itinerary.status === 'confirmed') {
      // Toggle off — unconfirm
      try {
        await unconfirmItinerary(itinerary.id)
        setItineraries(prev =>
          prev.map(it =>
            it.id === itinerary.id ? { ...it, status: 'draft' as const } : it,
          ),
        )
      } catch {
        setItineraries(prev =>
          prev.map(it =>
            it.id === itinerary.id ? { ...it, status: 'draft' as const } : it,
          ),
        )
      }
      return
    }
    // Toggle on — confirm the draft, unconfirm all others
    try {
      await confirmItinerary(itinerary.id)
      setItineraries(prev =>
        prev.map(it => ({
          ...it,
          status: it.id === itinerary.id ? 'confirmed' as const : 'draft' as const,
        })),
      )
    } catch {
      // API not available, toggle UI anyway
      setItineraries(prev =>
        prev.map(it => ({
          ...it,
          status: it.id === itinerary.id ? 'confirmed' as const : 'draft' as const,
        })),
      )
    }
  }

  // Split plans — at most one confirmed shown as active, rest as list
  const confirmedPlans = itineraries.filter(it => it.status === 'confirmed')
  const otherPlans = itineraries.filter(it => it.status !== 'confirmed')
  const hasActivePlan = confirmedPlans.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div
      className={`w-full min-h-full bg-gradient-to-b from-[#EBF2FF] to-[#F5F6F8] transition-transform duration-300 ease-out ${
        animIn ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-[16px] pt-[44px] pb-[10px]">
          <div className="flex items-center space-x-[4px]">
            <i className="fas fa-map-marker-alt text-[#333] text-[16px]"></i>
            <span className="text-[#333] text-[16px] font-medium">我的旅行</span>
            <i className="fas fa-angle-down ml-[2px] text-[#999] text-[14px]"></i>
          </div>
          <div className="relative">
            <i className="fas fa-bell text-[#333] text-[20px]"></i>
            <div className="absolute -top-[2px] -right-[2px] w-[8px] h-[8px] bg-[#FF4142] rounded-full border-[1.5px] border-white"></div>
          </div>
        </div>

        <div className="px-[16px] pb-[20px]">
          {/* Hero */}
          <div className="mt-[8px] mb-[12px]">
            <div className="text-[22px] font-bold text-[#111] flex items-center">
              嗨，开启你的下一段旅程吧 <i className="fas fa-hand-paper text-[#FFC83D] ml-[4px]"></i>
            </div>
            <div className="text-[12px] text-[#666] mt-[2px]">
              AI 旅行管家陪你出行，规划、提醒、调整都帮你安排好
            </div>
          </div>

          {/* Create plan + Today reminder */}
          <div className="flex items-stretch space-x-[10px] mb-[16px] w-full h-[178px]">
            {/* Create plan button */}
            <div
              className="w-[95px] h-full bg-white rounded-[16px] py-[12px] px-[8px] flex flex-col items-center justify-center shadow-sm cursor-pointer shrink-0 hover:shadow-md transition-shadow"
              onClick={() => router.push('/plan/create')}
            >
              <div className="w-[36px] h-[36px] bg-[#2C68FF] rounded-full flex items-center justify-center mb-[10px] shadow-[0_4px_10px_rgba(44,104,255,0.3)]">
                <i className="fas fa-plus text-white text-[16px]"></i>
              </div>
              <div className="text-[13px] font-bold text-[#333] mb-[4px] whitespace-nowrap">创建计划</div>
              <div className="text-[10px] text-[#999] whitespace-nowrap">从零开始定制</div>
            </div>

            {/* Today reminder */}
            {hasActivePlan ? (
              <div className="flex-1 h-full min-w-0 bg-gradient-to-br from-[#FFF0F4] to-[#FFF5F7] rounded-[16px] p-[10px] flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-[8px] shrink-0">
                  <div className="flex items-center">
                    <span className="text-[14px] font-bold text-[#333] mr-[6px]">今日提醒</span>
                    <div className="bg-[#FA5151] text-white text-[10px] font-bold px-[5px] py-[1px] rounded-full flex items-center justify-center scale-90 origin-left">
                      3
                    </div>
                  </div>
                  <div
                    className="text-[10px] text-[#999] flex items-center cursor-pointer shrink-0"
                    onClick={() => router.push('/today-reminder')}
                  >
                    查看全部 <i className="fas fa-angle-right ml-[2px]"></i>
                  </div>
                </div>

                <div className="space-y-[6px] flex flex-col justify-start">
                  <div className="bg-white rounded-[10px] py-[6px] px-[8px] flex items-center shadow-sm shrink-0">
                    <div className="w-[20px] h-[20px] bg-gradient-to-br from-[#FA6C6C] to-[#F84B4B] rounded-full flex items-center justify-center mr-[8px] shrink-0">
                      <i className="far fa-clock text-white text-[10px]"></i>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
                      <div className="text-[12px] text-[#333] font-medium leading-tight truncate mb-[2px]">09:30 出发去{confirmedPlans[0]?.destinations?.[1]?.city_name || '景点'}</div>
                      <div className="text-[10px] text-[#999] leading-none truncate">距离出发还有 45 分钟</div>
                    </div>
                    <i className="fas fa-angle-right text-[#CCC] ml-[4px] shrink-0 text-[10px]"></i>
                  </div>

                  <div className="bg-white rounded-[10px] py-[6px] px-[8px] flex items-center shadow-sm shrink-0">
                    <div className="w-[20px] h-[20px] flex items-center justify-center mr-[8px] shrink-0">
                      <i className="fas fa-cloud-showers-heavy text-[#4A8CFF] text-[14px]"></i>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
                      <div className="text-[12px] text-[#333] font-medium leading-tight truncate mb-[2px]">{confirmedPlans[0]?.destinations?.[0]?.city_name || '目的地'}今日有雨</div>
                      <div className="text-[10px] text-[#999] leading-none truncate">气温 18~24°C，记得带伞哦</div>
                    </div>
                    <i className="fas fa-angle-right text-[#CCC] ml-[4px] shrink-0 text-[10px]"></i>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 h-full min-w-0 bg-white rounded-[16px] p-[10px] flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-[8px] shrink-0">
                  <div className="flex items-center">
                    <i className="fas fa-calendar-check text-[#2C68FF] text-[14px] mr-[4px]"></i>
                    <span className="text-[14px] font-bold text-[#333]">今日提醒</span>
                  </div>
                  <i className="fas fa-angle-right text-[#CCC] text-[10px]"></i>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center opacity-60">
                  <i className="fas fa-clipboard-list text-[#C5D9FF] text-[32px] mb-[8px]"></i>
                  <div className="text-[12px] text-[#666]">暂无行程提醒</div>
                  <div className="text-[10px] text-[#999]">您可以创建或查看行程</div>
                </div>
              </div>
            )}
          </div>

          {/* AI Concierge card */}
          <div className="w-full h-[210px] bg-gradient-to-br from-[#087BFF] to-[#64B5FF] rounded-[24px] relative overflow-hidden mb-[16px] shadow-[0_8px_20px_rgba(8,123,255,0.2)] flex flex-col p-[16px] pb-[14px]">
            <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0"></div>
            <div className="absolute right-[-45px] top-[10px] w-[200px] pointer-events-none z-0">
              <img
                src="https://img12.360buyimg.com/img/jfs/t1/432212/33/20093/1015967/6a0bf6b5F731a7d0d/02766004003f40be.png"
                alt="管家"
                className="w-full h-auto object-contain drop-shadow-md"
              />
            </div>
            <div className="relative z-10 w-[60%] mt-[4px]">
              <div className="text-[20px] font-bold text-white mb-[8px] leading-[1.2]">
                你的私人旅行管家
              </div>
              <div className="text-[14px] text-white/90 leading-snug">
                旅途中有任何问题，直接问我，我来帮你解决
              </div>
            </div>
            <div className="flex-1"></div>
            <div className="relative z-10 flex space-x-[8px] mb-[14px]">
              <div className="bg-white/90 backdrop-blur-sm text-[#126DFF] text-[12px] font-bold px-[10px] h-[32px] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] cursor-pointer">
                <i className="far fa-calendar-alt mr-[4px] text-[13px]"></i> 调整今日行程
              </div>
              <div className="bg-white/90 backdrop-blur-sm text-[#126DFF] text-[12px] font-bold px-[10px] h-[32px] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] cursor-pointer">
                <i className="fas fa-map-marker-alt mr-[4px] text-[13px]"></i> 查看路线
              </div>
            </div>
            <div
              className="relative z-10 bg-white rounded-full h-[44px] w-full flex items-center px-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] shrink-0 cursor-pointer"
              onClick={() => router.push('/plan/chat')}
            >
              <i className="far fa-comment-dots text-[#999] text-[16px] mr-[8px]"></i>
              <div className="flex-1 text-[#999] text-[13px]">问问旅行管家...</div>
              <div className="w-[28px] h-[28px] bg-[#126DFF] rounded-full flex items-center justify-center text-white ml-[8px] shadow-sm pointer-events-none">
                <i className="fas fa-paper-plane text-[12px] ml-[2px] mt-[1px]"></i>
              </div>
            </div>
          </div>

          {/* Travel plans section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-[12px]">
              <div className="text-[18px] font-bold text-[#333]">我的旅行计划</div>
              <button
                onClick={() => router.push('/itineraries')}
                className="text-[13px] text-[#999] flex items-center cursor-pointer hover:text-[#666]"
              >
                全部 <i className="fas fa-angle-right ml-[4px]"></i>
              </button>
            </div>

            {itineraries.length === 0 ? (
              <div className="bg-white rounded-[16px] p-[32px] flex flex-col items-center justify-center shadow-sm">
                <i className="fas fa-suitcase text-[#C5D9FF] text-[40px] mb-[12px]"></i>
                <div className="text-[14px] text-[#666] mb-[4px]">还没有旅行计划</div>
                <div className="text-[12px] text-[#999] mb-[16px]">点击上方「创建计划」开始你的第一次 AI 旅行规划</div>
                <button
                  onClick={() => router.push('/plan/create')}
                  className="bg-[#2C68FF] text-white text-[13px] font-bold px-[20px] h-[36px] rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(44,104,255,0.3)] cursor-pointer"
                >
                  <i className="fas fa-plus mr-[6px]"></i> 创建计划
                </button>
              </div>
            ) : (
              <div className="space-y-[12px]">
                {/* Confirmed plans first */}
                {confirmedPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isActive
                    onToggle={() => handleToggle(plan)}
                    onClick={() => router.push(`/itineraries/${plan.id}`)}
                  />
                ))}

                {/* Draft and other plans */}
                {otherPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isActive={false}
                    onToggle={() => handleToggle(plan)}
                    onClick={() => router.push(`/itineraries/${plan.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  isActive,
  onToggle,
  onClick,
}: {
  plan: Itinerary
  isActive: boolean
  onToggle: () => void
  onClick: () => void
}) {
  const statusInfo = STATUS_LABELS[plan.status] || { text: plan.status, className: 'bg-[#F5F6F8] text-[#999]' }
  const imgSrc = getDestinationImage(plan.destinations || [])
  const daysText = getDaysText(plan.destinations || [])
  const startDate = formatDate(plan.start_date)

  return (
    <div
      className="bg-white rounded-[14px] p-[12px] flex items-center border-[1.5px] border-transparent hover:border-[#2C68FF] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer relative"
      onClick={onClick}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={plan.destinations?.[0]?.city_name || ''}
          className="w-[72px] h-[54px] rounded-[8px] object-cover shrink-0 mr-[12px]"
        />
      ) : (
        <div className="w-[72px] h-[54px] rounded-[8px] bg-gradient-to-br from-[#EBF2FF] to-[#C5D9FF] shrink-0 mr-[12px] flex items-center justify-center">
          <i className="fas fa-map-marker-alt text-[#2C68FF] text-[20px]"></i>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-[6px]">
          <div className="flex items-center min-w-0">
            <span className="text-[16px] font-bold text-[#333] mr-[8px] truncate">{plan.title}</span>
            <span className={`text-[10px] px-[6px] py-[2px] rounded-[4px] shrink-0 ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>
          <div
            className={`w-[32px] h-[18px] rounded-full relative cursor-pointer transition-colors shrink-0 ml-[8px] ${
              isActive ? 'bg-[#2C68FF]' : 'bg-[#E5E5E5]'
            }`}
            onClick={e => {
              e.stopPropagation()
              onToggle()
            }}
          >
            <div
              className={`w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${
                isActive ? 'right-[2px]' : 'left-[2px]'
              }`}
            ></div>
          </div>
        </div>
        <div className="text-[12px] text-[#666] flex items-center mb-[6px]">
          <i className="far fa-calendar-alt mr-[4px]"></i>
          {startDate && `${startDate} 出发`}
          <span className="mx-[8px] text-[#E0E0E0]">|</span>
          <i className="far fa-clock mr-[4px]"></i>
          {daysText}
        </div>
        <div className="flex space-x-[8px] overflow-x-auto">
          {plan.destinations?.map((d, i) => (
            <span
              key={i}
              className="bg-[#F4F6FB] text-[#2C68FF] text-[11px] px-[8px] py-[2px] rounded-[4px] whitespace-nowrap"
            >
              {d.city_name} {d.days}天
            </span>
          ))}
          {plan.preferences?.interests?.slice(0, 2).map((interest, i) => (
            <span
              key={`i-${i}`}
              className="bg-[#F0F8FF] text-[#2BA3E6] text-[11px] px-[8px] py-[2px] rounded-[4px] whitespace-nowrap"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
