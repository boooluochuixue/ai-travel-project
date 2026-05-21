'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { getItinerary, listItineraries } from '@/lib/api'
import type { Itinerary } from '@/types'

interface ChatMessage {
  id: number
  type: 'user' | 'system_text' | 'system_card'
  text?: string
  time: string
  isAnimating: boolean
  avatar?: string
}

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeItinerary, setActiveItinerary] = useState<Itinerary | null>(null)
  const [lastCardData, setLastCardData] = useState<{ before: string[]; after: string[]; note: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const destCity = activeItinerary?.destinations?.[0]?.city_name || searchParams.get('destCity') || '杭州'
  const totalDays = activeItinerary?.destinations?.reduce((s, d) => s + d.days, 0) || Number(searchParams.get('days')) || 5
  const nights = totalDays > 1 ? totalDays - 1 : 0

  useEffect(() => {
    loadActiveItinerary()
  }, [])

  async function loadActiveItinerary() {
    try {
      const res = await listItineraries()
      const plans = res.data || []
      const confirmed = plans.find(p => p.status === 'confirmed')
      if (confirmed) {
        // Fetch full detail with days/slots
        const detail = await getItinerary(confirmed.id)
        setActiveItinerary(detail.data)
      }
    } catch {
      // no backend, show defaults
    }
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    const now = new Date()
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const userText = inputValue.trim()

    const newMessage: ChatMessage = {
      id: Date.now(),
      text: userText,
      time: timeString,
      isAnimating: true,
      type: 'user',
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, isAnimating: false } : msg
      ))
    }, 300)

    // Generate adjustment card data from actual itinerary
    function buildCardFromItinerary(): { text: string; before: string[]; after: string[]; note: string } | null {
      const slots = activeItinerary?.days?.[0]?.slots
      if (!slots || slots.length === 0) return null

      const poiNames = slots.map(s => s.poi_name)

      if (userText === '我有点累了，下午想轻松点') {
        return {
          text: '当然可以！我帮你调整了下午的行程，让节奏更轻松，您可以参考下面的方案：',
          before: poiNames,
          after: poiNames.length > 2
            ? [poiNames[0], '酒店休息', ...poiNames.slice(2, poiNames.length - 1)]
            : [poiNames[0], '酒店休息'],
          note: '调整了部分行程，增加休息时间，下午节奏更轻松。',
        }
      }

      if (userText === '明天行程太满了，想轻松一些') {
        return {
          text: '好的！已为你调整明天的安排，去掉了一些紧凑的景点，替换为更放松的活动：',
          before: poiNames,
          after: poiNames.length > 3
            ? poiNames.slice(0, 2).concat('自由活动休息')
            : poiNames.slice(0, Math.max(1, poiNames.length - 1)),
          note: `减少了${poiNames.length - (poiNames.length > 3 ? 3 : poiNames.length - 1)}个景点，节奏更舒缓。`,
        }
      }

      return null
    }

    const cardData = buildCardFromItinerary()

    if (cardData) {
      setTimeout(() => {
        const sysTime = new Date()
        const sysTimeString = `${String(sysTime.getHours()).padStart(2, '0')}:${String(sysTime.getMinutes()).padStart(2, '0')}`

        const sysTextMsg: ChatMessage = {
          id: Date.now() + 1,
          type: 'system_text',
          text: cardData.text,
          time: sysTimeString,
          isAnimating: true,
        }

        const sysCardMsg: ChatMessage = {
          id: Date.now() + 2,
          type: 'system_card',
          time: sysTimeString,
          isAnimating: true,
        }

        setMessages(prev => [...prev, sysTextMsg, sysCardMsg])
        setLastCardData({ before: cardData.before, after: cardData.after, note: cardData.note })

        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            (msg.id === sysTextMsg.id || msg.id === sysCardMsg.id) ? { ...msg, isAnimating: false } : msg
          ))
        }, 300)
      }, 1000)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="w-full min-h-screen bg-[#F4F6F9] flex flex-col">
      <div className="max-w-3xl mx-auto w-full relative flex flex-col min-h-screen">
        <style jsx>{`
          @keyframes slideUpFadeIn {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .bubble-enter {
            animation: slideUpFadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
        `}</style>

        {/* Top nav */}
        <div className="flex-shrink-0 pt-[44px] pb-[12px] px-[16px] flex items-center justify-between bg-gradient-to-b from-[#EAEFFF] to-transparent">
          <div className="flex items-center cursor-pointer" onClick={() => router.back()}>
            <i className="fas fa-chevron-left text-[#333] text-[18px] w-[24px] h-[24px] flex items-center justify-center"></i>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-[12px]">
            <h1 className="text-[18px] font-bold text-[#333] leading-[25px]">智能旅行管家</h1>
            <p className="text-[12px] text-[#666] mt-[2px]">
              {activeItinerary ? `${destCity} ${totalDays}天${nights}晚 | Day 1 · 探索日` : '选择一个行程开始吧'}
            </p>
          </div>
          <div className="w-[32px] h-[32px] bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <i className="fas fa-magic text-[#5575FF] text-[14px]"></i>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-[16px] pb-[120px] pt-[8px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Current itinerary card — only show when there's a confirmed (待出发) plan */}
          {activeItinerary && (() => {
            const firstDay = activeItinerary.days?.[0]
            const slots = firstDay?.slots
            const hasSlots = slots && slots.length > 0
            const current = hasSlots ? slots![0] : null
            const next = hasSlots && slots!.length > 1 ? slots![1] : null

            return (
            <div className="w-full bg-white rounded-[20px] py-[6px] px-[16px] mb-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center px-[6px] py-[2px] bg-[#EBF0FF] rounded-[4px] text-[10px] font-medium text-[#5575FF] mb-[2px]">
                  当前行程
                </div>

                {hasSlots ? (
                  <div className="flex">
                    {/* Current stop */}
                    <div className="flex-1">
                      <div className="flex items-center mb-[2px]">
                        <div className="w-[16px] h-[16px] bg-[#EBF0FF] rounded-full flex items-center justify-center mr-[6px]">
                          <div className="w-[8px] h-[8px] bg-[#5575FF] rounded-full"></div>
                        </div>
                        <span className="text-[16px] font-bold text-[#333]">{current!.poi_name}</span>
                      </div>
                      {current!.start_time && (
                        <div className="text-[13px] font-medium text-[#5575FF] ml-[22px]">
                          {current!.start_time}{current!.end_time ? `-${current!.end_time}` : ''}
                        </div>
                      )}
                    </div>

                    {next && (
                      <>
                        <div className="w-[2px] h-[24px] border-l-[2px] border-dashed border-[#DDE5FF] mx-[16px] mt-[4px]"></div>
                        {/* Next stop */}
                        <div className="flex-1 pt-[2px]">
                          <div className="text-[11px] text-[#666] mb-[2px]">下一站</div>
                          <div className="text-[14px] font-bold text-[#333] mb-[2px]">{next.poi_name}</div>
                          {next.transport_tip && (
                            <div className="flex items-center text-[10px] text-[#999]">
                              <i className="fas fa-walking mr-[4px] text-[12px]"></i>
                              {next.transport_tip}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="w-[16px] h-[16px] bg-[#EBF0FF] rounded-full flex items-center justify-center mr-[6px]">
                      <div className="w-[8px] h-[8px] bg-[#5575FF] rounded-full"></div>
                    </div>
                    <span className="text-[16px] font-bold text-[#333]">
                      {activeItinerary.title || activeItinerary.destinations?.map(d => d.city_name).join('、')}
                    </span>
                  </div>
                )}

                <div className="mt-[4px]">
                  <button className="h-[26px] px-[16px] bg-[#5575FF] rounded-full text-white text-[12px] font-medium flex items-center justify-center shadow-[0_2px_8px_rgba(85,117,255,0.3)]">
                    查看路线
                    <i className="fas fa-angle-right ml-[4px] text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
            )
          })()}

          {/* Quick actions */}
          <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md rounded-[16px] py-[8px] px-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex justify-between items-center mb-[16px]">
            <div className="flex flex-col items-center flex-1 cursor-pointer">
              <i className="fas fa-calendar-alt text-[#6A7BFF] text-[18px] mb-[2px]"></i>
              <span className="text-[11px] text-[#666]">调整行程</span>
            </div>
            <div className="w-[1px] h-[16px] bg-[#EEEEEE]"></div>
            <div className="flex flex-col items-center flex-1 cursor-pointer">
              <i className="fas fa-bus text-[#00C6FF] text-[18px] mb-[2px]"></i>
              <span className="text-[11px] text-[#666]">下一站怎么去</span>
            </div>
            <div className="w-[1px] h-[16px] bg-[#EEEEEE]"></div>
            <div className="flex flex-col items-center flex-1 cursor-pointer">
              <i className="fas fa-utensils text-[#FF9E00] text-[18px] mb-[2px]"></i>
              <span className="text-[11px] text-[#666]">附近吃什么</span>
            </div>
            <div className="w-[1px] h-[16px] bg-[#EEEEEE]"></div>
            <div className="flex flex-col items-center flex-1 cursor-pointer">
              <i className="fas fa-cloud-sun text-[#3BA0FF] text-[18px] mb-[2px]"></i>
              <span className="text-[11px] text-[#666]">天气提醒</span>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex flex-col gap-[16px] w-full">
            {messages.map((msg) => {
              if (msg.type === 'user') {
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end justify-end w-full ${msg.isAnimating ? 'bubble-enter' : ''}`}
                  >
                    <div className="bg-[#EAEFFF] text-[#333] text-[14px] leading-[20px] px-[16px] py-[12px] rounded-[16px] rounded-br-[4px] shadow-[0_2px_8px_rgba(85,117,255,0.05)] relative flex items-end gap-[8px] max-w-[85%]">
                      <span>{msg.text}</span>
                      <div className="flex items-center gap-[4px] shrink-0 text-[#999]">
                        <span className="text-[10px] leading-[1]">{msg.time}</span>
                        <i className="fas fa-check-double text-[#5575FF] text-[10px]"></i>
                      </div>
                    </div>
                  </div>
                )
              } else if (msg.type === 'system_text') {
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start w-full gap-[8px] ${msg.isAnimating ? 'bubble-enter' : ''}`}
                  >
                    <img
                      src="https://img12.360buyimg.com/img/jfs/t1/431920/12/16292/39259/6a0dd311Ffd787f04/02760a20ba3a4c9d.png"
                      alt="avatar"
                      className="w-[36px] h-[36px] rounded-full shrink-0 object-cover"
                    />
                    <div className="bg-white text-[#333] text-[13px] leading-[18px] px-[10px] py-[8px] rounded-[16px] rounded-tl-[4px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] max-w-[75%] relative flex flex-col items-end">
                      <span className="self-start">{msg.text}</span>
                      <span className="text-[10px] leading-[1] text-[#999] mt-[2px]">{msg.time}</span>
                    </div>
                  </div>
                )
              } else if (msg.type === 'system_card') {
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start w-full pl-[44px] ${msg.isAnimating ? 'bubble-enter' : ''}`}
                  >
                    <div className="w-full bg-white rounded-[16px] p-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-[6px] mb-[6px]">
                        <i className="fas fa-magic text-[#6A7BFF] text-[12px]"></i>
                        <span className="text-[14px] font-bold text-[#333]">调整建议</span>
                      </div>

                      <div className="flex items-stretch gap-[6px] mb-[6px]">
                        {/* Before */}
                        <div className="flex-1 bg-[#F5F7FF] rounded-[12px] p-[6px]">
                          <div className="text-[12px] text-[#5575FF] font-medium mb-[6px]">调整前</div>
                          <div className="flex flex-col gap-[4px]">
                            {(lastCardData?.before || ['灵隐寺', '河坊街', '返回酒店']).map((name, i) => (
                              <div key={i}>
                                {i > 0 && <div className="ml-[7px] w-[2px] h-[10px] border-l border-dashed border-[#B0BFFF]"></div>}
                                <div className="flex items-center gap-[6px]">
                                  <div className="w-[16px] h-[16px] rounded-full border border-[#5575FF] text-[#5575FF] text-[10px] flex items-center justify-center">
                                    {i + 1}
                                  </div>
                                  <span className="text-[13px] text-[#333]">{name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="w-[16px] flex items-center justify-center">
                          <i className="fas fa-arrow-right text-[#B0BFFF] text-[14px]"></i>
                        </div>

                        {/* After */}
                        <div className="flex-1 bg-[#F5FFF9] rounded-[12px] p-[6px]">
                          <div className="text-[12px] text-[#00B464] font-medium mb-[6px]">调整后</div>
                          <div className="flex flex-col gap-[4px]">
                            {(lastCardData?.after || ['灵隐寺', '酒店休息', '西湖音乐喷泉']).map((name, i) => (
                              <div key={i}>
                                {i > 0 && <div className="ml-[7px] w-[2px] h-[10px] border-l border-dashed border-[#8CE2B9]"></div>}
                                <div className="flex items-center gap-[6px]">
                                  <div className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-[10px] ${i === 0 ? 'border border-[#00B464] text-[#00B464]' : 'bg-[#00B464] text-white'}`}>
                                    {i + 1}
                                  </div>
                                  <span className="text-[13px] text-[#333]">{name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-[6px] mb-[8px]">
                        <i className="fas fa-info-circle text-[#6A7BFF] text-[12px]"></i>
                        <span className="text-[12px] text-[#333]">{lastCardData?.note || '减少步行与连续活动，下午节奏更轻松。'}</span>
                      </div>

                      <div className="flex items-center gap-[10px]">
                        <button className="flex-1 h-[26px] rounded-full border border-[#5575FF] text-[#5575FF] text-[12px] font-medium flex items-center justify-center">
                          查看原因
                        </button>
                        <button className="flex-1 h-[26px] rounded-full bg-[#5575FF] text-white text-[12px] font-medium flex items-center justify-center gap-[4px]">
                          <i className="fas fa-magic text-[10px]"></i>
                          应用到行程
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom input */}
        <form
          onSubmit={handleSend}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-white px-[16px] py-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] flex items-center z-50 rounded-t-[16px] shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
        >
          <div className="w-[40px] h-[40px] bg-[#F5F7FF] rounded-full flex items-center justify-center mr-[12px] flex-shrink-0 cursor-pointer">
            <i className="fas fa-microphone text-[#5575FF] text-[16px]"></i>
          </div>
          <div className="flex-1 bg-[#F5F7FF] rounded-full h-[40px] flex items-center px-[16px] mr-[12px]">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="旅途中有问题，直接问我"
              className="flex-1 bg-transparent text-[14px] text-[#333] placeholder-[#999] border-none outline-none focus:ring-0 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className={`w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
              inputValue.trim()
                ? 'bg-[#5575FF] shadow-[0_2px_8px_rgba(85,117,255,0.4)]'
                : 'bg-[#EBF0FF]'
            }`}
          >
            <i className={`fas fa-paper-plane text-[14px] ${inputValue.trim() ? 'text-white' : 'text-[#999]'} -ml-[2px]`}></i>
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <ChatPageContent />
    </Suspense>
  )
}
