"""Create TarifeListesi table for tariff versioning

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2025-11-25 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    TarifeListesi tablosu oluştur - Tarih bazlı tarife versiyonlaması
    
    Bir hizmetin farklı tarihlerde farklı fiyatları olabilir:
    - 2025-01-01 → 2025-06-30: 20 USD
    - 2025-07-01 → NULL: 22 USD (aktif)
    """
    
    op.create_table(
        'TarifeListesi',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('HizmetId', sa.Integer(), nullable=False),
        
        # Geçerlilik tarihleri
        sa.Column('ValidFrom', sa.Date(), nullable=False),
        sa.Column('ValidTo', sa.Date(), nullable=True),  # NULL = hala aktif
        
        # Fiyat override (null ise Hizmet.Fiyat kullanılır)
        sa.Column('OverridePrice', sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column('OverrideCurrency', sa.String(length=3), nullable=True),
        
        # Metadata
        sa.Column('IsActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('VersionNote', sa.Text(), nullable=True),  # "2025 Yaz Tarifesi"
        
        # Audit
        sa.Column('CreatedAt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('CreatedBy', sa.Integer(), nullable=True),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.Column('UpdatedBy', sa.Integer(), nullable=True),
        
        # Primary Key
        sa.PrimaryKeyConstraint('Id'),
        
        # Foreign Keys
        sa.ForeignKeyConstraint(['HizmetId'], ['Hizmet.Id'], name='fk_tarifelistesi_hizmet'),
        sa.ForeignKeyConstraint(['CreatedBy'], ['users.id'], name='fk_tarifelistesi_created_by'),
        sa.ForeignKeyConstraint(['UpdatedBy'], ['users.id'], name='fk_tarifelistesi_updated_by'),
    )
    
    # Indexes for efficient queries
    op.create_index('ix_tarifelistesi_hizmet_id', 'TarifeListesi', ['HizmetId'])
    op.create_index('ix_tarifelistesi_valid_from', 'TarifeListesi', ['ValidFrom'])
    op.create_index('ix_tarifelistesi_valid_to', 'TarifeListesi', ['ValidTo'])
    op.create_index('ix_tarifelistesi_is_active', 'TarifeListesi', ['IsActive'])
    
    # Composite index for date range queries
    op.create_index(
        'ix_tarifelistesi_hizmet_date_range',
        'TarifeListesi',
        ['HizmetId', 'ValidFrom', 'ValidTo', 'IsActive']
    )


def downgrade() -> None:
    """Revert changes"""
    
    op.drop_index('ix_tarifelistesi_hizmet_date_range', table_name='TarifeListesi')
    op.drop_index('ix_tarifelistesi_is_active', table_name='TarifeListesi')
    op.drop_index('ix_tarifelistesi_valid_to', table_name='TarifeListesi')
    op.drop_index('ix_tarifelistesi_valid_from', table_name='TarifeListesi')
    op.drop_index('ix_tarifelistesi_hizmet_id', table_name='TarifeListesi')
    
    op.drop_table('TarifeListesi')
