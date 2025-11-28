"""Create archive_document and notification tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2025-11-25 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Dijital arşiv ve bildirim tabloları oluştur
    
    - archive_document: Merkezi belge deposu
    - notification: Portal + internal bildirimler
    """
    
    # ============================================
    # ARCHIVE DOCUMENT TABLE
    # ============================================
    op.create_table(
        'archive_document',
        sa.Column('id', sa.Integer(), nullable=False),
        
        # Sınıflandırma
        sa.Column('category', sa.String(length=20), nullable=False),  # WORK_ORDER, EMPLOYEE, VEHICLE, CARI, GENERAL
        sa.Column('document_type', sa.String(length=50), nullable=False),  # GUMRUK_IZIN_BELGESI, SRC5, etc.
        
        # İlişkili kayıtlar (polymorphic)
        sa.Column('work_order_id', sa.Integer(), nullable=True),
        sa.Column('cari_id', sa.Integer(), nullable=True),
        
        # Dosya bilgileri
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False),
        
        # Versiyon kontrolü
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_latest_version', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('previous_version_id', sa.Integer(), nullable=True),
        
        # Durum
        sa.Column('status', sa.String(length=20), nullable=False, server_default='UPLOADED'),
        
        # Onay/Red
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('approval_note', sa.Text(), nullable=True),
        sa.Column('rejected_by_id', sa.Integer(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        
        # Yükleyen
        sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_by_portal_user_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        # Süre takibi
        sa.Column('issue_date', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('expiry_notification_sent', sa.Boolean(), nullable=False, server_default='0'),
        
        # Metadata
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(length=500), nullable=True),
        
        # Sistem
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_order.id'], name='fk_archive_document_work_order'),
        sa.ForeignKeyConstraint(['cari_id'], ['Cari.Id'], name='fk_archive_document_cari'),
        sa.ForeignKeyConstraint(['previous_version_id'], ['archive_document.id'], name='fk_archive_document_previous_version'),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], name='fk_archive_document_approved_by'),
        sa.ForeignKeyConstraint(['rejected_by_id'], ['users.id'], name='fk_archive_document_rejected_by'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], name='fk_archive_document_uploaded_by'),
        sa.ForeignKeyConstraint(['uploaded_by_portal_user_id'], ['portal_user.id'], name='fk_archive_document_uploaded_by_portal_user')
    )
    
    # Indexes
    op.create_index('ix_archive_document_category', 'archive_document', ['category'])
    op.create_index('ix_archive_document_document_type', 'archive_document', ['document_type'])
    op.create_index('ix_archive_document_work_order_id', 'archive_document', ['work_order_id'])
    op.create_index('ix_archive_document_cari_id', 'archive_document', ['cari_id'])
    op.create_index('ix_archive_document_status', 'archive_document', ['status'])
    op.create_index('ix_archive_document_is_latest_version', 'archive_document', ['is_latest_version'])
    op.create_index('ix_archive_document_file_hash', 'archive_document', ['file_hash'])
    op.create_index('ix_archive_document_expires_at', 'archive_document', ['expires_at'])
    op.create_index('ix_archive_document_uploaded_at', 'archive_document', ['uploaded_at'])
    
    # ============================================
    # NOTIFICATION TABLE
    # ============================================
    op.create_table(
        'notification',
        sa.Column('id', sa.Integer(), nullable=False),
        
        # Alıcı (birisi dolu)
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('portal_user_id', sa.Integer(), nullable=True),
        
        # Bildirim
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        
        # İlişkili kayıtlar
        sa.Column('work_order_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        
        # Durum
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        
        # Email
        sa.Column('email_sent', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('email_sent_at', sa.DateTime(), nullable=True),
        
        # Sistem
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_notification_user'),
        sa.ForeignKeyConstraint(['portal_user_id'], ['portal_user.id'], name='fk_notification_portal_user'),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_order.id'], name='fk_notification_work_order'),
        sa.ForeignKeyConstraint(['document_id'], ['archive_document.id'], name='fk_notification_document')
    )
    
    # Indexes
    op.create_index('ix_notification_user_id', 'notification', ['user_id'])
    op.create_index('ix_notification_portal_user_id', 'notification', ['portal_user_id'])
    op.create_index('ix_notification_type', 'notification', ['type'])
    op.create_index('ix_notification_is_read', 'notification', ['is_read'])
    op.create_index('ix_notification_created_at', 'notification', ['created_at'])


def downgrade() -> None:
    """Dijital arşiv ve bildirim tablolarını sil"""
    # Notification
    op.drop_index('ix_notification_created_at', table_name='notification')
    op.drop_index('ix_notification_is_read', table_name='notification')
    op.drop_index('ix_notification_type', table_name='notification')
    op.drop_index('ix_notification_portal_user_id', table_name='notification')
    op.drop_index('ix_notification_user_id', table_name='notification')
    op.drop_table('notification')
    
    # Archive Document
    op.drop_index('ix_archive_document_uploaded_at', table_name='archive_document')
    op.drop_index('ix_archive_document_expires_at', table_name='archive_document')
    op.drop_index('ix_archive_document_file_hash', table_name='archive_document')
    op.drop_index('ix_archive_document_is_latest_version', table_name='archive_document')
    op.drop_index('ix_archive_document_status', table_name='archive_document')
    op.drop_index('ix_archive_document_cari_id', table_name='archive_document')
    op.drop_index('ix_archive_document_work_order_id', table_name='archive_document')
    op.drop_index('ix_archive_document_document_type', table_name='archive_document')
    op.drop_index('ix_archive_document_category', table_name='archive_document')
    op.drop_table('archive_document')
