'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import DateSelectModal from './DateSelectModal'
import CitySelectModal from './CitySelectModal'

const PACE_OPTIONS = [
  { id: '轻松', icon: 'fa-coffee', iconColor: '#53B782', desc1: '每天1-2个地点', desc2: '预留充足休息', value: 'relaxed' },
  { id: '适中', icon: 'fa-walking', iconColor: '#2C68FF', desc1: '每天2-3个地点', desc2: '兼顾游玩与休息', value: 'normal' },
  { id: '充实', icon: 'fa-camera', iconColor: '#F5A623', desc1: '每天3-4个地点', desc2: '多玩一些', value: 'intensive' },
  { id: '高强度', icon: 'fa-bolt', iconColor: '#F85A5A', desc1: '尽量多打卡', desc2: '早出晚归', value: 'intensive' },
] as const

const BUDGET_OPTIONS = [
  { id: '经济省心', desc: '性价比优先', value: 'economy' },
  { id: '舒适适中', desc: '体验与价格平衡', value: 'moderate' },
  { id: '品质优先', desc: '更重视体验', value: 'luxury' },
  { id: '自定义预算', desc: '我有明确预算', value: 'custom' },
] as const

const SPECIAL_NEEDS = [
  { id: '少走路', icon: 'fa-star' },
  { id: '不早起', icon: 'fa-star' },
  { id: '无障碍设施', icon: 'fa-wheelchair' },
  { id: '避开人多', icon: null },
  { id: '住地附近', icon: null },
  { id: '不吃辣', icon: null },
  { id: '早点回酒店', icon: null },
]

export default function PlanCreatePage() {
  const router = useRouter()

  // City & date
  const [departureCity, setDepartureCity] = useState({ id: 1, name: '北京' })
  const [destCity, setDestCity] = useState({ id: 3, name: '成都' })
  const [startDate, setStartDate] = useState<string>('')
  const [totalDays, setTotalDays] = useState(3)

  // Travelers
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [elders, setElders] = useState(0)

  // Preferences
  const [pace, setPace] = useState('适中')
  const [budget, setBudget] = useState('舒适适中')
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  // View switching (city selection renders full-page replacing form)
  const [showDateSelect, setShowDateSelect] = useState(false)
  const [citySelectView, setCitySelectView] = useState<'form' | 'departure' | 'destination'>('form')

  function toggleNeed(id: string) {
    setSelectedNeeds(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id],
    )
  }

  function handleSubmit() {
    const params = new URLSearchParams({
      departureCity: departureCity.name,
      departureId: String(departureCity.id),
      destCity: destCity.name,
      destId: String(destCity.id),
      days: String(totalDays || 1),
      adults: String(adults),
      children: String(children),
      elders: String(elders),
      pace: pace,
      budget: budget,
      notes: notes,
    })
    if (startDate) params.set('startDate', startDate)
    if (selectedNeeds.length) params.set('interests', selectedNeeds.join(','))

    router.push(`/plan/confirm-route?${params.toString()}`)
  }

  const formatDateLabel = startDate
    ? `${new Date(startDate).getMonth() + 1}月${new Date(startDate).getDate()}日 - ${new Date(new Date(startDate).getTime() + (totalDays - 1) * 86400000).getMonth() + 1}月${new Date(new Date(startDate).getTime() + (totalDays - 1) * 86400000).getDate()}日`
    : ''

  // Build city-selection shared props (always rendered, hidden by CSS)
  const isCityActive = citySelectView !== 'form'
  const cityModalTitle = citySelectView === 'departure' ? '选择出发地' : '选择目的地'
  const cityModalCurrent = citySelectView === 'departure' ? departureCity.name : destCity.name

  function handleCitySelect(city: { id: number; name: string }) {
    if (citySelectView === 'departure') setDepartureCity(city)
    else setDestCity(city)
    setCitySelectView('form')
  }
  return (
    <div className="relative w-full min-h-screen bg-[#F5F7FA]">
      {/* ─── Form view ─── */}
      <div className={`w-full min-h-screen transition-all duration-300 ease-out will-change-transform ${
        isCityActive ? '-translate-x-[25%] scale-[0.95] opacity-40' : 'translate-x-0 scale-100 opacity-100'
      }`}>
        <div className="max-w-3xl mx-auto w-full">
          {/* Top nav */}
          <div className="flex flex-col items-center pt-[44px] pb-[16px] px-[20px] shrink-0 bg-[#F5F7FA]">
            <div className="w-full flex items-center justify-between mb-[8px]">
              <button onClick={() => router.push('/')} className="w-[32px] h-[32px] flex items-center cursor-pointer">
                <i className="fas fa-chevron-left text-[#333] text-[20px]"></i>
              </button>
              <div className="text-[18px] font-bold text-[#333]">确认旅行需求</div>
              <div className="w-[32px]"></div>
            </div>
            <div className="text-[13px] text-[#666]">先确认几个关键信息，我来帮你生成更合适的方案</div>
          </div>

          {/* Content */}
          <div className="px-[20px] pb-[20px] space-y-[12px]">
            {/* Basic info card */}
            <div className="bg-white rounded-[16px] p-[10px] shadow-sm flex flex-col space-y-[6px]">
              {/* Departure city */}
              <button className="flex items-center justify-between w-full cursor-pointer bg-transparent border-0 p-0 text-left" onClick={() => setCitySelectView('departure')}>
                <div className="flex items-center">
                  <div className="w-[24px] h-[24px] bg-[#F0F5FF] rounded-full flex items-center justify-center mr-[10px]">
                    <i className="fas fa-location-arrow text-[#2C68FF] text-[12px]"></i>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#333] font-bold mb-[1px]">出发地</span>
                    <span className="text-[12px] text-[#666]">{departureCity.name}</span>
                  </div>
                </div>
                <i className="fas fa-angle-right text-[#CCC] text-[16px]"></i>
              </button>

              <div className="w-full h-[1px] bg-[#F5F5F5] ml-[34px]"></div>

              {/* Destination */}
              <button className="flex items-center justify-between w-full cursor-pointer bg-transparent border-0 p-0 text-left" onClick={() => setCitySelectView('destination')}>
                <div className="flex items-center">
                  <div className="w-[24px] h-[24px] bg-[#F0F5FF] rounded-full flex items-center justify-center mr-[10px]">
                    <i className="fas fa-map-marker-alt text-[#2C68FF] text-[12px]"></i>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#333] font-bold mb-[1px]">目的地城市</span>
                    <span className="text-[12px] text-[#666]">{destCity.name}</span>
                  </div>
                </div>
                <i className="fas fa-angle-right text-[#CCC] text-[16px]"></i>
              </button>

              <div className="w-full h-[1px] bg-[#F5F5F5] ml-[34px]"></div>

              {/* Date */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowDateSelect(true)}>
                <div className="flex items-center">
                  <div className="w-[24px] h-[24px] bg-[#F0F5FF] rounded-full flex items-center justify-center mr-[10px]">
                    <i className="far fa-calendar-alt text-[#2C68FF] text-[12px]"></i>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#333] font-bold mb-[1px]">出行日期</span>
                    <div className="flex items-center">
                      <span className="text-[12px] text-[#666] mr-[8px]">
                        {startDate ? formatDateLabel : '请选择日期'}
                      </span>
                      {startDate && (
                        <span className="bg-[#F5F6F8] text-[#999] text-[9px] px-[6px] py-[2px] rounded-[4px]">
                          共{totalDays}天{totalDays > 1 ? `${totalDays - 1}晚` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <i className="fas fa-angle-right text-[#CCC] text-[16px]"></i>
              </div>

              <div className="w-full h-[1px] bg-[#F5F5F5] ml-[34px]"></div>

              {/* Travelers */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-[6px]">
                  <div className="flex items-center">
                    <div className="w-[24px] h-[24px] bg-[#F0F5FF] rounded-full flex items-center justify-center mr-[10px]">
                      <i className="fas fa-user-friends text-[#2C68FF] text-[12px]"></i>
                    </div>
                    <span className="text-[12px] text-[#333] font-bold">同行人员</span>
                  </div>
                  <i className="fas fa-angle-right text-[#CCC] text-[16px]"></i>
                </div>
                <div className="flex justify-between pl-[34px]">
                  <Stepper label="成人" value={adults} min={1} onChange={setAdults} />
                  <div className="w-[1px] h-[26px] bg-[#F5F5F5] mt-[14px]"></div>
                  <Stepper label="儿童" value={children} onChange={setChildren} />
                  <div className="w-[1px] h-[26px] bg-[#F5F5F5] mt-[14px]"></div>
                  <Stepper label="老人" value={elders} onChange={setElders} />
                </div>
              </div>
            </div>

            {/* Pace */}
            <div className="bg-white rounded-[16px] p-[16px] shadow-sm">
              <div className="flex items-center mb-[16px]">
                <div className="w-[24px] h-[24px] bg-[#E8F8F0] rounded-full flex items-center justify-center mr-[8px]">
                  <i className="fas fa-leaf text-[#53B782] text-[12px]"></i>
                </div>
                <span className="text-[14px] text-[#333] font-bold">行程节奏</span>
              </div>
              <div className="flex justify-between gap-[6px]">
                {PACE_OPTIONS.map(item => {
                  const selected = pace === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPace(item.id)}
                      className={`flex-1 h-[72px] rounded-[10px] flex flex-col items-center justify-center p-[2px] relative cursor-pointer border-[1.5px] transition-all ${
                        selected ? 'border-[#2C68FF] bg-[#F4F7FF]' : 'border-[#F5F6F8] bg-white'
                      }`}
                    >
                      <span className={`text-[11px] font-medium mb-[4px] ${selected ? 'text-[#2C68FF]' : 'text-[#333]'}`}>{item.id}</span>
                      <i className={`fas ${item.icon} text-[14px] mb-[4px]`} style={{ color: item.iconColor }}></i>
                      <span className="text-[9px] text-[#999] text-center leading-[1.2] whitespace-nowrap scale-90 origin-center">{item.desc1}</span>
                      <span className="text-[9px] text-[#999] text-center leading-[1.2] whitespace-nowrap scale-90 origin-center">{item.desc2}</span>
                      {selected && (
                        <div className="absolute -top-[1px] -right-[1px] w-[18px] h-[18px] bg-[#2C68FF] rounded-bl-[10px] rounded-tr-[8px] flex items-center justify-center">
                          <i className="fas fa-check text-white text-[10px]"></i>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Budget */}
            <div className="bg-white rounded-[16px] p-[16px] shadow-sm">
              <div className="flex items-center mb-[16px]">
                <div className="w-[24px] h-[24px] bg-[#FFF3E8] rounded-full flex items-center justify-center mr-[8px]">
                  <i className="fas fa-wallet text-[#F5A623] text-[12px]"></i>
                </div>
                <span className="text-[15px] text-[#333] font-bold">消费方式</span>
              </div>
              <div className="flex justify-between gap-[4px]">
                {BUDGET_OPTIONS.map(item => {
                  const selected = budget === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setBudget(item.id)}
                      className={`flex-1 h-[56px] rounded-[8px] flex flex-col items-center justify-center p-[2px] relative cursor-pointer border-[1.5px] transition-all ${
                        selected ? 'border-[#2C68FF] bg-[#F4F7FF]' : 'border-[#F5F6F8] bg-[#FAFAFA]'
                      }`}
                    >
                      <span className={`text-[13px] font-medium mb-[2px] whitespace-nowrap scale-95 origin-center ${selected ? 'text-[#2C68FF]' : 'text-[#333]'}`}>{item.id}</span>
                      <span className="text-[11px] text-[#999] text-center leading-tight whitespace-nowrap scale-90 origin-center">{item.desc}</span>
                      {selected && (
                        <div className="absolute -top-[1px] -right-[1px] w-[16px] h-[16px] bg-[#2C68FF] rounded-bl-[8px] rounded-tr-[6px] flex items-center justify-center">
                          <i className="fas fa-check text-white text-[9px]"></i>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Special needs */}
            <div className="bg-white rounded-[16px] p-[16px] shadow-sm">
              <div className="flex items-center justify-between mb-[16px]">
                <div className="flex items-center">
                  <div className="w-[24px] h-[24px] bg-[#FFEAEA] rounded-full flex items-center justify-center mr-[8px]">
                    <i className="fas fa-heart text-[#F85A5A] text-[12px]"></i>
                  </div>
                  <span className="text-[15px] text-[#333] font-bold">管家特别照顾</span>
                  <span className="text-[12px] text-[#999] ml-[6px]">(可多选)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-[10px] mb-[16px]">
                {SPECIAL_NEEDS.map(item => {
                  const isSelected = selectedNeeds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleNeed(item.id)}
                      className={`px-[12px] py-[6px] rounded-full flex items-center text-[12px] border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#F4F7FF] border-[#2C68FF]/50 text-[#2C68FF]'
                          : 'bg-[#FAFAFA] border-transparent text-[#666] hover:bg-[#F5F6F8]'
                      }`}
                    >
                      {item.icon && <i className={`fas ${item.icon} mr-[4px] text-[11px] ${isSelected ? 'text-[#2C68FF]' : 'text-[#999]'}`}></i>}
                      {item.id}
                    </div>
                  )
                })}
              </div>

              {/* Notes */}
              <div className="w-full bg-[#FAFAFA] rounded-[10px] p-[12px] relative">
                <div className="flex">
                  <i className="far fa-comment-dots text-[#999] text-[14px] mt-[2px] mr-[4px]"></i>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value.slice(0, 60))}
                    className="flex-1 bg-transparent text-[11px] text-[#333] placeholder-[#999] appearance-none border-0 outline-none focus:outline-none focus:ring-0 resize-none h-[50px]"
                    placeholder={`还有其他想告诉管家的吗？\n例如：妈妈膝盖不好，尽量少爬楼；晚上想吃清淡一点`}
                  />
                </div>
                <div className="absolute bottom-[8px] right-[12px] text-[11px] text-[#CCC]">{notes.length}/60</div>
              </div>
            </div>

            {error && (
              <div className="rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-500"></i>
                {error}
              </div>
            )}
          </div>
          </div>

        {/* Bottom sticky button */}
        <div className="fixed bottom-0 left-0 w-full bg-white px-[20px] py-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-40">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSubmit}
              className="w-full h-[48px] bg-[#1B5CFF] rounded-[24px] flex items-center justify-center text-white text-[16px] font-bold cursor-pointer shadow-[0_4px_12px_rgba(27,92,255,0.3)] hover:bg-[#0A4AE0] transition-colors"
            >
              <i className="fas fa-magic text-[16px] mr-[6px]"></i> 让管家推荐景点
            </button>
          </div>
        </div>
      </div>

      {/* ─── City selection slide-in layer ─── */}
      <div className={`fixed inset-0 z-50 transition-transform duration-300 ease-out will-change-transform ${
        isCityActive ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <CitySelectModal
          title={cityModalTitle}
          currentCity={cityModalCurrent}
          onSelect={handleCitySelect}
          onClose={() => setCitySelectView('form')}
        />
      </div>

      {/* ─── Date modal ─── */}
      {showDateSelect && (
        <DateSelectModal
          onClose={() => setShowDateSelect(false)}
          onConfirm={(date, days) => {
            setStartDate(date)
            setTotalDays(days)
            setShowDateSelect(false)
          }}
        />
      )}
    </div>
  )
}

function Stepper({
  label,
  value,
  min = 0,
  onChange,
}: {
  label: string
  value: number
  min?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[11px] text-[#666] mb-[2px]">{label}</span>
      <div className="flex items-center">
        <button
          onClick={() => value > min && onChange(value - 1)}
          className="w-[22px] h-[22px] bg-[#F5F6F8] rounded-full flex items-center justify-center text-[#CCC] cursor-pointer"
        >
          <i className="fas fa-minus text-[10px]"></i>
        </button>
        <span className="w-[26px] text-center text-[13px] text-[#333] font-medium">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-[22px] h-[22px] bg-[#F5F6F8] rounded-full flex items-center justify-center text-[#333] cursor-pointer"
        >
          <i className="fas fa-plus text-[10px]"></i>
        </button>
      </div>
    </div>
  )
}
