import enum


class ItineraryStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class SlotType(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"


class POICategory(str, enum.Enum):
    attraction = "attraction"
    restaurant = "restaurant"
    hotel = "hotel"
    shopping = "shopping"
    entertainment = "entertainment"


class BudgetLevel(str, enum.Enum):
    economy = "economy"
    moderate = "moderate"
    luxury = "luxury"


class Pace(str, enum.Enum):
    relaxed = "relaxed"
    normal = "normal"
    intensive = "intensive"
