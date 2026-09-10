from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.database.connection import get_db, SessionLocal
from app.database.models import NegotiationMessage, Lot, Farmer, Buyer
from app.services.websocket_manager import websocket_manager

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
    model_config = ConfigDict(from_attributes=True)

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
async def send_negotiation_message(lot_id: int, msg_in: NegotiationMessageCreate, db: Session = Depends(get_db)):
    """Persists a human-to-human transaction bargaining message and broadcasts live via WebSocket."""
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

    # Broadcast to room WebSocket listeners
    msg_data = {
        "type": "NEW_MESSAGE",
        "lot_id": lot_id,
        "message": {
            "id": new_msg.id,
            "lot_id": new_msg.lot_id,
            "offer_id": new_msg.offer_id,
            "sender_id": new_msg.sender_id,
            "sender_name": new_msg.sender_name,
            "sender_role": new_msg.sender_role,
            "receiver_id": new_msg.receiver_id,
            "message": new_msg.message,
            "proposed_price": new_msg.proposed_price,
            "proposed_quantity": new_msg.proposed_quantity,
            "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
        }
    }
    await websocket_manager.broadcast_to_room(f"lot_{lot_id}", msg_data)

    # Send notification to receiver if identified
    if msg_in.receiver_id:
        await websocket_manager.send_to_user(msg_in.receiver_id, {
            "type": "NOTIFICATION",
            "title": f"New message from {msg_in.sender_name}",
            "body": msg_in.message[:80],
            "lot_id": lot_id,
            "created_at": datetime.utcnow().isoformat(),
        })

    return new_msg


@router.websocket("/ws/negotiations/{lot_id}")
async def websocket_negotiations_endpoint(websocket: WebSocket, lot_id: int):
    """
    Real-Time WebSocket channel for lot-specific live chat and counter-bids.
    """
    room_id = f"lot_{lot_id}"
    await websocket_manager.connect_to_room(websocket, room_id)
    try:
        while True:
            raw_text = await websocket.receive_text()
            # If client sends a direct websocket message
            try:
                import json
                data = json.loads(raw_text)
                db = SessionLocal()
                try:
                    if data.get("type") == "CHAT_MESSAGE":
                        msg = NegotiationMessage(
                            lot_id=lot_id,
                            offer_id=data.get("offer_id"),
                            sender_id=str(data.get("sender_id", "u-1")),
                            sender_name=data.get("sender_name", "Participant"),
                            sender_role=data.get("sender_role", "buyer"),
                            receiver_id=str(data.get("receiver_id", "")) or None,
                            message=data.get("message", "").strip(),
                            proposed_price=data.get("proposed_price"),
                            proposed_quantity=data.get("proposed_quantity"),
                            created_at=datetime.utcnow(),
                        )
                        db.add(msg)
                        db.commit()
                        db.refresh(msg)
                        broadcast_payload = {
                            "type": "NEW_MESSAGE",
                            "lot_id": lot_id,
                            "message": {
                                "id": msg.id,
                                "lot_id": msg.lot_id,
                                "offer_id": msg.offer_id,
                                "sender_id": msg.sender_id,
                                "sender_name": msg.sender_name,
                                "sender_role": msg.sender_role,
                                "receiver_id": msg.receiver_id,
                                "message": msg.message,
                                "proposed_price": msg.proposed_price,
                                "proposed_quantity": msg.proposed_quantity,
                                "created_at": msg.created_at.isoformat(),
                            }
                        }
                        await websocket_manager.broadcast_to_room(room_id, broadcast_payload)
                finally:
                    db.close()
            except Exception as e:
                pass
    except WebSocketDisconnect:
        websocket_manager.disconnect_from_room(websocket, room_id)


@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: str):
    """
    Real-Time WebSocket channel for user in-app notifications.
    """
    await websocket_manager.connect_user(websocket, str(user_id))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect_user(websocket, str(user_id))

