"""add_vehicle_document_tables

Revision ID: 8dce96aaba26
Revises: 7d8e9f0a1b2c
Create Date: 2025-11-28 00:59:24.276870

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8dce96aaba26'
down_revision: Union[str, Sequence[str], None] = '7d8e9f0a1b2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. VehicleDocumentType tablosunu oluştur
    op.create_table(
        'vehicle_document_type',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('validity_days', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_vehicle_document_type_code', 'vehicle_document_type', ['code'])
    
    # 2. VehicleDocument tablosunu oluştur
    op.create_table(
        'vehicle_document',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('doc_type_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='MISSING'),
        sa.Column('file_storage_key', sa.String(length=500), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.Column('uploaded_by_user_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('approved_by_user_id', sa.Integer(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('reject_reason', sa.String(length=500), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['vehicle_id'], ['portal_vehicle.id'], ),
        sa.ForeignKeyConstraint(['doc_type_id'], ['vehicle_document_type.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_vehicle_document_vehicle_id', 'vehicle_document', ['vehicle_id'])
    op.create_index('ix_vehicle_document_doc_type_id', 'vehicle_document', ['doc_type_id'])
    op.create_index('ix_vehicle_document_status', 'vehicle_document', ['status'])
    op.create_index('ix_vehicle_document_vehicle_type', 'vehicle_document', ['vehicle_id', 'doc_type_id'])
    
    # 3. Seed data - Zorunlu belge tiplerini ekle
    op.execute("""
        INSERT INTO vehicle_document_type (code, name, is_required, validity_days)
        VALUES 
            ('RUHSAT', 'Araç Ruhsatı', 1, NULL),
            ('MUAYENE', 'Araç Muayene Belgesi', 1, 365),
            ('SIGORTA', 'Araç Sigorta Poliçesi', 1, 365)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_vehicle_document_vehicle_type', 'vehicle_document')
    op.drop_index('ix_vehicle_document_status', 'vehicle_document')
    op.drop_index('ix_vehicle_document_doc_type_id', 'vehicle_document')
    op.drop_index('ix_vehicle_document_vehicle_id', 'vehicle_document')
    op.drop_table('vehicle_document')
    
    op.drop_index('ix_vehicle_document_type_code', 'vehicle_document_type')
    op.drop_table('vehicle_document_type')
