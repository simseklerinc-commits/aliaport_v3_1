"""Add CalculationType and FormulaParams to Hizmet table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2025-11-25 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Hizmet tablosuna Excel tarife entegrasyonu için yeni kolonlar ekle:
    
    - CalculationType: 6 hesaplama tipi (FIXED, PER_UNIT, X_SECONDARY, PER_BLOCK, BASE_PLUS_INCREMENT, VEHICLE_4H_RULE)
    - FormulaParams: JSON field (Excel ModelParam)
    - RequiresPersonCount, RequiresVehicleInfo, RequiresWeightInfo: Boolean flags
    """
    
    # SQLite için batch mode
    with op.batch_alter_table('Hizmet', schema=None) as batch_op:
        # CalculationType enum (SQLite için String olarak saklanacak)
        batch_op.add_column(
            sa.Column('CalculationType', sa.String(length=50), nullable=True, server_default='FIXED')
        )
        
        # FormulaParams JSON field
        batch_op.add_column(
            sa.Column('FormulaParams', sa.JSON(), nullable=True)
        )
        
        # Requirement flags
        batch_op.add_column(
            sa.Column('RequiresPersonCount', sa.Boolean(), nullable=False, server_default='0')
        )
        batch_op.add_column(
            sa.Column('RequiresVehicleInfo', sa.Boolean(), nullable=False, server_default='0')
        )
        batch_op.add_column(
            sa.Column('RequiresWeightInfo', sa.Boolean(), nullable=False, server_default='0')
        )
        
        # Index for faster queries
        batch_op.create_index('ix_hizmet_calculation_type', ['CalculationType'])
        batch_op.create_index('ix_hizmet_requires_person_count', ['RequiresPersonCount'])


def downgrade() -> None:
    """Revert changes"""
    
    with op.batch_alter_table('Hizmet', schema=None) as batch_op:
        batch_op.drop_index('ix_hizmet_requires_person_count')
        batch_op.drop_index('ix_hizmet_calculation_type')
        
        batch_op.drop_column('RequiresWeightInfo')
        batch_op.drop_column('RequiresVehicleInfo')
        batch_op.drop_column('RequiresPersonCount')
        batch_op.drop_column('FormulaParams')
        batch_op.drop_column('CalculationType')
