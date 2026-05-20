import type {
  ApiResponse,
  City,
  Destination,
  GenerateTaskStatus,
  Itinerary,
  PaginatedData,
  Preference,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) {
    let msg = `API ${res.status}: ${res.statusText}`
    try {
      const body = await res.json()
      if (body.message) msg = body.message
      else if (body.detail) msg = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch { /* ignore parse errors */ }
    throw new Error(msg)
  }
  return res.json()
}

// ─── Cities ───

export async function listCities(keyword?: string): Promise<ApiResponse<City[]>> {
  const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
  return request(`/api/v1/cities${params}`)
}

// ─── POIs ───

export async function listPoiCategories(): Promise<ApiResponse<{ category: string; label: string }[]>> {
  return request('/api/v1/pois/categories')
}

export async function searchPois(params: {
  city_id?: number
  city_name?: string
  category?: string
  keyword?: string
}): Promise<ApiResponse<PaginatedData<import('@/types').POI>>> {
  const qs = new URLSearchParams()
  if (params.city_id) qs.set('city_id', String(params.city_id))
  if (params.city_name) qs.set('city_name', params.city_name)
  if (params.category) qs.set('category', params.category)
  if (params.keyword) qs.set('keyword', params.keyword)
  return request(`/api/v1/pois?${qs.toString()}`)
}

// ─── Itineraries ───

export async function generateItinerary(data: {
  destinations: Destination[]
  departure_city?: string
  departure_city_id?: number
  travelers?: { adults: number; children: number; elders: number }
  special_needs?: string[]
  notes?: string
  preferences?: Partial<Preference>
  total_budget?: number
}): Promise<ApiResponse<{ task_id: string; status: string }>> {
  return request('/api/v1/itineraries/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTaskStatus(taskId: string): Promise<ApiResponse<GenerateTaskStatus>> {
  return request(`/api/v1/itineraries/generate/${taskId}/status`)
}

export async function listItineraries(params?: {
  page?: number
  size?: number
}): Promise<ApiResponse<Itinerary[]>> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.size) qs.set('size', String(params.size))
  return request(`/api/v1/itineraries?${qs.toString()}`)
}

export async function getItinerary(id: number): Promise<ApiResponse<Itinerary>> {
  return request(`/api/v1/itineraries/${id}`)
}

// ─── SSE Streaming ───

export function streamGeneration(
  taskId: string,
  callbacks: {
    onThought?: (data: Record<string, unknown>) => void
    onToolCall?: (data: { name: string; input: unknown }) => void
    onToolResult?: (data: { name: string; output: string }) => void
    onProgress?: (data: { progress: number; current_stage: string }) => void
    onComplete?: (data: { itinerary_id: number }) => void
    onError?: (error: string) => void
  },
): () => void {
  let finished = false
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 5

  function finish() {
    finished = true
    es.close()
    clearInterval(pollTimer)
  }

  const es = new EventSource(`/api/v1/itineraries/generate/stream/${taskId}`)

  es.onmessage = (event) => {
    if (finished) return
    try {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'thought':
          callbacks.onThought?.(msg.data)
          break
        case 'tool_call':
          callbacks.onToolCall?.(msg.data as { name: string; input: unknown })
          break
        case 'tool_result':
          callbacks.onToolResult?.(msg.data as { name: string; output: string })
          break
        case 'progress':
          callbacks.onProgress?.(msg.data as { progress: number; current_stage: string })
          break
        case 'complete':
          callbacks.onComplete?.(msg.data as { itinerary_id: number })
          finish()
          break
        case 'error':
          callbacks.onError?.(String(msg.data?.message || '未知错误'))
          finish()
          break
      }
    } catch { /* ignore parse errors */ }
  }

  // EventSource auto-reconnects on connection loss.
  // Only give up after MAX_RECONNECT_ATTEMPTS consecutive errors.
  es.onerror = () => {
    reconnectAttempts++
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && !finished) {
      finished = true
      callbacks.onError?.('连接断开，请刷新页面重试')
      es.close()
      clearInterval(pollTimer)
    }
  }

  // Polling fallback: check Redis task status periodically
  // in case SSE never delivers the terminal event.
  const pollTimer = setInterval(async () => {
    if (finished) return
    try {
      const res = await fetch(`/api/v1/itineraries/generate/${taskId}/status`)
      const body = await res.json()
      const task = body.data
      if (!task) return
      if (task.status === 'completed' && task.itinerary_id) {
        callbacks.onComplete?.({ itinerary_id: task.itinerary_id })
        finish()
      } else if (task.status === 'failed') {
        callbacks.onError?.(task.error || '生成失败')
        finish()
      }
    } catch { /* polling error, try again next interval */ }
  }, 3000)

  return () => {
    finished = true
    es.close()
    clearInterval(pollTimer)
  }
}

export async function confirmItinerary(id: number): Promise<ApiResponse<null>> {
  return request(`/api/v1/itineraries/${id}/confirm`, { method: 'POST' })
}

export async function refinItinerary(
  id: number,
  feedback: string,
): Promise<ApiResponse<{ task_id: string; status: string }>> {
  return request(`/api/v1/itineraries/${id}/refine`, {
    method: 'POST',
    body: JSON.stringify({ feedback }),
  })
}
