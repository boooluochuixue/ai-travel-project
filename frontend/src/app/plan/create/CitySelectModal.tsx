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

export default function CitySelectModal({ title, currentCity, onSelect, onClose }: CitySelectModalProps) {
  const [cities, setCities] = useState<City[]>([])
  const [search, setSearch] = useState('')

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
        { id: 3, name: '成都', name_en: 'Chengdu', province: '四川', latitude: 0, longitude: 0, description: null },
        { id: 4, name: '西安', name_en: 'Xi\'an', province: '陕西', latitude: 0, longitude: 0, description: null },
        { id: 5, name: '大理', name_en: 'Dali', province: '云南', latitude: 0, longitude: 0, description: null },
      ])
    }
  }

  const filtered = search
    ? cities.filter(c => c.name.includes(search) || c.name_en?.toLowerCase().includes(search.toLowerCase()))
    : cities

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-[400px] rounded-t-[20px] flex flex-col max-h-[70vh] shadow-lg">
        {/* Handle */}
        <div className="w-[36px] h-[4px] bg-[#E0E0E0] rounded-full mx-auto mt-[8px] mb-[12px]"></div>

        {/* Title */}
        <div className="px-[20px] pb-[12px] border-b border-[#F5F5F5]">
          <h2 className="text-[17px] font-bold text-[#333] text-center">{title}</h2>
        </div>

        {/* Search */}
        <div className="px-[20px] py-[12px]">
          <div className="flex items-center bg-[#F5F6F8] rounded-[10px] px-[12px] h-[36px]">
            <i className="fas fa-search text-[#999] text-[14px] mr-[8px]"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索城市"
              className="flex-1 bg-transparent text-[13px] text-[#333] placeholder-[#999] outline-none border-0"
            />
            {search && (
              <i className="fas fa-times text-[#999] text-[14px] cursor-pointer" onClick={() => setSearch('')}></i>
            )}
          </div>
        </div>

        {/* City list */}
        <div className="flex-1 overflow-y-auto px-[20px] pb-[20px]">
          {filtered.length === 0 ? (
            <div className="text-center py-[32px] text-[#999] text-[13px]">
              <i className="fas fa-search text-[24px] mb-[8px] block"></i>
              未找到城市
            </div>
          ) : (
            <div className="space-y-[2px]">
              {filtered.map(city => (
                <div
                  key={city.id}
                  onClick={() => onSelect({ id: city.id, name: city.name })}
                  className={`flex items-center justify-between px-[12px] py-[10px] rounded-[10px] cursor-pointer ${
                    city.name === currentCity ? 'bg-[#F4F7FF]' : 'hover:bg-[#F5F6F8]'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-[28px] h-[28px] bg-gradient-to-br from-[#EBF2FF] to-[#C5D9FF] rounded-full flex items-center justify-center mr-[10px]">
                      <i className="fas fa-map-marker-alt text-[#2C68FF] text-[12px]"></i>
                    </div>
                    <div>
                      <div className="text-[14px] text-[#333] font-medium">{city.name}</div>
                      {city.province && (
                        <div className="text-[11px] text-[#999]">{city.province}</div>
                      )}
                    </div>
                  </div>
                  {city.name === currentCity && (
                    <i className="fas fa-check text-[#2C68FF] text-[14px]"></i>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
