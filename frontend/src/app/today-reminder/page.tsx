'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getItinerary, listItineraries } from '@/lib/api'
import type { Itinerary, ItinerarySlot } from '@/types'

function getDayOfWeek(date: Date): string {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[date.getDay()]
}

function getDaysUntil(target: Date): number {
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// City-based mock ticket data (since real ticket purchase data isn't in the backend)
const CITY_TICKETS: Record<string, { name: string; status: 'bought' | 'pending'; detail: string }[]> = {
  '北京': [
    { name: '故宫博物院', status: 'bought', detail: '已购 2 张成人票' },
    { name: '长城（八达岭）', status: 'pending', detail: '09:00缆车票待预订' },
  ],
  '上海': [
    { name: '上海迪士尼乐园', status: 'bought', detail: '已购 2 张成人票' },
    { name: '上海博物馆', status: 'pending', detail: '14:00博物馆参观门票待预订' },
  ],
  '成都': [
    { name: '成都大熊猫繁育研究基地', status: 'bought', detail: '已购 2 张成人票' },
    { name: '都江堰', status: 'pending', detail: '景区门票待预订' },
  ],
  '西安': [
    { name: '秦始皇兵马俑博物馆', status: 'bought', detail: '已购 2 张成人票' },
    { name: '西安城墙', status: 'pending', detail: '城墙骑行门票待预订' },
  ],
  '大理': [
    { name: '崇圣寺三塔', status: 'bought', detail: '已购 2 张成人票' },
    { name: '苍山', status: 'pending', detail: '苍山索道票待预订' },
  ],
  '杭州': [
    { name: '灵隐寺', status: 'bought', detail: '已购 2 张成人票' },
    { name: '雷峰塔', status: 'pending', detail: '登塔门票待预订' },
  ],
  '广州': [
    { name: '广州塔（小蛮腰）', status: 'bought', detail: '已购 2 张成人票' },
    { name: '长隆野生动物世界', status: 'pending', detail: '园区门票待预订' },
  ],
  '重庆': [
    { name: '洪崖洞', status: 'bought', detail: '免费开放无需购票' },
    { name: '武隆天生三桥', status: 'pending', detail: '景区门票待预订' },
  ],
  '三亚': [
    { name: '蜈支洲岛', status: 'bought', detail: '已购 2 张成人票' },
    { name: '南山文化旅游区', status: 'pending', detail: '景区门票待预订' },
  ],
}

// City-based weather data
const CITY_WEATHER: Record<string, { temp: string; condition: string; icon: string }> = {
  '北京': { temp: '24~32°C', condition: '晴转多云', icon: 'fa-cloud-sun' },
  '上海': { temp: '24~30°C', condition: '多云转晴', icon: 'fa-cloud-sun' },
  '成都': { temp: '22~28°C', condition: '阴天', icon: 'fa-cloud' },
  '西安': { temp: '26~35°C', condition: '晴', icon: 'fa-sun' },
  '大理': { temp: '18~25°C', condition: '多云', icon: 'fa-cloud-sun' },
  '杭州': { temp: '23~29°C', condition: '多云转晴', icon: 'fa-cloud-sun' },
  '广州': { temp: '27~33°C', condition: '雷阵雨', icon: 'fa-cloud-rain' },
  '重庆': { temp: '26~34°C', condition: '多云', icon: 'fa-cloud' },
  '三亚': { temp: '28~32°C', condition: '晴', icon: 'fa-sun' },
}

export default function TodayReminder() {
  const router = useRouter()
  const [animIn, setAnimIn] = useState(false)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => setAnimIn(true))
    loadActiveItinerary()
  }, [])

  async function loadActiveItinerary() {
    try {
      const res = await listItineraries()
      const plans = res.data || []
      const confirmed = plans.find(p => p.status === 'confirmed')
      if (confirmed) {
        const detail = await getItinerary(confirmed.id)
        setItinerary(detail.data)
      }
    } catch {
      // no backend
    } finally {
      setLoading(false)
    }
  }

  const destCity = itinerary?.destinations?.[0]?.city_name || ''
  const totalDays = itinerary?.destinations?.reduce((s, d) => s + d.days, 0) || 0
  const todaySlots = itinerary?.days?.[0]?.slots || []
  const weather = CITY_WEATHER[destCity]
  const tickets = CITY_TICKETS[destCity] || []
  const now = new Date()
  const todayDate = now.getDate()
  const dayOfWeek = getDayOfWeek(now)
  const startDate = itinerary?.start_date ? new Date(itinerary.start_date) : null
  const daysUntilStart = startDate ? getDaysUntil(startDate) : null
  const attractionSlots = todaySlots.filter(s => s.poi_category === 'attraction' || s.poi_category === 'entertainment')

  return (
    <div
      className={`w-full h-full overflow-y-auto bg-[#F6F7F9] flex flex-col relative pb-[100px] transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        animIn ? 'translate-x-0 scale-100 opacity-100' : 'translate-x-full scale-[0.96] opacity-0'
      }`}
      style={{
        boxShadow: animIn ? 'none' : '-6px 0 20px rgba(0,0,0,0.06)',
        transitionProperty: 'transform, opacity, box-shadow',
      }}
    >
      {/* 顶部背景图与导航 */}
      <div className="relative w-full h-[240px] shrink-0">
        <img
          src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20beautiful%20sunny%20morning%20sky%20with%20soft%20clouds%20and%20warm%20sunlight%20streaming%20down%20gentle%20and%20fresh%20atmosphere%20light%20blue%20and%20pale%20yellow%20tones?width=1024&height=1024"
          alt="早晨天空背景"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F7F9] via-transparent to-transparent" />

        {/* 顶部导航 */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-center p-[16px] pt-[20px] z-10">
          <div
            className="absolute left-[16px] w-[32px] h-[32px] bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => router.back()}
          >
            <i className="fas fa-chevron-left text-white text-[16px]"></i>
          </div>
        </div>

        {/* 标题区域 — 动态展示行程城市数据 */}
        <div className="absolute bottom-[40px] left-[20px] z-10">
          <div className="flex items-end gap-[8px]">
            <h1 className="text-[32px] font-bold text-[#333333] leading-none mb-[-4px]">{todayDate}</h1>
            <span className="text-[14px] text-[#666666] font-medium">
              {dayOfWeek}{daysUntilStart ? ` / 距出发还剩 ${daysUntilStart}日` : ''}
            </span>
          </div>
          {destCity && weather ? (
            <div className="flex items-center gap-[6px] mt-[10px]">
              <div className="flex items-center text-[13px] text-[#666666] font-medium bg-white/60 backdrop-blur-md px-[8px] py-[2px] rounded-full">
                <i className={`fas ${weather.icon} text-[#F5A623] mr-[4px]`}></i>
                <span>{destCity} {weather.temp}</span>
              </div>
              <div className="text-[13px] text-[#666666] font-medium bg-white/60 backdrop-blur-md px-[8px] py-[2px] rounded-full">
                {weather.condition}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-[6px] mt-[10px]">
              <div className="text-[13px] text-[#666666] font-medium bg-white/60 backdrop-blur-md px-[8px] py-[2px] rounded-full">
                请先选择一个行程
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 核心卡片区 */}
      <div className="px-[16px] mt-[-20px] relative z-20 flex flex-col gap-[12px]">
        {/* 出发前准备 & 伴手礼 卡片行 */}
        <div className="flex w-full gap-[12px]">
          <div
            className="flex-1 bg-white rounded-[16px] p-[16px] pb-[44px] flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer"
            style={{ minWidth: '150px' }}
            onClick={() => router.push('/prep-before-departure')}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%203D%20illustration%20of%20a%20travel%20suitcase%20and%20a%20camera%20on%20a%20clean%20background%20soft%20lighting%20blue%20tones?width=512&height=512"
                alt="出行装备背景"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="w-[40px] h-[40px] bg-[#E8F0FF] rounded-full flex items-center justify-center mb-[8px] z-10">
              <i className="fas fa-suitcase-rolling text-[#3B6EF4] text-[20px]"></i>
            </div>
            <div className="text-[15px] font-bold text-[#333333] z-10 text-center">出发前准备</div>
            <div className="text-[12px] text-[#666666] mt-[4px] z-10 text-center">
              {destCity ? `${destCity}行程准备清单` : '还差 6 项待确认'}
            </div>
            <div className="w-[28px] h-[28px] bg-[#3B6EF4] rounded-full flex items-center justify-center absolute bottom-[12px] right-[12px] shadow-[0_2px_8px_rgba(59,110,244,0.3)] z-10">
              <i className="fas fa-arrow-right text-white text-[12px]"></i>
            </div>
          </div>

          <div
            className="flex-1 bg-white rounded-[16px] p-[16px] pb-[44px] flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer"
            style={{ minWidth: '150px' }}
            onClick={() => router.push('/gift-select')}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%203D%20illustration%20of%20a%20gift%20box%20with%20ribbon%20on%20a%20clean%20background%20soft%20lighting%20pink%20and%20red%20tones?width=512&height=512"
                alt="礼物背景"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="w-[40px] h-[40px] bg-[#FFF2F0] rounded-full flex items-center justify-center mb-[8px] z-10">
              <i className="fas fa-gift text-[#FF5A5F] text-[20px]"></i>
            </div>
            <div className="text-[15px] font-bold text-[#333333] z-10 text-center">伴手礼挑选</div>
            <div className="text-[12px] text-[#666666] mt-[4px] z-10 text-center">
              {destCity ? `${destCity}特产推荐` : '寄回家，不用提'}
            </div>
            <div className="w-[28px] h-[28px] bg-[#FF5A5F] rounded-full flex items-center justify-center absolute bottom-[12px] right-[12px] shadow-[0_2px_8px_rgba(255,90,95,0.3)] z-10">
              <i className="fas fa-arrow-right text-white text-[12px]"></i>
            </div>
          </div>
        </div>

        {/* 特殊提醒卡片 — 根据城市显示不同预警 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-[100px] h-[100px] opacity-10 pointer-events-none">
            <img
              src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20illustration%20of%20a%20warning%20alert%20icon%20soft%20orange%20and%20red%20tones?width=512&height=512"
              alt="预警背景"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-[16px] font-bold text-[#333333] mb-[12px] flex items-center relative z-10">
            <div className="w-[4px] h-[14px] bg-[#FF5A5F] rounded-full mr-[8px]"></div>
            特殊提醒
          </div>
          <div className="relative z-10 bg-[#FFF2F0] rounded-[8px] p-[12px] flex items-center justify-between gap-[12px]">
            <div className="flex items-start gap-[12px]">
              <div className="w-[36px] h-[36px] bg-white rounded-full flex items-center justify-center text-[#FF5A5F] shrink-0">
                <i className="fas fa-exclamation-triangle text-[16px]"></i>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#333333]">
                  {destCity === '北京' ? '沙尘暴预警' : destCity === '广州' ? '雷雨天气预警' : '出行提醒'}
                </div>
                <div className="text-[12px] text-[#666666] mt-[4px] leading-relaxed">
                  {destCity === '北京'
                    ? '北京沙尘暴天气能见度较低，建议更改出行方式'
                    : destCity === '广州'
                      ? '广州有雷阵雨，建议携带雨具，注意出行安全'
                      : destCity
                        ? `${destCity}今日${weather?.condition || '天气良好'}，适合出行`
                        : '请选择一个行程查看今日提醒'}
                </div>
              </div>
            </div>
            <div className="px-[12px] py-[6px] bg-[#FF5A5F] text-white rounded-full text-[12px] font-medium shrink-0 cursor-pointer"
              onClick={() => router.push('/plan/chat')}>
              更改行程
            </div>
          </div>
        </div>

        {/* 今日行程卡片 — 从 itinerary.days[0].slots 动态渲染 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-10 pointer-events-none">
            <img
              src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20map%20illustration%20with%20a%20location%20pin%20soft%20blue%20tones?width=512&height=512"
              alt="地图背景"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-between items-center mb-[16px] relative z-10">
            <div className="text-[16px] font-bold text-[#333333] flex items-center">
              <div className="w-[4px] h-[14px] bg-[#3B6EF4] rounded-full mr-[8px]"></div>
              {destCity ? `${destCity} · 今日行程` : '今日行程'}
            </div>
            <div
              className="text-[13px] text-[#3B6EF4] flex items-center font-medium cursor-pointer"
              onClick={() => {
                if (itinerary) router.push(`/itineraries/${itinerary.id}`)
              }}
            >
              全部行程 <i className="fas fa-chevron-right ml-[4px] text-[10px]"></i>
            </div>
          </div>
          <div className="flex flex-col gap-[12px] relative z-10">
            {loading ? (
              <div className="text-[13px] text-[#999] text-center py-[8px]">加载中...</div>
            ) : todaySlots.length > 0 ? (
              todaySlots.map((slot, i) => (
                <div key={i} className="flex items-start gap-[12px]">
                  <div className="flex flex-col items-center mt-[4px]">
                    <div className={`w-[8px] h-[8px] rounded-full ${i === 0 ? 'bg-[#3B6EF4]' : 'bg-[#E5E5E5]'}`}></div>
                    {i < todaySlots.length - 1 && <div className="w-[1px] h-[40px] bg-[#E5E5E5] my-[4px]"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold text-[#333333] mb-[4px]">{slot.poi_name}</div>
                    <div className="text-[12px] text-[#999999]">
                      {slot.start_time}{slot.end_time ? `-${slot.end_time}` : ''}{slot.transport_tip ? ` · ${slot.transport_tip}` : ''}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-[#999] text-center py-[8px]">
                {destCity ? '暂无行程数据' : '请先在首页选择一个待出发行程'}
              </div>
            )}
          </div>
        </div>

        {/* 门票信息卡片 — 根据城市显示动态门票数据 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-[100px] h-[100px] opacity-10 pointer-events-none">
            <img
              src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20illustration%20of%20tickets%20and%20passport%20soft%20orange%20tones?width=512&height=512"
              alt="门票背景"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-[16px] font-bold text-[#333333] mb-[12px] flex items-center relative z-10">
            <div className="w-[4px] h-[14px] bg-[#F5A623] rounded-full mr-[8px]"></div>
            {destCity ? `${destCity} · 门票信息` : '门票信息'}
          </div>

          <div className="flex flex-col gap-[12px] relative z-10">
            {loading ? (
              <div className="text-[13px] text-[#999] text-center py-[8px]">加载中...</div>
            ) : tickets.length > 0 ? (
              tickets.map((ticket, i) => (
                <div key={i} className="flex items-center justify-between bg-[#FFF9F0] rounded-[8px] p-[12px]">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] bg-white rounded-full flex items-center justify-center text-[#F5A623]">
                      <i className="fas fa-ticket-alt text-[16px]"></i>
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#333333]">{ticket.name}</div>
                      <div className="text-[12px] text-[#666666] mt-[2px]">{ticket.detail}</div>
                    </div>
                  </div>
                  <div className={`px-[12px] py-[6px] rounded-full text-[12px] font-medium shrink-0 cursor-pointer ${
                    ticket.status === 'bought'
                      ? 'bg-white border border-[#F5A623] text-[#F5A623]'
                      : 'bg-[#F5A623] border border-[#F5A623] text-white'
                  }`}>
                    {ticket.status === 'bought' ? '查看凭证' : '立即预订'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-[#999] text-center py-[8px]">
                请先在首页选择一个待出发行程
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
