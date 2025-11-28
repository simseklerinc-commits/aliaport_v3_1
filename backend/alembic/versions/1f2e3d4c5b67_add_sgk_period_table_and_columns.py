"""add sgk fields and period check table

Revision ID: 1f2e3d4c5b67
Revises: 70a550861017
Create Date: 2025-11-27 02:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f2e3d4c5b67'
down_revision: Union[str, Sequence[str], None] = '70a550861017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Çalışan tabloya SGK sütunları
    op.add_column('portal_employee', sa.Column('sgk_last_check_period', sa.String(length=6), nullable=True))
    op.add_column('portal_employee', sa.Column('sgk_is_active_last_period', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # SGK dönem kontrol tablosu
    op.create_table(
        'sgk_period_check',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('firma_id', sa.Integer(), nullable=False),
        sa.Column('period', sa.String(length=6), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('checksum', sa.String(length=128), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('uploaded_by_user_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'OK'")),
        sa.Column('matched_employee_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('missing_employee_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('extra_in_sgk_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.ForeignKeyConstraint(['firma_id'], ['Cari.Id'], ),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sgk_period_check_firma_id'), 'sgk_period_check', ['firma_id'], unique=False)
    op.create_index(op.f('ix_sgk_period_check_period'), 'sgk_period_check', ['period'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_sgk_period_check_period'), table_name='sgk_period_check')
    op.drop_index(op.f('ix_sgk_period_check_firma_id'), table_name='sgk_period_check')
    op.drop_table('sgk_period_check')

    op.drop_column('portal_employee', 'sgk_is_active_last_period')
    op.drop_column('portal_employee', 'sgk_last_check_period')
