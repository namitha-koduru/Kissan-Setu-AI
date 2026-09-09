from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Transaction, Lot, Buyer, Crop
from app.schemas.transaction import TransactionCreate, TransactionStatusUpdate, TransactionResponse, PaymentMethodUpdate
from app.schemas.buyer_matching import (
    TransactionDetailResponse,
    LogisticsUpdateRequest,
    PaymentRecordRequest,
    DisputeCreateRequest,
    DisputeResolveRequest,
    DisputeResponse,
)
from app.services.transaction_service import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=List[TransactionResponse])
def get_all_transactions(
    farmer_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if farmer_id:
        query = query.filter(Transaction.farmer_id == farmer_id)
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    
    txs = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    res = []
    for t in txs:
        b = db.query(Buyer).filter(Buyer.id == t.buyer_id).first() if t.buyer_id else None
        lot = db.query(Lot).filter(Lot.id == t.lot_id).first() if t.lot_id else None
        crop = db.query(Crop).filter(Crop.id == lot.crop_id).first() if lot and lot.crop_id else None
        
        r = TransactionResponse.model_validate(t)
        if b:
            r.buyer_name = b.name
        if crop:
            r.crop_name = crop.crop_name
        res.append(r)
    return res


@router.get("/{transaction_id}/detail", response_model=TransactionDetailResponse)
def get_transaction_full_detail(transaction_id: int, db: Session = Depends(get_db)):
    """Fetch complete transaction details with fulfillment timeline, logistics, payment tracking, and disputes."""
    return transaction_service.get_transaction_detail(db=db, transaction_id=transaction_id)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found"
        )
    b = db.query(Buyer).filter(Buyer.id == tx.buyer_id).first() if tx.buyer_id else None
    lot = db.query(Lot).filter(Lot.id == tx.lot_id).first() if tx.lot_id else None
    crop = db.query(Crop).filter(Crop.id == lot.crop_id).first() if lot and lot.crop_id else None
    
    r = TransactionResponse.model_validate(tx)
    if b:
        r.buyer_name = b.name
    if crop:
        r.crop_name = crop.crop_name
    return r


@router.post("/{transaction_id}/logistics", response_model=TransactionDetailResponse)
def update_transaction_logistics(transaction_id: int, req: LogisticsUpdateRequest, db: Session = Depends(get_db)):
    """Update logistics pickup scheduling, dispatch, transit, and delivery status."""
    transaction_service.update_logistics(db=db, transaction_id=transaction_id, req=req)
    return transaction_service.get_transaction_detail(db=db, transaction_id=transaction_id)


@router.put("/{transaction_id}/payment", response_model=TransactionDetailResponse)
def record_transaction_payment(transaction_id: int, req: PaymentRecordRequest, db: Session = Depends(get_db)):
    """Record payment receipt status (Tracking only, no real payment gateway charged)."""
    transaction_service.record_payment(db=db, transaction_id=transaction_id, req=req)
    return transaction_service.get_transaction_detail(db=db, transaction_id=transaction_id)


@router.post("/{transaction_id}/dispute", response_model=DisputeResponse)
def file_transaction_dispute(transaction_id: int, req: DisputeCreateRequest, db: Session = Depends(get_db)):
    """Raise a formal grievance or dispute regarding payment, quantity, quality, or delivery."""
    dispute = transaction_service.create_dispute(db=db, transaction_id=transaction_id, req=req)
    return DisputeResponse.model_validate(dispute)


@router.put("/disputes/{dispute_id}/resolve", response_model=DisputeResponse)
def resolve_dispute(dispute_id: int, req: DisputeResolveRequest, db: Session = Depends(get_db)):
    """Resolve or update status of an active dispute."""
    dispute = transaction_service.resolve_dispute(db=db, dispute_id=dispute_id, req=req)
    return DisputeResponse.model_validate(dispute)


@router.put("/{transaction_id}/status", response_model=TransactionResponse)
def update_transaction_status(transaction_id: int, status_in: TransactionStatusUpdate, db: Session = Depends(get_db)):
    """Advance transaction status through state machine."""
    tx = transaction_service.update_transaction_status(db=db, transaction_id=transaction_id, new_status=status_in.status, note=status_in.note)
    return TransactionResponse.model_validate(tx)


@router.post("/{transaction_id}/payment-method", response_model=TransactionResponse)
def set_transaction_payment_method(transaction_id: int, pm_in: PaymentMethodUpdate, db: Session = Depends(get_db)):
    """Select payment method (Razorpay or COD with transparent charge if any)."""
    tx = transaction_service.select_payment_method(
        db=db,
        transaction_id=transaction_id,
        payment_method=pm_in.payment_method,
        cod_charge=pm_in.cod_charge or 0.0
    )
    return TransactionResponse.model_validate(tx)

