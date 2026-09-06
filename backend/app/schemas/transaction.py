from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TransactionBase(BaseModel):
    lot_id: int
    final_price: float
    status: Optional[str] = "Offer Accepted"


class TransactionCreate(TransactionBase):
    pass


class TransactionStatusUpdate(BaseModel):
    status: str  # e.g. Escrow Locked, In Transit, Settled, Cancelled


class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
