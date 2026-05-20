'use client'

import { useState } from 'react'

interface DateSelectModalProps {
  onClose: () => void
  onConfirm: (startDate: string, days: number) => void
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${m}月${d}日`
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function DateSelectModal({ onClose, onConfirm }: DateSelectModalProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [startDay, setStartDay] = useState<number | null>(null)
  const [endDay, setEndDay] = useState<number | null>(null)

  const daysInMonth = getDaysInMonth(year, month)

  const firstDayOfWeek = new Date(year, month, 1).getDay()

  function handleDayClick(day: number) {
    if (!startDay || (startDay && endDay)) {
      setStartDay(day)
      setEndDay(null)
    } else {
      if (day < startDay) {
        setStartDay(day)
        setEndDay(null)
      } else {
        setEndDay(day)
      }
    }
  }

  function isInRange(day: number): boolean {
    if (!startDay) return false
    if (endDay) return day >= startDay && day <= endDay
    return day === startDay
  }

  const totalDays = startDay && endDay ? endDay - startDay + 1 : 0

  function handleConfirm() {
    if (!startDay) return
    const startDate = new Date(year, month, startDay)
    const days = endDay ? endDay - startDay + 1 : 1
    onConfirm(toISODate(startDate), days)
    onClose()
  }

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
    setStartDay(null)
    setEndDay(null)
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
    setStartDay(null)
    setEndDay(null)
  }

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-[400px] rounded-t-[20px] px-[20px] pt-[24px] pb-[calc(16px+env(safe-area-inset-bottom))] shadow-lg">
        {/* Handle */}
        <div className="w-[36px] h-[4px] bg-[#E0E0E0] rounded-full mx-auto mb-[16px]"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-[20px]">
          <div className="flex items-center space-x-[4px]">
            <span className="text-[17px] font-bold text-[#333]">{year}年</span>
            <span className="text-[17px] font-bold text-[#333]">{monthNames[month]}</span>
          </div>
          <div className="flex items-center space-x-[16px]">
            <button onClick={prevMonth} className="w-[28px] h-[28px] rounded-full bg-[#F5F6F8] flex items-center justify-center">
              <i className="fas fa-chevron-left text-[#999] text-[12px]"></i>
            </button>
            <button onClick={nextMonth} className="w-[28px] h-[28px] rounded-full bg-[#F5F6F8] flex items-center justify-center">
              <i className="fas fa-chevron-right text-[#999] text-[12px]"></i>
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 mb-[8px]">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-center text-[12px] text-[#999] font-medium h-[32px] flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for first day offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-[40px]"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const selected = isInRange(day)
            const isStart = day === startDay
            const isEnd = day === endDay

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-[40px] flex items-center justify-center relative cursor-pointer text-[14px] ${
                  selected ? 'text-white font-medium' : 'text-[#333]'
                } ${isToday && !selected ? 'font-bold' : ''} ${
                  isStart ? 'rounded-l-full' : ''
                } ${isEnd ? 'rounded-r-full' : ''}`}
              >
                {(isStart || isEnd) && (
                  <div className="absolute inset-0 bg-[#2C68FF] rounded-full"></div>
                )}
                {selected && !isStart && !isEnd && (
                  <div className="absolute inset-0 bg-[#EBF2FF]"></div>
                )}
                <span className="relative z-10">{day}</span>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {startDay && (
          <div className="mt-[16px] bg-[#F5F7FA] rounded-[10px] p-[12px] flex items-center justify-between">
            <div className="flex items-center">
              <i className="far fa-calendar-alt text-[#2C68FF] text-[14px] mr-[8px]"></i>
              <span className="text-[13px] text-[#333]">
                {formatDate(new Date(year, month, startDay))}
                {endDay && ` - ${formatDate(new Date(year, month, endDay))}`}
              </span>
            </div>
            {totalDays > 0 && (
              <span className="bg-[#EAF2FF] text-[#2C68FF] text-[11px] px-[8px] py-[2px] rounded-[4px]">
                共{totalDays}天{totalDays - 1}晚
              </span>
            )}
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!startDay}
          className="w-full h-[44px] bg-[#2C68FF] rounded-[22px] text-white text-[15px] font-bold mt-[16px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(44,104,255,0.3)]"
        >
          确定
        </button>
      </div>
    </div>
  )
}
