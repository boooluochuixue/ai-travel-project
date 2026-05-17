from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.models.enums import BudgetLevel, ItineraryStatus, Pace, POICategory, SlotType


# ─── Destination ───

class Destination(BaseModel):
    city_id: int
    city_name: str
    days: int = Field(default=1, ge=1, le=30)


class Preference(BaseModel):
    food_types: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    budget_level: BudgetLevel = BudgetLevel.moderate
    pace: Pace = Pace.normal


# ─── Request ───

class ItineraryGenerateRequest(BaseModel):
    user_id: Optional[int] = None
    destinations: list[Destination] = Field(min_length=1, max_length=5)
    start_date: Optional[date] = None
    preferences: Preference = Field(default_factory=Preference)
    total_budget: Optional[float] = Field(default=None, gt=0)


class ItineraryRefineRequest(BaseModel):
    feedback: str = Field(..., min_length=1, max_length=2000)


# ─── Schedule (Slot / Day) ───

class ItinerarySlotResponse(BaseModel):
    slot_type: SlotType
    poi_id: Optional[int] = None
    poi_name: str
    poi_category: str = ""
    address: str = ""
    start_time: str = ""
    end_time: str = ""
    duration: int = 120
    transport_tip: str = ""
    cost: Optional[float] = None
    note: str = ""
    sort_order: int = 0

    model_config = {"from_attributes": True}


class ItineraryDayResponse(BaseModel):
    day_number: int
    date: Optional[date] = None
    weather_forecast: Optional[dict] = None
    notes: str = ""
    slots: list[ItinerarySlotResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ItineraryResponse(BaseModel):
    id: int
    title: str = ""
    destinations: list[Destination]
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[float] = None
    budget_breakdown: Optional[dict] = None
    preferences: Optional[Preference] = None
    status: ItineraryStatus = ItineraryStatus.draft
    days: list[ItineraryDayResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ItineraryListItem(BaseModel):
    id: int
    title: str
    destinations: list[Destination]
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[float] = None
    status: ItineraryStatus
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Task / Generation ───

class GenerateTaskStatus(BaseModel):
    task_id: str
    status: str  # pending / processing / completed / failed
    progress: float = 0.0
    current_stage: str = ""
    itinerary_id: Optional[int] = None
    error: Optional[str] = None


# ─── POI ───

class POIResponse(BaseModel):
    id: int
    city_id: int
    name: str
    category: POICategory
    sub_category: str = ""
    address: str = ""
    latitude: float = 0
    longitude: float = 0
    rating: float = 0
    price_level: int = 1
    opening_hours: str = ""
    visit_duration: int = 120
    description: Optional[str] = None
    image_url: str = ""

    model_config = {"from_attributes": True}


class POICategoryOption(BaseModel):
    category: str
    label: str


# ─── City ───

class CityResponse(BaseModel):
    id: int
    name: str
    name_en: str = ""
    country: str = "中国"
    province: str = ""
    latitude: float = 0
    longitude: float = 0
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── User ───

class UserCreate(BaseModel):
    nickname: str = Field(default="", max_length=64)
    email: str = Field(default="", max_length=128)
    phone: str = Field(default="", max_length=20)
    preferences: Optional[dict] = None


class UserResponse(BaseModel):
    id: int
    nickname: str = ""
    email: str = ""
    preferences: Optional[dict] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Common ───

class APIResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[dict | list | BaseModel] = None


class PaginatedResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: list
    total: int
    page: int
    size: int
