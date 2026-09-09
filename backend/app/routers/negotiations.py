from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import NegotiationMessage, Lot, Farmer, Buyer

router = APIRouter(tags=["Negotiations"])


class NegotiationMessageCreate(BaseModel):
    lot_id: int
    offer_id: Optional[int] = None
    sender_id: str
    sender_name: str
    sender_role: str = "buyer"  # "farmer", "buyer", "fpo"
    receiver_id: Optional[str] = None
    message: str
    proposed_price: Optional[float] = None
    proposed_quantity: Optional[float] = None


class NegotiationMessageResponse(BaseModel):
    id: int
    lot_id: int
    offer_id: Optional[int] = None
    sender_id: str
    sender_name: str
    sender_role: str
    receiver_id: Optional[str] = None
    message: str
    proposed_price: Optional[float] = None
    proposed_quantity: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/negotiations/lot/{lot_id}", response_model=List[NegotiationMessageResponse])
def get_lot_negotiation_messages(lot_id: int, db: Session = Depends(get_db)):
    """Fetches all negotiation chat messages for a specific produce lot."""
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail=f"Lot with ID {lot_id} not found")
    
    messages = (
        db.query(NegotiationMessage)
        .filter(NegotiationMessage.lot_id == lot_id)
        .order_by(NegotiationMessage.created_at.asc())
        .all()
    )
    return messages


@router.post("/negotiations/lot/{lot_id}/messages", response_model=NegotiationMessageResponse, status_code=status.HTTP_201_CREATED)
def send_negotiation_message(lot_id: int, msg_in: NegotiationMessageCreate, db: Session = Depends(get_db)):
    """Persists a human-to-human transaction bargaining message."""
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail=f"Lot with ID {lot_id} not found")

    new_msg = NegotiationMessage(
        lot_id=lot_id,
        offer_id=msg_in.offer_id,
        sender_id=msg_in.sender_id,
        sender_name=msg_in.sender_name,
        sender_role=msg_in.sender_role,
        receiver_id=msg_in.receiver_id,
        message=msg_in.message.strip(),
        proposed_price=msg_in.proposed_price,
        proposed_quantity=msg_in.proposed_quantity,
        created_at=datetime.utcnow(),
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg
