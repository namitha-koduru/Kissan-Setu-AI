from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    preferred_language = Column(String(10), default="en")
    state = Column(String(100), default="Maharashtra")
    district = Column(String(100), default="Nashik")
    village = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    crops = relationship("Crop", back_populates="farmer", cascade="all, delete-orphan")
    lots = relationship("Lot", back_populates="farmer", cascade="all, delete-orphan")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), nullable=True)
    acreage = Column(Float, nullable=True)
    quantity = Column(Float, nullable=False)
    sowing_date = Column(String(50), nullable=True)
    expected_harvest_date = Column(String(50), nullable=True)
    growth_stage = Column(String(100), default="Near maturity")
    soil_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="crops")
    lots = relationship("Lot", back_populates="crop", cascade="all, delete-orphan")


class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Maharashtra")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prices = relationship("MarketPrice", back_populates="market", cascade="all, delete-orphan")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    date = Column(String(50), nullable=False)

    # Relationship
    market = relationship("Market", back_populates="prices")


class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    organization = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    verified = Column(Boolean, default=False)
    rating = Column(Float, default=4.5)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lots = relationship("Lot", back_populates="buyer")
    offers = relationship("Offer", back_populates="buyer", cascade="all, delete-orphan")


class Lot(Base):
    __tablename__ = "lots"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, nullable=False)
    asking_price = Column(Float, nullable=False)
    quality = Column(String(50), default="Grade A")
    harvest_date = Column(String(50), nullable=True)
    location = Column(String(255), default="Nashik, Maharashtra")
    status = Column(String(50), default="Open for Offers")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="lots")
    crop = relationship("Crop", back_populates="lots")
    buyer = relationship("Buyer", back_populates="lots")
    offers = relationship("Offer", back_populates="lot", cascade="all, delete-orphan")
    transaction = relationship("Transaction", back_populates="lot", uselist=False, cascade="all, delete-orphan")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=False)
    offered_price = Column(Float, nullable=False)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lot = relationship("Lot", back_populates="offers")
    buyer = relationship("Buyer", back_populates="offers")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), unique=True, nullable=False)
    final_price = Column(Float, nullable=False)
    status = Column(String(50), default="Offer Accepted")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    lot = relationship("Lot", back_populates="transaction")
