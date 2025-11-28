"""Add portal_employee_document table

Revision ID: 6f9f5f7a7c66
Revises: 85a1eb87feda
Create Date: 2025-11-27 22:22:47.241296

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f9f5f7a7c66'
down_revision: Union[str, Sequence[str], None] = '85a1eb87feda'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Sadece portal_employee_document tablosunu ekle
    op.create_table(
        'portal_employee_document',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('cari_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('issue_date', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['cari_id'], ['Cari.Id'], ),
        sa.ForeignKeyConstraint(['employee_id'], ['portal_employee.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_portal_employee_document_employee_id'), 'portal_employee_document', ['employee_id'], unique=False)
    op.create_index(op.f('ix_portal_employee_document_cari_id'), 'portal_employee_document', ['cari_id'], unique=False)
    op.create_index(op.f('ix_portal_employee_document_document_type'), 'portal_employee_document', ['document_type'], unique=False)
    op.create_index(op.f('ix_portal_employee_document_expires_at'), 'portal_employee_document', ['expires_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_portal_employee_document_expires_at'), table_name='portal_employee_document')
    op.drop_index(op.f('ix_portal_employee_document_document_type'), table_name='portal_employee_document')
    op.drop_index(op.f('ix_portal_employee_document_cari_id'), table_name='portal_employee_document')
    op.drop_index(op.f('ix_portal_employee_document_employee_id'), table_name='portal_employee_document')
    op.drop_table('portal_employee_document')
