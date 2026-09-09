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
    role = Column(String(20), default="farmer")  # "farmer" or "fpo"
    profile_picture_url = Column(String(500), nullable=True)
    organization_name = Column(String(255), nullable=True)
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
    transactions = relationship("Transaction", foreign_keys="[Transaction.farmer_id]", back_populates="farmer", cascade="all, delete-orphan")


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
    image_url = Column(String(500), nullable=True)
    ai_observation = Column(JSON, nullable=True)
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
    phone = Column(String(50), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    profile_picture_url = Column(String(500), nullable=True)
    verified = Column(Boolean, default=False)
    verification_status = Column(String(50), default="UNVERIFIED")  # "VERIFIED", "PENDING", "UNVERIFIED"
    rating = Column(Float, default=4.5)
    preferred_crops = Column(JSON, nullable=True)  # List of crop names e.g. ["Tomato", "Onion"]
    min_quantity_qtl = Column(Float, nullable=True)
    max_quantity_qtl = Column(Float, nullable=True)
    preferred_quality = Column(String(50), default="Grade A")
    indicative_price_per_kg = Column(Float, nullable=True)
    payment_reliability_score = Column(Float, default=90.0)
    procurement_radius_km = Column(Float, default=100.0)
    business_type = Column(String(100), default="Enterprise Buyer")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lots = relationship("Lot", foreign_keys="[Lot.buyer_id]", back_populates="buyer")
    offers = relationship("Offer", back_populates="buyer", cascade="all, delete-orphan")
    transactions = relationship("Transaction", foreign_keys="[Transaction.buyer_id]", back_populates="buyer")


class Lot(Base):
    __tablename__ = "lots"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="SET NULL"), nullable=True)
    image_id = Column(String(50), ForeignKey("crop_images.id", ondelete="SET NULL"), nullable=True)
    preferred_buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    asking_price = Column(Float, nullable=False)
    quality = Column(String(50), default="Grade A")
    quality_description = Column(Text, nullable=True)
    harvest_date = Column(String(50), nullable=True)
    harvest_window = Column(String(100), nullable=True)
    location = Column(String(255), default="Nashik, Maharashtra")
    status = Column(String(50), default="Open for Offers")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="lots")
    crop = relationship("Crop", back_populates="lots")
    buyer = relationship("Buyer", foreign_keys=[buyer_id], back_populates="lots")
    preferred_buyer = relationship("Buyer", foreign_keys=[preferred_buyer_id])
    image = relationship("CropImage")
    offers = relationship("Offer", back_populates="lot", cascade="all, delete-orphan")
    transaction = relationship("Transaction", back_populates="lot", uselist=False, cascade="all, delete-orphan")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=False)
    offered_price = Column(Float, nullable=False)
    counter_price = Column(Float, nullable=True)
    quantity_kg = Column(Float, nullable=True)
    quality_grade = Column(String(50), default="Grade A")
    message = Column(Text, nullable=True)
    parent_offer_id = Column(Integer, ForeignKey("offers.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Pending")  # Pending, Countered, Accepted, Rejected, Expired
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lot = relationship("Lot", back_populates="offers")
    buyer = relationship("Buyer", back_populates="offers")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), unique=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="SET NULL"), nullable=True, index=True)
    quantity_kg = Column(Float, nullable=True)
    final_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=True)
    status = Column(String(50), default="CREATED")  # CREATED, CONFIRMED, PICKUP_SCHEDULED, IN_TRANSIT, DELIVERED, PAYMENT_PENDING, PAYMENT_RECEIVED, COMPLETED, DISPUTED, CANCELLED
    
    # Logistics Tracking
    logistics_status = Column(String(50), default="NOT_SCHEDULED")  # NOT_SCHEDULED, SCHEDULED, PICKED_UP, IN_TRANSIT, DELIVERED
    pickup_date = Column(String(100), nullable=True)
    pickup_location = Column(String(255), nullable=True)
    delivery_location = Column(String(255), nullable=True)
    transport_cost_actual = Column(Float, nullable=True)
    
    # Payment Tracking, Razorpay & COD Fields
    payment_method = Column(String(50), default="RAZORPAY")  # RAZORPAY, COD
    cod_charge = Column(Float, default=0.0)
    payment_status = Column(String(50), default="PENDING")  # PENDING, INITIATED, PARTIAL, RECEIVED, DISPUTED, PAID
    expected_amount = Column(Float, nullable=True)
    paid_amount = Column(Float, default=0.0)
    payment_date = Column(String(100), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lot = relationship("Lot", foreign_keys=[lot_id], back_populates="transaction")
    farmer = relationship("Farmer", foreign_keys=[farmer_id], back_populates="transactions")
    buyer = relationship("Buyer", foreign_keys=[buyer_id], back_populates="transactions")
    offer = relationship("Offer", foreign_keys=[offer_id])
    events = relationship("TransactionEvent", back_populates="transaction", cascade="all, delete-orphan", order_by="TransactionEvent.created_at")
    disputes = relationship("Dispute", back_populates="transaction", cascade="all, delete-orphan", order_by="Dispute.created_at.desc()")
    payments = relationship("Payment", back_populates="transaction", cascade="all, delete-orphan", order_by="Payment.created_at.desc()")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(100), index=True, nullable=True)
    payment_status = Column(String(50), default="Payment Pending")  # Payment Pending, Payment Processing, Payment Successful, Payment Failed, Payment Refunded
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
    signature_verified = Column(Boolean, default=False)
    webhook_status = Column(String(50), default="PENDING")  # PENDING, DELIVERED, VERIFIED, FAILED

    # Relationship
    transaction = relationship("Transaction", back_populates="payments")


class NegotiationMessage(Base):
    """Transaction-specific buyer <-> farmer/FPO bargaining communication."""
    __tablename__ = "negotiation_messages"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.id", ondelete="CASCADE"), nullable=False, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="SET NULL"), nullable=True, index=True)
    sender_id = Column(String(50), nullable=False)
    sender_name = Column(String(255), nullable=False)
    sender_role = Column(String(50), default="buyer")  # "farmer", "buyer", "fpo"
    receiver_id = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    proposed_price = Column(Float, nullable=True)  # e.g. 29.50
    proposed_quantity = Column(Float, nullable=True)  # e.g. 425.0
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lot = relationship("Lot")
    offer = relationship("Offer")


class TransactionEvent(Base):
    __tablename__ = "transaction_events"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_label = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    done = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    transaction = relationship("Transaction", back_populates="events")


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    raised_by_role = Column(String(20), default="farmer")  # "farmer" or "buyer"
    raised_by_id = Column(Integer, nullable=True)
    category = Column(String(50), default="payment")  # payment, quantity, quality, delivery, other
    description = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, UNDER_REVIEW, RESOLVED, REJECTED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationship
    transaction = relationship("Transaction", back_populates="disputes")


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


class KnowledgeDocument(Base):
    """Authoritative Agricultural Knowledge Document (ICAR, SAU, Govt, IMD)."""
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    source_name = Column(String(255), nullable=False)  # e.g., "ICAR-IARI", "MPKV Rahuri", "IMD Agromet"
    source_type = Column(String(50), nullable=False, index=True)  # "ICAR", "AGRICULTURAL_UNIVERSITY", "OFFICIAL_GOVERNMENT", "IMD", "AGRICULTURAL_RESEARCH", "FPO_GUIDE"
    source_url = Column(String(500), nullable=True)
    authority = Column(String(100), default="National Agricultural Research")  # e.g., "High / Verified Government"
    language = Column(String(10), default="en", index=True)
    category = Column(String(50), nullable=False, index=True)  # CROP_PRACTICES, DISEASE_MANAGEMENT, PEST_MANAGEMENT, SOIL, NUTRIENTS, IRRIGATION, STORAGE, POST_HARVEST, MARKETING
    crop = Column(String(100), nullable=True, index=True)  # "Tomato", "Onion", "Grapes", "Chilli", "Potato", "Pomegranate", "Wheat", "Cotton", "General"
    region = Column(String(100), default="Maharashtra", index=True)
    published_date = Column(String(50), nullable=True)
    last_verified_at = Column(String(50), nullable=True)
    content_hash = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    """Semantic chunk with embedding vector and provenance metadata."""
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en", index=True)
    category = Column(String(50), nullable=False, index=True)
    crop = Column(String(100), nullable=True, index=True)
    region = Column(String(100), default="Maharashtra")
    embedding = Column(JSON, nullable=True)  # Float vector stored as JSON array (e.g. 128-dim or 384-dim)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    document = relationship("KnowledgeDocument", back_populates="chunks")


class InventoryItem(Base):
    """Real Inventory / Stock source of truth for Farmers and FPOs."""
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), nullable=True)
    total_quantity = Column(Float, default=0.0, nullable=False)
    allocated_quantity = Column(Float, default=0.0, nullable=False)  # in active open lots
    reserved_quantity = Column(Float, default=0.0, nullable=False)   # in accepted orders
    sold_quantity = Column(Float, default=0.0, nullable=False)       # completed sales
    unit = Column(String(20), default="kg")
    quality_grade = Column(String(50), default="Grade A")
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer")
    adjustments = relationship("StockAdjustment", back_populates="inventory_item", cascade="all, delete-orphan")

    @property
    def available_quantity(self) -> float:
        return max(0.0, round(self.total_quantity - self.allocated_quantity - self.reserved_quantity - self.sold_quantity, 2))


class StockAdjustment(Base):
    """Audit log of stock operations: offline sales, member aggregation, allocations, completions."""
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory_items.id", ondelete="SET NULL"), nullable=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    adjustment_type = Column(String(50), nullable=False)  # "OFFLINE_SALE", "MEMBER_AGGREGATION", "MANUAL_ADJUSTMENT", "LOT_ALLOCATION", "LOT_RELEASE", "ORDER_RESERVED", "ORDER_COMPLETED", "ORDER_CANCELLED"
    quantity = Column(Float, nullable=False)  # e.g. -120.0 or +500.0
    unit = Column(String(20), default="kg")
    customer_name = Column(String(255), nullable=True)
    lot_id = Column(Integer, nullable=True)
    transaction_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="adjustments")
    farmer = relationship("Farmer")



