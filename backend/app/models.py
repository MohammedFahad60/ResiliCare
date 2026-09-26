from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean
)

from datetime import datetime

from .database import Base


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)

    facility_code = Column(String(50), unique=True, index=True)
    name = Column(String(150), nullable=False)

    facility_type = Column(String(50))
    state = Column(String(100))
    district = Column(String(100))

    latitude = Column(Float)
    longitude = Column(Float)

    total_beds = Column(Integer, default=0)
    occupied_beds = Column(Integer, default=0)

    doctors_total = Column(Integer, default=0)
    doctors_available = Column(Integer, default=0)

    nurses_total = Column(Integer, default=0)
    nurses_available = Column(Integer, default=0)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)
    category = Column(String(100))

    dosage_form = Column(String(50))
    strength = Column(String(100))

    unit = Column(String(50))


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)

    facility_id = Column(
        Integer,
        ForeignKey("facilities.id")
    )

    medicine_id = Column(
        Integer,
        ForeignKey("medicines.id")
    )

    current_stock = Column(Integer, default=0)
    daily_consumption = Column(Float, default=0)

    safety_stock = Column(Integer, default=0)

    incoming_quantity = Column(Integer, default=0)
    lead_time_days = Column(Integer, default=0)

    last_updated = Column(
        DateTime,
        default=datetime.utcnow
    )