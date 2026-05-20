'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { generateItinerary, streamGeneration } from '@/lib/api'

const FILTER_OPTIONS = ['近景点', '高评分', '含早餐', '双床房', '免费取消']

const HOTEL_DATA: Record<string, Hotel[]> = {
  default: [
    {
      id: 1, name: '桔子水晶酒店(桂林两江四湖象鼻山店)',
      type: '高档型', score: '4.9',
      location: '两江四湖附近 | 距离象鼻山步行约8分钟',
      reason: '距离你已选的景点较近，步行可达多个景点，适合轻松Citywalk。',
      tags: ['近景点', '含早餐', '双床房', '免费取消'],
      price: null, isRecommend: true,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Modern%20hotel%20room%20interior,%20large%20window,%20comfortable%20bed,%20warm%20lighting?width=512&height=512',
    },
    {
      id: 2, name: '桂林香格里拉大酒店',
      type: '豪华型', score: '4.8',
      location: '正阳步行街商圈 | 距离象鼻山约10分钟车程',
      reason: '临近市中心，周边餐饮商圈丰富，交通便利。',
      tags: ['近商圈', '高评分', '含早餐', '免费取消'],
      price: '658', isRecommend: false,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Luxury%20hotel%20room,%20elegant%20design,%20city%20view,%20daylight?width=512&height=512',
    },
    {
      id: 3, name: '桂林维景国际大酒店',
      type: '舒适型', score: '4.7',
      location: '万象城商圈 | 距离象鼻山约15分钟车程',
      reason: '性价比高，房间宽敞明亮，适合家庭或多人出行。',
      tags: ['含早餐', '双床房', '免费取消', '停车场'],
      price: '398', isRecommend: false,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Comfortable%20hotel%20room%20with%20twin%20beds,%20bright%20and%20clean?width=512&height=512',
    },
    {
      id: 4, name: '漓江泊隐酒店(桂林两江四湖店)',
      type: '精品型', score: '4.7',
      location: '两江四湖景区内 | 距离象鼻山步行约12分钟',
      reason: '景区内特色中式庭院酒店，环境清幽，适合追求体验感的旅行者。',
      tags: ['近景点', '高评分', '免费取消', '独栋庭院'],
      price: '520', isRecommend: false,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Chinese%20style%20boutique%20hotel%20room,%20wooden%20furniture,%20courtyard%20view?width=512&height=512',
    },
  ],
  成都: [
    {
      id: 1, name: '成都春熙路亚朵酒店',
      type: '高档型', score: '4.8',
      location: '春熙路商圈 | 距离宽窄巷子步行约10分钟',
      reason: '位于市中心核心商圈，交通便利，周边餐饮和购物丰富。',
      tags: ['近景点', '高评分', '含早餐', '免费取消'],
      price: null, isRecommend: true,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Modern%20hotel%20room%20interior,%20large%20window,%20comfortable%20bed,%20warm%20lighting?width=512&height=512',
    },
    {
      id: 2, name: '成都群光君悦酒店',
      type: '豪华型', score: '4.9',
      location: '春熙路商圈 | 距离太古里步行约5分钟',
      reason: '高端五星级酒店，服务一流，距离热门景点太古里、IFS一步之遥。',
      tags: ['近商圈', '高评分', '含早餐', '免费取消'],
      price: '899', isRecommend: false,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Luxury%20hotel%20room,%20elegant%20design,%20city%20view,%20daylight?width=512&height=512',
    },
    {
      id: 3, name: '成都通顺酒店(宽窄巷子店)',
      type: '精品型', score: '4.6',
      location: '宽窄巷子附近 | 步行约3分钟',
      reason: '紧邻宽窄巷子，性价比高，装修风格融合川西文化元素。',
      tags: ['近景点', '双床房', '含早餐', '免费取消'],
      price: '358', isRecommend: false,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Comfortable%20hotel%20room%20with%20twin%20beds,%20bright%20and%20clean?width=512&height=512',
    },
    {
      id: 4, name: '成都博舍酒店',
      type: '豪华型', score: '4.8',
      location: '太古里商圈 | 距离春熙路步行约8分钟',
      reason: '位于太古里核心区域，设计感强，适合追求品质的旅行者。',
      tags: ['近景点', '高评分', '含早餐', '免费取消'],
      price: '1280', isRecommend: false,
      img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Chinese%20style%20boutique%20hotel%20room,%20wooden%20furniture,%20courtyard%20view?width=512&height=512',
    },
  ],
}

interface Hotel {
  id: number
  name: string
  type: string
  score: string
  location: string
  reason: string
  tags: string[]
  price: string | null
  isRecommend: boolean
  img: string
}

const PROGRESS_STAGES = [
  'AI 正在分析旅行需求...',
  '正在搜索景点信息...',
  '正在规划行程安排...',
  '正在推荐住宿酒店...',
  '正在生成最终方案...',
]

function HotelSelectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')

  // Generation states
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stageIdx, setStageIdx] = useState(0)
  const [error, setError] = useState('')
  const abortRef = useRef<(() => void) | null>(null)

  // Parse URL params
  const departureCity = searchParams.get('departureCity') || '北京'
  const departureId = Number(searchParams.get('departureId')) || 1
  const destCity = searchParams.get('destCity') || '成都'
  const destId = Number(searchParams.get('destId')) || 3
  const days = Number(searchParams.get('days')) || 3
  const adults = Number(searchParams.get('adults')) || 2
  const children = Number(searchParams.get('children')) || 0
  const elders = Number(searchParams.get('elders')) || 0
  const pace = searchParams.get('pace') || '适中'
  const budget = searchParams.get('budget') || '舒适适中'
  const notes = searchParams.get('notes') || ''
  const startDate = searchParams.get('startDate') || ''
  const interestsParam = searchParams.get('interests') || ''
  const selectedNeeds = interestsParam ? interestsParam.split(',') : []
  const addedSpotIdsParam = searchParams.get('selected_poi_ids') || ''
  const addedSpotIds = addedSpotIdsParam ? addedSpotIdsParam.split(',').map(Number) : []

  useEffect(() => {
    return () => abortRef.current?.()
  }, [])

  // Fake progress animation
  useEffect(() => {
    if (!loading) return
    setProgress(0)
    setStageIdx(0)

    const stageTimer = setInterval(() => {
      setStageIdx(prev => Math.min(prev + 1, PROGRESS_STAGES.length - 1))
    }, 8000)

    let cancelled = false
    function tick() {
      if (cancelled) return
      setProgress(prev => {
        if (prev >= 90) return prev
        return Math.min(prev + (90 - prev) * 0.03 + 0.5, 90)
      })
      setTimeout(tick, 600 + Math.random() * 600)
    }
    const id = setTimeout(tick, 300)

    return () => {
      cancelled = true
      clearInterval(stageTimer)
      clearTimeout(id)
    }
  }, [loading])

  const hotels = HOTEL_DATA[destCity] || HOTEL_DATA['default']
  const selectedHotel = hotels.find(h => h.id === selectedHotelId)

  function getPaceValue(): string {
    const map: Record<string, string> = { '轻松': 'relaxed', '适中': 'normal', '充实': 'intensive', '高强度': 'intensive' }
    return map[pace] || 'normal'
  }

  function getBudgetValue(): string {
    const map: Record<string, string> = { '经济省心': 'economy', '舒适适中': 'moderate', '品质优先': 'luxury', '自定义预算': 'custom' }
    return map[budget] || 'moderate'
  }

  async function handleNext() {
    setLoading(true)
    setError('')

    try {
      const res = await generateItinerary({
        destinations: [{ city_id: destId, city_name: destCity, days }],
        departure_city: departureCity,
        departure_city_id: departureId,
        travelers: { adults, children, elders },
        special_needs: selectedNeeds,
        selected_poi_ids: addedSpotIds,
        selected_hotel: selectedHotel ? {
          id: selectedHotel.id,
          name: selectedHotel.name,
          type: selectedHotel.type,
          score: selectedHotel.score,
          location: selectedHotel.location,
        } : undefined,
        notes,
        preferences: {
          interests: selectedNeeds,
          budget_level: getBudgetValue() as 'economy' | 'moderate' | 'luxury',
          pace: getPaceValue() as 'relaxed' | 'normal' | 'intensive',
        },
      })

      const taskId = res.data.task_id

      const abort = streamGeneration(taskId, {
        onComplete: (data) => {
          setProgress(100)
          setTimeout(() => {
            setLoading(false)
            router.push(`/itineraries/${data.itinerary_id}`)
          }, 400)
        },
        onError: (msg) => {
          setError(msg)
          setLoading(false)
        },
      })

      abortRef.current = abort
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setLoading(false)
    }
  }

  // Loading overlay
  if (loading) {
    return (
      <div className="w-full min-h-full bg-gradient-to-b from-[#EBF2FF] to-[#F5F6F8] flex flex-col items-center justify-center px-[32px]">
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="w-[64px] h-[64px] rounded-full bg-white shadow-[0_4px_16px_rgba(44,104,255,0.15)] flex items-center justify-center mx-auto mb-[24px]">
            <i className="fas fa-magic text-[#2C68FF] text-[28px] animate-pulse"></i>
          </div>
          <div className="text-[17px] font-bold text-[#333] mb-[8px]">AI 正在为你规划行程</div>
          <div className="text-[13px] text-[#999] mb-[24px]">{stageIdx + 1}/{PROGRESS_STAGES.length} {PROGRESS_STAGES[stageIdx]}</div>

          <div className="w-full bg-white/60 rounded-full h-[6px] mb-[16px]">
            <div className="bg-[#2C68FF] h-[6px] rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.max(3, progress)}%` }}></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#999] max-w-[280px] mx-auto">
            {PROGRESS_STAGES.map((_, i) => (
              <div key={i} className={`w-[8px] h-[8px] rounded-full ${i <= stageIdx ? 'bg-[#2C68FF]' : 'bg-[#D0D8E8]'}`}></div>
            ))}
          </div>

          <div className="mt-[32px] text-[12px] text-[#999]">
            <i className="fas fa-spinner fa-spin mr-[4px]"></i>
            请耐心等待，通常需要 1-2 分钟
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full bg-[#F6F8FB] flex flex-col pb-[80px]">
      <div className="max-w-3xl mx-auto w-full">
        {/* Top nav */}
        <div className="flex flex-col items-center justify-center pt-[44px] pb-[16px] px-[16px] bg-white shrink-0">
          <div className="w-full flex items-center justify-between mb-[8px]">
            <button onClick={() => router.back()} className="w-[32px] h-[32px] flex items-center cursor-pointer">
              <i className="fas fa-chevron-left text-[#333] text-[20px]"></i>
            </button>
            <div className="text-[18px] font-bold text-[#333]">选择本次入住酒店</div>
            <div className="w-[32px]"></div>
          </div>
          <div className="text-[13px] text-[#666]">选择后，管家将以此作为每日出发点优化你的行程</div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Search & filter area */}
          <div className="bg-white px-[16px] pb-[10px] rounded-b-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center space-x-[12px] mb-[10px]">
              <div className="flex-1 h-[32px] bg-[#F5F6F8] rounded-full flex items-center px-[12px]">
                <i className="fas fa-search text-[#999] text-[14px] mr-[6px]"></i>
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="搜索酒店/地名/关键词"
                  className="flex-1 bg-transparent border-none outline-none text-[12px] text-[#333] placeholder-[#999]"
                />
              </div>
              <div className="flex items-center space-x-[16px]">
                <div className="flex flex-col items-center justify-center cursor-pointer">
                  <i className="fas fa-map-marker-alt text-[#333] text-[14px] mb-[1px]"></i>
                  <span className="text-[9px] text-[#333]">地图</span>
                </div>
                <div className="flex flex-col items-center justify-center cursor-pointer">
                  <i className="fas fa-filter text-[#333] text-[14px] mb-[1px]"></i>
                  <span className="text-[9px] text-[#333]">更多筛选</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-[8px] mb-[10px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex items-center justify-center h-[28px] px-[12px] bg-[#EEF3FF] text-[#1B5CFF] rounded-full text-[12px] font-medium whitespace-nowrap shrink-0 border border-[#1B5CFF]/20">
                <i className="fas fa-thumbs-up mr-[4px]"></i> 智能推荐 <i className="fas fa-caret-down ml-[4px] text-[12px]"></i>
              </div>
              <div className="flex items-center justify-center h-[28px] px-[12px] bg-[#F5F6F8] text-[#333] rounded-full text-[12px] whitespace-nowrap shrink-0">
                <i className="fas fa-map-pin mr-[4px] text-[#666]"></i> 位置区域 <i className="fas fa-caret-down ml-[4px] text-[12px] text-[#999]"></i>
              </div>
              <div className="flex items-center justify-center h-[28px] px-[12px] bg-[#F5F6F8] text-[#333] rounded-full text-[12px] whitespace-nowrap shrink-0">
                <i className="fas fa-dollar-sign mr-[4px] text-[#666]"></i> 星级价格 <i className="fas fa-caret-down ml-[4px] text-[12px] text-[#999]"></i>
              </div>
              <div className="flex items-center justify-center h-[28px] px-[12px] bg-[#F5F6F8] text-[#333] rounded-full text-[12px] whitespace-nowrap shrink-0">
                <i className="fas fa-filter mr-[4px] text-[#666]"></i> 筛选 <i className="fas fa-caret-down ml-[4px] text-[12px] text-[#999]"></i>
              </div>
            </div>

            <div className="flex items-center space-x-[8px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {FILTER_OPTIONS.map((filter, idx) => (
                <div key={idx} className="flex items-center justify-center h-[24px] px-[10px] bg-white border border-[#E5E5E5] text-[#333] rounded-full text-[11px] whitespace-nowrap shrink-0 cursor-pointer">
                  {idx === 0 && <i className="fas fa-walking mr-[4px] text-[#666]"></i>}
                  {idx === 1 && <i className="far fa-star mr-[4px] text-[#666]"></i>}
                  {idx === 2 && <i className="fas fa-coffee mr-[4px] text-[#666]"></i>}
                  {idx === 3 && <i className="fas fa-bed mr-[4px] text-[#666]"></i>}
                  {idx === 4 && <i className="fas fa-shield-alt mr-[4px] text-[#666]"></i>}
                  {filter}
                </div>
              ))}
            </div>
          </div>

          {/* Map & tip */}
          <div className="mx-[12px] mt-[12px] bg-white rounded-[16px] overflow-hidden shadow-sm">
            <div className="w-full h-[110px] relative">
              <img
                src="https://l-api.jd.com/relay-aigc/design/image/prompt/GoogleMapTA?width=1024&height=512"
                alt="地图"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-[12px] right-[12px] bg-white rounded-[8px] p-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] scale-90 origin-top-right">
                <div className="text-[#1B5CFF] text-[12px] font-bold mb-[2px]">推荐住宿区域</div>
                <div className="text-[#666] text-[10px]">步行可达多个景点</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-[12px] py-[8px]">
              <div className="flex items-center">
                <i className="fas fa-map-marker-alt text-[#1B5CFF] text-[13px] mr-[6px]"></i>
                <span className="text-[12px] text-[#333]">选择酒店后，将作为每日路线出发点</span>
              </div>
              <div className="text-[#1B5CFF] text-[12px] flex items-center cursor-pointer">
                查看全部景点 <i className="fas fa-angle-right ml-[4px]"></i>
              </div>
            </div>
          </div>

          {/* Hotel list */}
          <div className="px-[12px] py-[12px] space-y-[12px]">
            {hotels.map((hotel) => {
              const isSelected = selectedHotelId === hotel.id
              return (
                <div
                  key={hotel.id}
                  onClick={() => setSelectedHotelId(isSelected ? null : hotel.id)}
                  className={`bg-white rounded-[16px] p-[12px] flex shadow-sm min-h-[140px] cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-[#1B5CFF]' : ''
                  }`}
                >
                  {/* Left image */}
                  <div className="relative shrink-0 mr-[12px]">
                    <img src={hotel.img} alt={hotel.name} className="w-[80px] h-[106px] rounded-[8px] object-cover" />
                    {hotel.isRecommend && (
                      <div className="absolute top-0 left-0 bg-[#1B5CFF] text-white text-[9px] px-[6px] py-[2px] rounded-tl-[8px] rounded-br-[8px]">
                        推荐
                      </div>
                    )}
                  </div>

                  {/* Right info */}
                  <div className="flex-1 min-w-0 flex flex-col relative">
                    <div>
                      <div className="flex justify-between items-start mb-[4px]">
                        <div className="text-[14px] font-bold text-[#333] leading-tight break-words pr-[8px]">
                          {hotel.name}
                        </div>
                        <div
                          className="shrink-0 cursor-pointer p-[2px]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedHotelId(isSelected ? null : hotel.id)
                          }}
                        >
                          {isSelected ? (
                            <div className="w-[20px] h-[20px] bg-[#1B5CFF] rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                              <i className="fas fa-check text-white text-[12px] font-bold"></i>
                            </div>
                          ) : (
                            <div className="w-[20px] h-[20px] bg-white rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-[2px] border-[#1B5CFF] box-border">
                              <i className="fas fa-plus text-[#1B5CFF] text-[10px] font-bold mt-[1px]"></i>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mb-[4px]">
                        <span className="text-[9px] text-[#6D7B99] bg-[#F2F4F8] px-[4px] py-[1px] rounded-[3px] mr-[6px]">{hotel.type}</span>
                        <div className="flex text-[#FF7A22] text-[10px] space-x-[2px] mr-[6px]">
                          {[1, 2, 3, 4, 5].map(i => (
                            <i key={i} className="fas fa-star"></i>
                          ))}
                        </div>
                        <span className="text-[#333] text-[11px] font-bold">{hotel.score}</span>
                      </div>
                      <div className="text-[10px] text-[#666] mb-[6px] truncate">{hotel.location}</div>
                      <div className="bg-[#F4F9F8] rounded-[6px] p-[6px] mb-[6px] w-full">
                        <div className="text-[10px] text-[#333] leading-snug line-clamp-1">
                          <span className="text-[#00B49B] font-bold mr-[4px]">推荐理由:</span>
                          {hotel.reason}
                        </div>
                      </div>
                      <div className="flex flex-nowrap gap-[4px] overflow-hidden mb-[8px] w-full">
                        {hotel.tags.map((tag, i) => (
                          <span key={i} className="text-[9px] text-[#666] bg-white border border-[#E5E5E5] px-[4px] py-[1px] rounded-[3px] shrink-0 whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex justify-end absolute bottom-[4px] right-0">
                      {hotel.price && (
                        <div className="flex items-baseline">
                          <span className="text-[#FF5915] text-[12px]">¥</span>
                          <span className="text-[#FF5915] text-[18px] font-bold leading-none">{hotel.price}</span>
                          <span className="text-[#999] text-[10px] ml-[2px]">起</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="mx-[16px] mb-[12px] rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-red-500"></i>
            {error}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-white px-[16px] py-[10px] pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between z-50 space-x-[12px]">
        <button
          onClick={handleNext}
          className="w-[130px] h-[44px] border border-[#E5E5E5] rounded-[12px] flex flex-col items-center justify-center cursor-pointer bg-white shrink-0"
        >
          <span className="text-[15px] font-bold text-[#333]">跳过</span>
          <span className="text-[10px] text-[#999]">稍后可在行程中补充</span>
        </button>
        <button
          onClick={handleNext}
          className="flex-1 h-[44px] bg-[#1B5CFF] rounded-[12px] flex flex-col items-center justify-center text-white cursor-pointer shadow-[0_4px_12px_rgba(27,92,255,0.3)]"
        >
          <span className="text-[15px] font-bold">
            {selectedHotel ? '下一步' : '跳过并继续'}
          </span>
          <span className="text-[10px] opacity-90">
            {selectedHotel ? '已选酒店将影响路线规划' : '稍后可在行程中补充'}
          </span>
        </button>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <HotelSelectPage />
    </Suspense>
  )
}
