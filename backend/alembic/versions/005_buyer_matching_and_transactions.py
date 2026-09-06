"""Enhance buyers, lots, offers, transactions and add transaction_events and disputes

Revision ID: 005_buyer_transac
Revises: 004_market_intel
Create Date: 2026-09-06 22:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '005_buyer_transac'
down_revision: Union[str, None] = '004_market_intel'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1. Update buyers table
    buyer_cols = [c['name'] for c in insp.get_columns('buyers')]
    if 'verification_status' not in buyer_cols:
        op.add_column('buyers', sa.Column('verification_status', sa.String(length=50), server_default='UNVERIFIED', nullable=True))
    if 'preferred_crops' not in buyer_cols:
        op.add_column('buyers', sa.Column('preferred_crops', sa.JSON(), nullable=True))
    if 'min_quantity_qtl' not in buyer_cols:
        op.add_column('buyers', sa.Column('min_quantity_qtl', sa.Float(), nullable=True))
    if 'max_quantity_qtl' not in buyer_cols:
        op.add_column('buyers', sa.Column('max_quantity_qtl', sa.Float(), nullable=True))
    if 'preferred_quality' not in buyer_cols:
        op.add_column('buyers', sa.Column('preferred_quality', sa.String(length=50), server_default='Grade A', nullable=True))
    if 'indicative_price_per_kg' not in buyer_cols:
        op.add_column('buyers', sa.Column('indicative_price_per_kg', sa.Float(), nullable=True))
    if 'payment_reliability_score' not in buyer_cols:
        op.add_column('buyers', sa.Column('payment_reliability_score', sa.Float(), server_default='90.0', nullable=True))
    if 'procurement_radius_km' not in buyer_cols:
        op.add_column('buyers', sa.Column('procurement_radius_km', sa.Float(), server_default='100.0', nullable=True))
    if 'business_type' not in buyer_cols:
        op.add_column('buyers', sa.Column('business_type', sa.String(length=100), server_default='Enterprise Buyer', nullable=True))

    # 2. Update lots table
    lot_cols = [c['name'] for c in insp.get_columns('lots')]
    if 'unit' not in lot_cols:
        op.add_column('lots', sa.Column('unit', sa.String(length=20), server_default='kg', nullable=True))
    if 'image_id' not in lot_cols:
        op.add_column('lots', sa.Column('image_id', sa.String(length=50), sa.ForeignKey('crop_images.id', ondelete='SET NULL'), nullable=True))
    if 'preferred_buyer_id' not in lot_cols:
        op.add_column('lots', sa.Column('preferred_buyer_id', sa.Integer(), sa.ForeignKey('buyers.id', ondelete='SET NULL'), nullable=True))
    if 'quality_description' not in lot_cols:
        op.add_column('lots', sa.Column('quality_description', sa.Text(), nullable=True))
    if 'harvest_window' not in lot_cols:
        op.add_column('lots', sa.Column('harvest_window', sa.String(length=100), nullable=True))

    # 3. Update offers table
    offer_cols = [c['name'] for c in insp.get_columns('offers')]
    if 'counter_price' not in offer_cols:
        op.add_column('offers', sa.Column('counter_price', sa.Float(), nullable=True))
    if 'quantity_kg' not in offer_cols:
        op.add_column('offers', sa.Column('quantity_kg', sa.Float(), nullable=True))
    if 'quality_grade' not in offer_cols:
        op.add_column('offers', sa.Column('quality_grade', sa.String(length=50), server_default='Grade A', nullable=True))
    if 'message' not in offer_cols:
        op.add_column('offers', sa.Column('message', sa.Text(), nullable=True))
    if 'parent_offer_id' not in offer_cols:
        op.add_column('offers', sa.Column('parent_offer_id', sa.Integer(), sa.ForeignKey('offers.id', ondelete='SET NULL'), nullable=True))
    if 'expires_at' not in offer_cols:
        op.add_column('offers', sa.Column('expires_at', sa.DateTime(), nullable=True))
    if 'updated_at' not in offer_cols:
        op.add_column('offers', sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True))

    # 4. Update transactions table
    tx_cols = [c['name'] for c in insp.get_columns('transactions')]
    if 'farmer_id' not in tx_cols:
        op.add_column('transactions', sa.Column('farmer_id', sa.Integer(), sa.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=True))
    if 'buyer_id' not in tx_cols:
        op.add_column('transactions', sa.Column('buyer_id', sa.Integer(), sa.ForeignKey('buyers.id', ondelete='CASCADE'), nullable=True))
    if 'offer_id' not in tx_cols:
        op.add_column('transactions', sa.Column('offer_id', sa.Integer(), sa.ForeignKey('offers.id', ondelete='SET NULL'), nullable=True))
    if 'quantity_kg' not in tx_cols:
        op.add_column('transactions', sa.Column('quantity_kg', sa.Float(), nullable=True))
    if 'total_amount' not in tx_cols:
        op.add_column('transactions', sa.Column('total_amount', sa.Float(), nullable=True))
    if 'logistics_status' not in tx_cols:
        op.add_column('transactions', sa.Column('logistics_status', sa.String(length=50), server_default='NOT_SCHEDULED', nullable=True))
    if 'pickup_date' not in tx_cols:
        op.add_column('transactions', sa.Column('pickup_date', sa.String(length=100), nullable=True))
    if 'pickup_location' not in tx_cols:
        op.add_column('transactions', sa.Column('pickup_location', sa.String(length=255), nullable=True))
    if 'delivery_location' not in tx_cols:
        op.add_column('transactions', sa.Column('delivery_location', sa.String(length=255), nullable=True))
    if 'transport_cost_actual' not in tx_cols:
        op.add_column('transactions', sa.Column('transport_cost_actual', sa.Float(), nullable=True))
    if 'payment_status' not in tx_cols:
        op.add_column('transactions', sa.Column('payment_status', sa.String(length=50), server_default='PENDING', nullable=True))
    if 'expected_amount' not in tx_cols:
        op.add_column('transactions', sa.Column('expected_amount', sa.Float(), nullable=True))
    if 'paid_amount' not in tx_cols:
        op.add_column('transactions', sa.Column('paid_amount', sa.Float(), server_default='0.0', nullable=True))
    if 'payment_date' not in tx_cols:
        op.add_column('transactions', sa.Column('payment_date', sa.String(length=100), nullable=True))
    if 'payment_reference' not in tx_cols:
        op.add_column('transactions', sa.Column('payment_reference', sa.String(length=100), nullable=True))
    if 'updated_at' not in tx_cols:
        op.add_column('transactions', sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True))

    # 5. Create transaction_events table
    if 'transaction_events' not in insp.get_table_names():
        op.create_table(
            'transaction_events',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('transaction_id', sa.Integer(), sa.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('stage_label', sa.String(length=100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('done', sa.Boolean(), default=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        )

    # 6. Create disputes table
    if 'disputes' not in insp.get_table_names():
        op.create_table(
            'disputes',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('transaction_id', sa.Integer(), sa.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('raised_by_role', sa.String(length=20), server_default='farmer'),
            sa.Column('raised_by_id', sa.Integer(), nullable=True),
            sa.Column('category', sa.String(length=50), server_default='payment'),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='OPEN'),
            sa.Column('resolution_notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
            sa.Column('resolved_at', sa.DateTime(), nullable=True),
        )


def downgrade() -> None:
    op.drop_table('disputes')
    op.drop_table('transaction_events')
    # Dropping columns on transactions, offers, lots, buyers...
