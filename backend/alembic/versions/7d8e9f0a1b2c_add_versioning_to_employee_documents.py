"""Add versioning to employee documents

Revision ID: 7d8e9f0a1b2c
Revises: 6f9f5f7a7c66
Create Date: 2025-11-27 22:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d8e9f0a1b2c'
down_revision: Union[str, Sequence[str], None] = '6f9f5f7a7c66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add versioning columns to portal_employee_document table."""
    # SQLite için batch mode kullan
    with op.batch_alter_table('portal_employee_document') as batch_op:
        # Version numarası (başlangıç 1)
        batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
        
        # En güncel versiyon mu kontrolü (varsayılan True)
        batch_op.add_column(sa.Column('is_latest_version', sa.Boolean(), nullable=False, server_default='1'))
        
        # Önceki versiyonun ID'si (opsiyonel, ilk versiyon için NULL)
        batch_op.add_column(sa.Column('previous_version_id', sa.Integer(), nullable=True))
        
        # İndeks ekle (sorgu performansı için)
        batch_op.create_index('ix_portal_employee_document_is_latest_version', ['is_latest_version'])
        
        # Foreign key ekle (önceki versiyona referans)
        batch_op.create_foreign_key(
            'fk_portal_employee_document_previous_version',
            'portal_employee_document',
            ['previous_version_id'],
            ['id']
        )


def downgrade() -> None:
    """Remove versioning columns from portal_employee_document table."""
    # SQLite için batch mode kullan
    with op.batch_alter_table('portal_employee_document') as batch_op:
        # Foreign key'i kaldır
        batch_op.drop_constraint('fk_portal_employee_document_previous_version', type_='foreignkey')
        
        # İndeksi kaldır
        batch_op.drop_index('ix_portal_employee_document_is_latest_version')
        
        # Kolonları kaldır
        batch_op.drop_column('previous_version_id')
        batch_op.drop_column('is_latest_version')
        batch_op.drop_column('version')
