"""Update GateLog for 4-hour rule and WorkOrderPerson integration

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2025-11-25 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    GateLog tablosuna 4 saat kuralı ve WorkOrderPerson entegrasyonu ekle
    
    4 Saat Kuralı: Araç limana giriş yaptıktan sonra 4 saatten fazla kalırsa,
    ekstra süre için dakika başı ücret hesaplanır.
    
    WorkOrderPerson entegrasyonu: İş emrindeki kişi listesi ile giriş çıkışları takip et.
    """
    
    with op.batch_alter_table('gatelog', schema=None) as batch_op:
        
        # WorkOrderPerson entegrasyonu
        batch_op.add_column(sa.Column('work_order_person_id', sa.Integer(), nullable=True))
        
        # Araç takip bilgileri
        batch_op.add_column(sa.Column('vehicle_plate', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('vehicle_type', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('driver_name', sa.String(length=200), nullable=True))
        
        # 4 saat kuralı - Zaman takibi
        batch_op.add_column(sa.Column('entry_time', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('exit_time', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('duration_minutes', sa.Integer(), nullable=True))
        
        # 4 saat kuralı - Ücret hesaplama
        batch_op.add_column(sa.Column('base_charge_hours', sa.Numeric(precision=10, scale=2), nullable=True))
        batch_op.add_column(sa.Column('extra_minutes', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('extra_charge_calculated', sa.Numeric(precision=18, scale=4), nullable=True))
        
        # Kimlik belgesi takibi (ISSG compliance)
        batch_op.add_column(sa.Column('identity_documents_uploaded', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('identity_document_count', sa.Integer(), nullable=True))
        
        # Foreign Key
        batch_op.create_foreign_key(
            'fk_gatelog_work_order_person',
            'work_order_person',
            ['work_order_person_id'],
            ['id']
        )
    
    # Indexes
    op.create_index('ix_gatelog_work_order_person_id', 'gatelog', ['work_order_person_id'])
    op.create_index('ix_gatelog_vehicle_plate', 'gatelog', ['vehicle_plate'])
    op.create_index('ix_gatelog_entry_time', 'gatelog', ['entry_time'])
    op.create_index('ix_gatelog_exit_time', 'gatelog', ['exit_time'])
    op.create_index('ix_gatelog_identity_documents_uploaded', 'gatelog', ['identity_documents_uploaded'])
    
    # Composite index for 4-hour rule queries (active vehicles)
    op.create_index(
        'ix_gatelog_4h_rule_active',
        'gatelog',
        ['entry_time', 'exit_time', 'duration_minutes']
    )


def downgrade() -> None:
    """Revert changes"""
    
    op.drop_index('ix_gatelog_4h_rule_active', table_name='gatelog')
    op.drop_index('ix_gatelog_identity_documents_uploaded', table_name='gatelog')
    op.drop_index('ix_gatelog_exit_time', table_name='gatelog')
    op.drop_index('ix_gatelog_entry_time', table_name='gatelog')
    op.drop_index('ix_gatelog_vehicle_plate', table_name='gatelog')
    op.drop_index('ix_gatelog_work_order_person_id', table_name='gatelog')
    
    with op.batch_alter_table('gatelog', schema=None) as batch_op:
        
        batch_op.drop_constraint('fk_gatelog_work_order_person', type_='foreignkey')
        
        batch_op.drop_column('identity_document_count')
        batch_op.drop_column('identity_documents_uploaded')
        batch_op.drop_column('extra_charge_calculated')
        batch_op.drop_column('extra_minutes')
        batch_op.drop_column('base_charge_hours')
        batch_op.drop_column('duration_minutes')
        batch_op.drop_column('exit_time')
        batch_op.drop_column('entry_time')
        batch_op.drop_column('driver_name')
        batch_op.drop_column('vehicle_type')
        batch_op.drop_column('vehicle_plate')
        batch_op.drop_column('work_order_person_id')

