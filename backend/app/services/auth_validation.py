import re
from sqlalchemy.orm import Session
from app.database.models import Farmer, Buyer


def normalize_mobile(mobile: str) -> str:
    """
    Normalizes Indian mobile numbers by extracting the standard 10 digits.
    Handles +91, 91, 0 prefixes and formatting artifacts (spaces, hyphens, parentheses).
    Examples:
      "+91 98480 22338" -> "9848022338"
      "09848022338"     -> "9848022338"
      "9848022338"      -> "9848022338"
    """
    if not mobile:
        return ""
    digits = re.sub(r"\D", "", str(mobile))
    if len(digits) == 12 and digits.startswith("91"):
        return digits[-10:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[-10:]
    if len(digits) >= 10:
        return digits[-10:]
    return digits


def normalize_email(email: str) -> str:
    """Normalizes email address by trimming whitespace and converting to lowercase."""
    if not email:
        return ""
    return str(email).strip().lower()


def check_mobile_exists(db: Session, mobile: str) -> bool:
    """
    Checks if a mobile number is already registered across ALL roles (Farmers, Buyers, FPOs).
    Global uniqueness check.
    """
    norm = normalize_mobile(mobile)
    if not norm or len(norm) < 10:
        return False

    # 1. Check Farmer table
    farmers = db.query(Farmer.phone).filter(Farmer.phone.isnot(None)).all()
    for (p,) in farmers:
        if p and normalize_mobile(p) == norm:
            return True

    # 2. Check Buyer table
    buyers = db.query(Buyer.phone).filter(Buyer.phone.isnot(None)).all()
    for (p,) in buyers:
        if p and normalize_mobile(p) == norm:
            return True

    return False


def check_email_exists(db: Session, email: str) -> bool:
    """
    Checks if an email is already registered across ALL roles.
    Global uniqueness check.
    """
    clean = normalize_email(email)
    if not clean:
        return False

    # 1. Check Farmer table
    farmer = db.query(Farmer.id).filter(
        Farmer.email.isnot(None),
        Farmer.email.ilike(clean)
    ).first()
    if farmer:
        return True

    # 2. Check Buyer table
    buyer = db.query(Buyer.id).filter(
        Buyer.email.isnot(None),
        Buyer.email.ilike(clean)
    ).first()
    if buyer:
        return True

    return False
