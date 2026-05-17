from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    JSON,
    Date,
    DateTime,
    DECIMAL as SA_DECIMAL,
    Enum as SA_Enum,
    Float,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.database import Base
from src.models.enums import ItineraryStatus, POICategory, SlotType


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nickname: Mapped[str] = mapped_column(String(64), default="")
    avatar: Mapped[str] = mapped_column(String(512), default="")
    email: Mapped[str] = mapped_column(String(128), default="", unique=True)
    phone: Mapped[str] = mapped_column(String(20), default="")
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, comment="用户偏好")
    status: Mapped[int] = mapped_column(SmallInteger, default=1, comment="0-禁用 1-正常")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    itineraries = relationship("Itinerary", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), comment="中文名")
    name_en: Mapped[str] = mapped_column(String(128), default="")
    country: Mapped[str] = mapped_column(String(64), default="中国")
    province: Mapped[str] = mapped_column(String(64), default="")
    latitude: Mapped[Decimal] = mapped_column(SA_DECIMAL(10, 7), default=0)
    longitude: Mapped[Decimal] = mapped_column(SA_DECIMAL(10, 7), default=0)
    timezone: Mapped[str] = mapped_column(String(32), default="Asia/Shanghai")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[int] = mapped_column(SmallInteger, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    pois = relationship("POI", back_populates="city")


class POI(Base):
    __tablename__ = "pois"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    name: Mapped[str] = mapped_column(String(256))
    category: Mapped[POICategory] = mapped_column(
        SA_Enum(POICategory, length=32, name="poi_category", native_enum=False)
    )
    sub_category: Mapped[str] = mapped_column(String(64), default="")
    address: Mapped[str] = mapped_column(String(512), default="")
    latitude: Mapped[Decimal] = mapped_column(SA_DECIMAL(10, 7), default=0)
    longitude: Mapped[Decimal] = mapped_column(SA_DECIMAL(10, 7), default=0)
    rating: Mapped[float] = mapped_column(Float, default=0, comment="评分 1.0-5.0")
    price_level: Mapped[int] = mapped_column(SmallInteger, default=1, comment="1-便宜 2-中等 3-昂贵")
    opening_hours: Mapped[str] = mapped_column(String(256), default="")
    visit_duration: Mapped[int] = mapped_column(Integer, default=120, comment="建议游览时长(分钟)")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(512), default="")
    status: Mapped[int] = mapped_column(SmallInteger, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    city = relationship("City", back_populates="pois")


class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(256), default="")
    destinations: Mapped[dict] = mapped_column(
        JSON, comment='[{"city_id":1, "city_name":"成都", "days":3}]'
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    total_budget: Mapped[Optional[float]] = mapped_column(SA_DECIMAL(12, 2), nullable=True)
    budget_breakdown: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True, comment='{"transport":0, "hotel":0, "food":0, "tickets":0, "other":0}'
    )
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[ItineraryStatus] = mapped_column(
        SA_Enum(ItineraryStatus, length=16, name="itinerary_status", native_enum=False),
        default=ItineraryStatus.draft,
    )
    raw_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="itineraries")
    days = relationship(
        "ItineraryDay", back_populates="itinerary", cascade="all, delete-orphan",
        order_by="ItineraryDay.day_number"
    )
    feedbacks = relationship("Feedback", back_populates="itinerary")


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    itinerary_id: Mapped[int] = mapped_column(ForeignKey("itineraries.id"))
    day_number: Mapped[int] = mapped_column(Integer, comment="第几天(从1开始)")
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    weather_forecast: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True, comment='{weather, temp_min, temp_max}'
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    itinerary = relationship("Itinerary", back_populates="days")
    slots = relationship(
        "ItinerarySlot", back_populates="day", cascade="all, delete-orphan",
        order_by="ItinerarySlot.sort_order"
    )


class ItinerarySlot(Base):
    __tablename__ = "itinerary_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    day_id: Mapped[int] = mapped_column(ForeignKey("itinerary_days.id"))
    slot_type: Mapped[SlotType] = mapped_column(
        SA_Enum(SlotType, length=16, name="slot_type", native_enum=False)
    )
    poi_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="关联POI(可选)")
    poi_name: Mapped[str] = mapped_column(String(256))
    poi_category: Mapped[str] = mapped_column(String(32), default="")
    address: Mapped[str] = mapped_column(String(512), default="")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    start_time: Mapped[str] = mapped_column(String(16), default="", comment="如 09:00")
    end_time: Mapped[str] = mapped_column(String(16), default="", comment="如 12:00")
    duration: Mapped[int] = mapped_column(Integer, default=120, comment="时长(分钟)")
    transport_tip: Mapped[str] = mapped_column(String(512), default="")
    cost: Mapped[Optional[float]] = mapped_column(SA_DECIMAL(10, 2), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    day = relationship("ItineraryDay", back_populates="slots")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    itinerary_id: Mapped[int] = mapped_column(ForeignKey("itineraries.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(SmallInteger, comment="1-5 星")
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    itinerary = relationship("Itinerary", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")
