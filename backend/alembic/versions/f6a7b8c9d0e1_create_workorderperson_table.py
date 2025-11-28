"""Create WorkOrderPerson table for identity management

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2025-11-25 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    WorkOrderPerson tablosu oluştur - İş emri kişi listesi
    
    Bazı hizmetler kişi sayısı gerektirir (teknik personel transferi, ziyaretçi girişi).
    Bu tablo kimlik bilgilerini saklar ve güvenlik modülü ile entegre çalışır.
    """
    
    op.create_table(
        'work_order_person',
        sa.Column('id', sa.Integer(), nullable=False),
        
        # İş emri ilişkileri
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('work_order_item_id', sa.Integer(), nullable=True),
        
        # Kişi bilgileri
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('tc_kimlik_no', sa.String(length=11), nullable=True),  # Türk vatandaşı
        sa.Column('passport_no', sa.String(length=20), nullable=True),   # Yabancı
        sa.Column('nationality', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        
        # Kimlik belgesi (Dijital Arşiv entegrasyonu)
        sa.Column('identity_document_id', sa.Integer(), nullable=True),
        sa.Column('identity_photo_url', sa.String(length=500), nullable=True),
        
        # Güvenlik onayı
        sa.Column('gate_entry_time', sa.DateTime(), nullable=True),
        sa.Column('gate_exit_time', sa.DateTime(), nullable=True),
        sa.Column('approved_by_security', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('approved_by_security_user_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('security_notes', sa.Text(), nullable=True),
        
        # Durum
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        
        # Audit
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        
        # Primary Key
        sa.PrimaryKeyConstraint('id'),
        
        # Foreign Keys
        sa.ForeignKeyConstraint(['work_order_id'], ['work_order.id'], name='fk_workorderperson_workorder'),
        sa.ForeignKeyConstraint(['work_order_item_id'], ['work_order_item.id'], name='fk_workorderperson_workorderitem'),
        sa.ForeignKeyConstraint(['identity_document_id'], ['archive_document.id'], name='fk_workorderperson_identity_document'),
        sa.ForeignKeyConstraint(['approved_by_security_user_id'], ['users.id'], name='fk_workorderperson_approved_by'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_workorderperson_created_by'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], name='fk_workorderperson_updated_by'),
    )
    
    # Indexes
    op.create_index('ix_workorderperson_work_order_id', 'work_order_person', ['work_order_id'])
    op.create_index('ix_workorderperson_work_order_item_id', 'work_order_person', ['work_order_item_id'])
    op.create_index('ix_workorderperson_tc_kimlik_no', 'work_order_person', ['tc_kimlik_no'])
    op.create_index('ix_workorderperson_passport_no', 'work_order_person', ['passport_no'])
    op.create_index('ix_workorderperson_approved_by_security', 'work_order_person', ['approved_by_security'])
    
    # Composite index for security pending entries query
    op.create_index(
        'ix_workorderperson_security_pending',
        'work_order_person',
        ['work_order_id', 'approved_by_security', 'gate_entry_time']
    )


def downgrade() -> None:
    """Revert changes"""
    
    op.drop_index('ix_workorderperson_security_pending', table_name='work_order_person')
    op.drop_index('ix_workorderperson_approved_by_security', table_name='work_order_person')
    op.drop_index('ix_workorderperson_passport_no', table_name='work_order_person')
    op.drop_index('ix_workorderperson_tc_kimlik_no', table_name='work_order_person')
    op.drop_index('ix_workorderperson_work_order_item_id', table_name='work_order_person')
    op.drop_index('ix_workorderperson_work_order_id', table_name='work_order_person')
    
    op.drop_table('work_order_person')
