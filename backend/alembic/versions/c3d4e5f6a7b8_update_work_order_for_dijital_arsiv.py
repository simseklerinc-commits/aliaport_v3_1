"""Update work_order table for dijital arsiv

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2025-11-25 14:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    WorkOrder tablosuna dijital arşiv için yeni kolonlar ekle
    
    - portal_user_id: Portal kullanıcı ilişkisi
    - approval_status: Belge onay durumu (PENDING, APPROVED, REJECTED)
    - started_by_id, completed_by_id: İş emri yaşam döngüsü
    
    SQLite: batch mode kullanarak ALTER TABLE
    """
    
    # SQLite için batch mode
    with op.batch_alter_table('work_order', schema=None) as batch_op:
        # Portal user ilişkisi
        batch_op.add_column(sa.Column('portal_user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_work_order_portal_user', 'portal_user', ['portal_user_id'], ['id'])
        batch_op.create_index('ix_work_order_portal_user_id', ['portal_user_id'])
        
        # Onay durumu
        batch_op.add_column(sa.Column('approval_status', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('approved_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('approved_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('rejection_reason', sa.Text(), nullable=True))
        
        batch_op.create_foreign_key('fk_work_order_approved_by', 'users', ['approved_by_id'], ['id'])
        batch_op.create_index('ix_work_order_approval_status', ['approval_status'])
        
        # İş emri başlatma
        batch_op.add_column(sa.Column('started_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('started_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('estimated_completion', sa.DateTime(), nullable=True))
        
        batch_op.create_foreign_key('fk_work_order_started_by', 'users', ['started_by_id'], ['id'])
        
        # İş emri tamamlama
        batch_op.add_column(sa.Column('completed_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('completed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('completion_notes', sa.Text(), nullable=True))
        
        batch_op.create_foreign_key('fk_work_order_completed_by', 'users', ['completed_by_id'], ['id'])


def downgrade() -> None:
    """WorkOrder dijital arşiv kolonlarını sil (SQLite batch mode)"""
    
    with op.batch_alter_table('work_order', schema=None) as batch_op:
        # Tamamlama
        batch_op.drop_constraint('fk_work_order_completed_by', type_='foreignkey')
        batch_op.drop_column('completion_notes')
        batch_op.drop_column('completed_at')
        batch_op.drop_column('completed_by_id')
        
        # Başlatma
        batch_op.drop_constraint('fk_work_order_started_by', type_='foreignkey')
        batch_op.drop_column('estimated_completion')
        batch_op.drop_column('started_at')
        batch_op.drop_column('started_by_id')
        
        # Onay
        batch_op.drop_index('ix_work_order_approval_status')
        batch_op.drop_constraint('fk_work_order_approved_by', type_='foreignkey')
        batch_op.drop_column('rejection_reason')
        batch_op.drop_column('approved_at')
        batch_op.drop_column('approved_by_id')
        batch_op.drop_column('approval_status')
        
        # Portal user
        batch_op.drop_index('ix_work_order_portal_user_id')
        batch_op.drop_constraint('fk_work_order_portal_user', type_='foreignkey')
        batch_op.drop_column('portal_user_id')
