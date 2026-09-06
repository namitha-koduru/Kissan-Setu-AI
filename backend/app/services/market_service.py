from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.models import Market, MarketPrice


class MarketService:
    @staticmethod
    def get_all_markets(db: Session) -> List[Market]:
        return db.query(Market).all()

    @staticmethod
    def get_market_by_id(db: Session, market_id: int) -> Optional[Market]:
        return db.query(Market).filter(Market.id == market_id).first()

    @staticmethod
    def get_prices_for_market(db: Session, market_id: int, crop_name: Optional[str] = None) -> List[MarketPrice]:
        query = db.query(MarketPrice).filter(MarketPrice.market_id == market_id)
        if crop_name:
            query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
        return query.order_by(MarketPrice.date.desc()).all()

    @staticmethod
    def get_latest_prices_by_crop(db: Session, crop_name: str) -> List[MarketPrice]:
        return (
            db.query(MarketPrice)
            .filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
            .order_by(MarketPrice.date.desc())
            .all()
        )


market_service = MarketService()
