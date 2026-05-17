'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, Loader2, Lightbulb, Wrench } from 'lucide-react'

import { generateItinerary, streamGeneration } from '@/lib/api'
import type { Destination } from '@/types'

const CITIES = [
  { id: 1, name: '北京' },
  { id: 2, name: '上海' },
  { id: 3, name: '成都' },
  { id: 4, name: '西安' },
  { id: 5, name: '大理' },
]

const INTEREST_OPTIONS = ['历史', '文化', '美食', '自然', '购物', '艺术', '户外', '亲子']

interface ProgressEvent {
  progress: number
  thought?: string
  toolCalls: { name: string; input: unknown }[]
}

export function ItineraryForm() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([
    { city_id: 3, city_name: '成都', days: 3 },
  ])
  const [interests, setInterests] = useState<string[]>(['美食', '历史'])
  const [budgetLevel, setBudgetLevel] = useState<'economy' | 'moderate' | 'luxury'>('moderate')
  const [pace, setPace] = useState<'relaxed' | 'normal' | 'intensive'>('normal')
  const [totalBudget, setTotalBudget] = useState('5000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<ProgressEvent>({ progress: 0, toolCalls: [] })

  function addDestination() {
    setDestinations([...destinations, { city_id: 3, city_name: '成都', days: 1 }])
  }

  function removeDestination(idx: number) {
    if (destinations.length <= 1) return
    setDestinations(destinations.filter((_, i) => i !== idx))
  }

  function updateDestination(idx: number, field: keyof Destination, value: number | string) {
    const updated = [...destinations]
    if (field === 'city_name') {
      const city = CITIES.find(c => c.name === value)
      updated[idx] = { ...updated[idx], city_id: city?.id || 0, city_name: value as string }
    } else if (field === 'days') {
      updated[idx] = { ...updated[idx], days: value as number }
    }
    setDestinations(updated)
  }

  function toggleInterest(interest: string) {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setProgress({ progress: 0, toolCalls: [] })

    try {
      const res = await generateItinerary({
        destinations,
        preferences: {
          interests,
          budget_level: budgetLevel,
          pace,
        },
        total_budget: totalBudget ? Number(totalBudget) : undefined,
      })

      const taskId = res.data.task_id

      // Use EventSource SSE streaming instead of polling
      const abort = streamGeneration(taskId, {
        onThought: (data) => {
          setProgress(prev => ({ ...prev, thought: String(data.content || '') }))
        },
        onToolCall: (data) => {
          setProgress(prev => ({
            ...prev,
            toolCalls: [...prev.toolCalls, { name: data.name, input: data.input }],
          }))
        },
        onProgress: (data) => {
          setProgress(prev => ({ ...prev, progress: data.progress || 0 }))
        },
        onComplete: (data) => {
          setLoading(false)
          router.push(`/itineraries/${data.itinerary_id}`)
        },
        onError: (msg) => {
          setError(msg)
          setLoading(false)
        },
      })

      // Store abort for cleanup
      ;(window as unknown as Record<string, unknown>).__abortStream = abort
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Destinations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">目的地</label>
        <div className="space-y-3">
          {destinations.map((dest, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <select
                value={dest.city_name}
                onChange={e => updateDestination(idx, 'city_name', e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CITIES.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>游玩</span>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={dest.days}
                  onChange={e => updateDestination(idx, 'days', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>天</span>
              </div>
              {destinations.length > 1 && (
                <button type="button" onClick={() => removeDestination(idx)} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addDestination} className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
          <Plus className="w-4 h-4" /> 添加目的地
        </button>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">兴趣偏好</label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => toggleInterest(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                interests.includes(i)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Budget & Pace */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">预算等级</label>
          <select
            value={budgetLevel}
            onChange={e => setBudgetLevel(e.target.value as typeof budgetLevel)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="economy">经济型</option>
            <option value="moderate">舒适型</option>
            <option value="luxury">豪华型</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">行程节奏</label>
          <select
            value={pace}
            onChange={e => setPace(e.target.value as typeof pace)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relaxed">轻松</option>
            <option value="normal">适中</option>
            <option value="intensive">紧凑</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">总预算（元）</label>
          <input
            type="number"
            value={totalBudget}
            onChange={e => setTotalBudget(e.target.value)}
            placeholder="可选"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Progress Panel */}
      {loading && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI 正在规划行程...</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progress.progress * 100)}%` }}
            />
          </div>

          {/* Current thought */}
          {progress.thought && (
            <div className="flex items-start gap-2 text-sm text-blue-600">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="italic">{progress.thought}</span>
            </div>
          )}

          {/* Tool calls */}
          {progress.toolCalls.length > 0 && (
            <div className="space-y-1">
              {progress.toolCalls.map((tc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Wrench className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">{tc.name}</span>
                  <span className="text-gray-400 truncate">
                    {typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            AI 正在规划行程...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            生成行程
          </>
        )}
      </button>
    </form>
  )
}
