"""Create portal_user table

Revision ID: a1b2c3d4e5f6
Revises: 0cb2c9b39007
Create Date: 2025-11-25 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9d5209205681'  # Son migration (password_reset_token)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Portal kullanıcı tablosu oluştur
    
    - Email/password authentication
    - Cari ilişkisi
    - Login tracking
    - Password reset
    """
    op.create_table(
        'portal_user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cari_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('position', sa.String(length=100), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('password_reset_token', sa.String(length=255), nullable=True),
        sa.Column('password_reset_expires', sa.DateTime(), nullable=True),
        sa.Column('password_changed_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_ip', sa.String(length=50), nullable=True),
        sa.Column('login_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cari_id'], ['Cari.Id'], name='fk_portal_user_cari'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], name='fk_portal_user_created_by')
    )
    
    # Indexes
    op.create_index('ix_portal_user_email', 'portal_user', ['email'], unique=True)
    op.create_index('ix_portal_user_cari_id', 'portal_user', ['cari_id'])
    op.create_index('ix_portal_user_password_reset_token', 'portal_user', ['password_reset_token'])


def downgrade() -> None:
    """Portal user tablosunu sil"""
    op.drop_index('ix_portal_user_password_reset_token', table_name='portal_user')
    op.drop_index('ix_portal_user_cari_id', table_name='portal_user')
    op.drop_index('ix_portal_user_email', table_name='portal_user')
    op.drop_table('portal_user')
