'use client'

import { useEffect, useState } from 'react'
import { listCities } from '@/lib/api'
import type { City } from '@/types'

interface CitySelectModalProps {
  title: string
  currentCity: string
  onSelect: (city: { id: number; name: string }) => void
  onClose: () => void
}

// Hardcoded hot cities matching prototype
const HOT_CITIES = [
  '北京', '上海', '杭州', '广州',
  '成都', '南京', '重庆', '西安',
  '香港', '深圳', '苏州', '长沙',
  '天津', '青岛', '武汉', '三亚',
  '珠海', '厦门', '沈阳', '济南',
  '澳门', '南昌', '大连', '哈尔滨',
]

// Alphabet index matching prototype
const ALPHABET_INDEX = ['热门', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z']

export default function CitySelectModal({ title, currentCity, onSelect, onClose }: CitySelectModalProps) {
  const [cities, setCities] = useState<City[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'国内(含港澳台)' | '上海热搜'>('国内(含港澳台)')

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    try {
      const res = await listCities()
      setCities(res.data || [])
    } catch {
      // Fallback data if no backend
      setCities([
        { id: 1, name: '北京', name_en: 'Beijing', province: '北京', latitude: 0, longitude: 0, description: null },
        { id: 2, name: '上海', name_en: 'Shanghai', province: '上海', latitude: 0, longitude: 0, description: null },
        { id: 3, name: '杭州', name_en: 'Hangzhou', province: '浙江', latitude: 0, longitude: 0, description: null },
        { id: 4, name: '广州', name_en: 'Guangzhou', province: '广东', latitude: 0, longitude: 0, description: null },
        { id: 5, name: '成都', name_en: 'Chengdu', province: '四川', latitude: 0, longitude: 0, description: null },
        { id: 6, name: '南京', name_en: 'Nanjing', province: '江苏', latitude: 0, longitude: 0, description: null },
        { id: 7, name: '重庆', name_en: 'Chongqing', province: '重庆', latitude: 0, longitude: 0, description: null },
        { id: 8, name: '西安', name_en: "Xi'an", province: '陕西', latitude: 0, longitude: 0, description: null },
        { id: 9, name: '大理', name_en: 'Dali', province: '云南', latitude: 0, longitude: 0, description: null },
      ])
    }
  }

  const filtered = search
    ? cities.filter(c => c.name.includes(search) || c.name_en?.toLowerCase().includes(search.toLowerCase()))
    : cities

  const handleSelect = (city: { id: number; name: string }) => {
    onSelect(city)
    onClose()
  }

  const isHotCity = (name: string) => HOT_CITIES.includes(name)

  return (
    <div className="w-full h-full bg-white flex flex-col relative">
      {/* Top bar — matches prototype: back button + search */}
      <div className="flex items-center pt-[52px] pb-[8px] px-[16px] bg-white shrink-0">
          <div
            className="w-[24px] h-[24px] flex items-center justify-center mr-[12px] cursor-pointer"
            onClick={onClose}
            data-action="go-back"
            data-ai-alt="返回按钮"
          >
            <i className="fas fa-chevron-left text-[18px] text-[#333]"></i>
          </div>
          <div className="flex-1 flex items-center bg-[#F5F5F5] rounded-[16px] h-[36px] px-[16px]">
            <i className="fas fa-search text-[#999] text-[13px] mr-[8px]"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="城市/区域/位置/酒店"
              className="flex-1 bg-transparent border-none text-[14px] text-[#333] outline-none placeholder-[#999]"
              data-ai-alt="搜索输入框"
            />
            {search && (
              <i className="fas fa-times text-[#999] text-[14px] cursor-pointer" onClick={() => setSearch('')}></i>
            )}
          </div>
        </div>

        {/* Tabs — matching prototype tab style */}
        <div className="flex border-b-[1px] border-[#F5F5F5] px-[16px]">
          <div
            onClick={() => setTab('国内(含港澳台)')}
            className="flex-1 flex flex-col items-center justify-center py-[12px] relative cursor-pointer"
          >
            <span className={`text-[16px] font-bold ${tab === '国内(含港澳台)' ? 'text-[#333]' : 'text-[#666]'}`}>
              国内(含港澳台)
            </span>
            {tab === '国内(含港澳台)' && (
              <div className="absolute bottom-0 w-[80px] h-[3px] bg-[#0052D9] rounded-full"></div>
            )}
          </div>
          <div
            onClick={() => setTab('上海热搜')}
            className="flex-1 flex items-center justify-center py-[12px] cursor-pointer"
          >
            <span className={`text-[15px] ${tab === '上海热搜' ? 'text-[#333] font-bold' : 'text-[#666]'}`}>
              上海热搜
            </span>
          </div>
        </div>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto pb-[20px]">
          {search ? (
            /* Search results — flat list */
            <div className="px-[16px] pt-[12px] space-y-[2px]">
              {filtered.length === 0 ? (
                <div className="text-center py-[32px] text-[#999] text-[13px]">
                  <i className="fas fa-search text-[24px] mb-[8px] block"></i>
                  未找到城市
                </div>
              ) : (
                filtered.map(city => (
                  <div
                    key={city.id}
                    onClick={() => handleSelect({ id: city.id, name: city.name })}
                    className={`flex items-center justify-between px-[12px] py-[10px] rounded-[10px] cursor-pointer ${
                      city.name === currentCity ? 'bg-[#F0F5FF]' : 'hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-[28px] h-[28px] bg-gradient-to-br from-[#EBF2FF] to-[#C5D9FF] rounded-full flex items-center justify-center mr-[10px]">
                        <i className="fas fa-map-marker-alt text-[#0052D9] text-[12px]"></i>
                      </div>
                      <div>
                        <div className="text-[14px] text-[#333] font-medium">{city.name}</div>
                        {city.province && (
                          <div className="text-[11px] text-[#999]">{city.province}</div>
                        )}
                      </div>
                    </div>
                    {city.name === currentCity && (
                      <i className="fas fa-check text-[#0052D9] text-[14px]"></i>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : tab === '国内(含港澳台)' ? (
            /* Main view — matching prototype: hot cities + alphabet list */
            <>
              {/* Hot cities grid — matching prototype layout */}
              <div className="px-[16px] pt-[16px]">
                <div className="text-[15px] font-bold text-[#333] mb-[12px]">国内热门城市</div>
                <div className="flex flex-wrap gap-x-[12px] gap-y-[12px] pr-[20px]" data-ai-list="true">
                  {HOT_CITIES.map((city, index) => {
                    const matched = cities.find(c => c.name === city)
                    const isSelected = city === currentCity
                    return (
                      <div
                        key={index}
                        onClick={() => handleSelect(matched || { id: index + 1, name: city })}
                        className={`w-[calc((100%-36px)/4)] h-[36px] flex items-center justify-center rounded-[4px] text-[14px] cursor-pointer
                          ${isSelected
                            ? 'bg-[#F0F5FF] border-[1px] border-[#0052D9] text-[#0052D9]'
                            : 'bg-[#F5F5F5] text-[#333]'
                          }`}
                        data-ai-alt={`${city}按钮`}
                      >
                        {city}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Alphabet-indexed city list — matching prototype */}
              <div className="mt-[20px]">
                {/* Group cities by first character for alphabet sections */}
                {cities.length > 0 && (
                  <div className="px-[16px] py-[8px]">
                    <span className="text-[15px] font-bold text-[#333]">推荐</span>
                  </div>
                )}
                <div className="flex flex-col" data-ai-list="true">
                  {cities
                    .filter(c => !isHotCity(c.name))
                    .slice(0, 20)
                    .map((city, index) => (
                      <div
                        key={city.id || index}
                        onClick={() => handleSelect({ id: city.id, name: city.name })}
                        className="h-[48px] flex items-center px-[16px] border-b-[1px] border-[#F5F5F5] ml-[16px] pl-0 cursor-pointer"
                        data-ai-alt={`${city.name}列表项`}
                      >
                        <span className="text-[15px] text-[#333]">{city.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            /* 上海热搜 tab — show hot cities focused on Shanghai */
            <div className="px-[16px] pt-[16px]">
              <div className="text-[15px] font-bold text-[#333] mb-[12px]">上海热门搜索</div>
              <div className="flex flex-wrap gap-x-[12px] gap-y-[12px] pr-[20px]" data-ai-list="true">
                {HOT_CITIES.slice(0, 12).map((city, index) => {
                  const matched = cities.find(c => c.name === city)
                  const isSelected = city === currentCity
                  return (
                    <div
                      key={index}
                      onClick={() => handleSelect(matched || { id: index + 1, name: city })}
                      className={`w-[calc((100%-36px)/4)] h-[36px] flex items-center justify-center rounded-[4px] text-[14px] cursor-pointer
                        ${isSelected
                          ? 'bg-[#F0F5FF] border-[1px] border-[#0052D9] text-[#0052D9]'
                          : 'bg-[#F5F5F5] text-[#333]'
                        }`}
                      data-ai-alt={`${city}按钮`}
                    >
                      {city}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side alphabet navigation — matching prototype */}
        {!search && (
          <div className="absolute right-[4px] top-[140px] flex flex-col items-center z-20" style={{ top: '140px' }}>
            {ALPHABET_INDEX.map((letter, index) => (
              <div
                key={index}
                className="text-[#0052D9] text-[10px] py-[2px] font-medium cursor-pointer leading-[1.1]"
                data-ai-alt={`索引${letter}`}
              >
                {letter}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
