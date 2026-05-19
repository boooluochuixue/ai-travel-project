// ─── API Response Wrapper ───

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  size: number
}

// ─── Model Types ───

export interface City {
  id: number
  name: string
  name_en: string
  province: string
  latitude: number
  longitude: number
  description: string | null
}

export interface POI {
  id: number
  city_id: number
  name: string
  category: 'attraction' | 'restaurant' | 'hotel' | 'shopping' | 'entertainment'
  sub_category: string
  address: string
  latitude: number
  longitude: number
  rating: number
  price_level: number
  opening_hours: string
  visit_duration: number
  description: string | null
}

export interface Destination {
  city_id: number
  city_name: string
  days: number
}

export interface Preference {
  food_types: string[]
  interests: string[]
  budget_level: 'economy' | 'moderate' | 'luxury'
  pace: 'relaxed' | 'normal' | 'intensive'
}

export interface ItinerarySlot {
  slot_type: 'morning' | 'afternoon' | 'evening'
  poi_id: number | null
  poi_name: string
  poi_category: string
  address: string
  start_time: string
  end_time: string
  duration: number
  transport_tip: string
  cost: number | null
  note: string
  sort_order: number
}

export interface HotelInfo {
  name: string
  address: string
  rating: number
  price_level: number
  cost_per_night: number
  room_type: string
  note: string
}

export interface ItineraryDay {
  day_number: number
  date: string | null
  weather_forecast: Record<string, unknown> | null
  hotel: HotelInfo | null
  hotel_options: HotelInfo[] | null
  notes: string
  slots: ItinerarySlot[]
}

export interface Itinerary {
  id: number
  title: string
  destinations: Destination[]
  start_date: string | null
  end_date: string | null
  total_budget: number | null
  budget_breakdown: Record<string, number> | null
  preferences: Preference | null
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  days: ItineraryDay[]
  created_at: string | null
}

export interface GenerateTaskStatus {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_stage: string
  itinerary_id: number | null
  error: string | null
}

// ─── SSE Event Types ───

export interface SSEEvent {
  type: 'thought' | 'tool_call' | 'tool_result' | 'progress' | 'error' | 'complete'
  data: Record<string, unknown>
}

export interface SSEProgressData {
  progress: number
  current_stage: string
}

export interface SSEToolCallData {
  name: string
  input: unknown
}

export interface SSECompleteData {
  itinerary_id: number
  message: string
}
