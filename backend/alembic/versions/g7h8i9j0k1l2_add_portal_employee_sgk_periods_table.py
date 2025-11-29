"""add portal_employee_sgk_periods table

Revision ID: g7h8i9j0k1l2
Revises: 85a1eb87feda
Create Date: 2025-11-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g7h8i9j0k1l2'
down_revision: Union[str, None] = '8dce96aaba26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create portal_employee_sgk_periods table
    op.create_table(
        'portal_employee_sgk_periods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('period_code', sa.String(length=7), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('source', sa.String(length=20), nullable=False, server_default='HIZMET_LISTESI'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['employee_id'], ['portal_employee.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_portal_employee_sgk_periods_employee_id', 'portal_employee_sgk_periods', ['employee_id'])
    op.create_index('ix_portal_emp_sgk_period_emp_period', 'portal_employee_sgk_periods', ['employee_id', 'period_code'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_portal_emp_sgk_period_emp_period', table_name='portal_employee_sgk_periods')
    op.drop_index('ix_portal_employee_sgk_periods_employee_id', table_name='portal_employee_sgk_periods')
    
    # Drop table
    op.drop_table('portal_employee_sgk_periods')
