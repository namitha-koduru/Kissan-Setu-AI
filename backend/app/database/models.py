import uuid
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
    JSON,
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
    conversations = relationship("Conversation", back_populates="farmer", cascade="all, delete-orphan")
    images = relationship("CropImage", back_populates="farmer", cascade="all, delete-orphan")
    soil_profile = relationship("SoilProfile", back_populates="farmer", uselist=False, cascade="all, delete-orphan")


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
    images = relationship("CropImage", back_populates="crop")


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
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)  # Primary benchmark (modal price)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    modal_price = Column(Float, nullable=True)
    arrival_quantity = Column(Float, nullable=True)  # in Quintals / MT
    source = Column(String(100), default="APMC Mandi Bulletin")  # "APMC Mandi", "Agmarknet Feed", "Demo Mandi Benchmark"
    unit = Column(String(20), default="kg")
    date = Column(String(50), nullable=False, index=True)

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


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(50), primary_key=True, index=True)  # UUID string
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), default="New Farming Advisory")
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="conversations")
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(50), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    image_id = Column(String(50), ForeignKey("crop_images.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    image = relationship("CropImage")


class CropImage(Base):
    __tablename__ = "crop_images"

    id = Column(String(50), primary_key=True, default=lambda: f"img_{uuid.uuid4().hex[:12]}", index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True)
    conversation_id = Column(String(50), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    image_url = Column(String(500), nullable=False)
    cloudinary_public_id = Column(String(255), nullable=True)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="images")
    crop = relationship("Crop", back_populates="images")
    conversation = relationship("Conversation")
    analyses = relationship("ImageAnalysis", back_populates="image", cascade="all, delete-orphan")


class ImageAnalysis(Base):
    __tablename__ = "image_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    image_id = Column(String(50), ForeignKey("crop_images.id", ondelete="CASCADE"), nullable=False, index=True)
    detected_crop = Column(String(100), nullable=True)
    image_quality = Column(String(20), default="good")  # "good", "fair", "poor"
    observed_symptoms = Column(JSON, nullable=True)      # JSON list of strings
    possible_issues = Column(JSON, nullable=True)        # JSON list of {name, confidence}
    confidence = Column(Float, nullable=True)
    analysis_text = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)        # JSON list of strings
    model_name = Column(String(100), default="gemini-1.5-flash")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    image = relationship("CropImage", back_populates="analyses")


class SoilProfile(Base):
    __tablename__ = "soil_profiles"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    soil_type = Column(String(100), default="Black")  # Black, Red, Alluvial, Loamy, Sandy, Clay, Laterite, Other
    ph = Column(Float, nullable=True)
    nitrogen = Column(Float, nullable=True)       # kg/ha or rating
    phosphorus = Column(Float, nullable=True)     # kg/ha or rating
    potassium = Column(Float, nullable=True)      # kg/ha or rating
    organic_carbon = Column(Float, nullable=True) # % (e.g. 0.55%)
    moisture = Column(Float, nullable=True)       # % (e.g. 24.0%)
    source = Column(String(100), default="Self Reported")  # e.g., "Soil Health Card", "Lab Test", "Self Reported"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="soil_profile")

