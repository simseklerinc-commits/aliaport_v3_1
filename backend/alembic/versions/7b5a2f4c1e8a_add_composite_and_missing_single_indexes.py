"""add composite and missing single indexes

Revision ID: 7b5a2f4c1e8a
Revises: 586fe8452ca2
Create Date: 2025-11-23 16:10:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b5a2f4c1e8a'
down_revision: Union[str, Sequence[str], None] = '586fe8452ca2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create missing single-column and composite indexes."""
    # SINGLE-COLUMN INDEXES (tables excluding those already covered for Motorbot/MbTrip)
    op.create_index('ix_work_order_wo_number', 'work_order', ['wo_number'], unique=True)
    op.create_index('ix_work_order_cari_code', 'work_order', ['cari_code'], unique=False)
    op.create_index('ix_work_order_type', 'work_order', ['type'], unique=False)
    op.create_index('ix_work_order_status', 'work_order', ['status'], unique=False)

    op.create_index('ix_work_order_item_work_order_id', 'work_order_item', ['work_order_id'], unique=False)
    op.create_index('ix_work_order_item_wo_number', 'work_order_item', ['wo_number'], unique=False)
    op.create_index('ix_work_order_item_is_invoiced', 'work_order_item', ['is_invoiced'], unique=False)

    op.create_index('ix_Cari_CariKod', 'Cari', ['CariKod'], unique=True)

    op.create_index('ix_PriceList_Kod', 'PriceList', ['Kod'], unique=True)
    op.create_index('ix_PriceListItem_PriceListId', 'PriceListItem', ['PriceListId'], unique=False)

    op.create_index('ix_Parametre_Kategori', 'Parametre', ['Kategori'], unique=False)
    op.create_index('ix_Parametre_Kod', 'Parametre', ['Kod'], unique=True)

    op.create_index('ix_ExchangeRate_CurrencyFrom', 'ExchangeRate', ['CurrencyFrom'], unique=False)
    op.create_index('ix_ExchangeRate_CurrencyTo', 'ExchangeRate', ['CurrencyTo'], unique=False)
    op.create_index('ix_ExchangeRate_RateDate', 'ExchangeRate', ['RateDate'], unique=False)

    op.create_index('ix_Hizmet_Kod', 'Hizmet', ['Kod'], unique=True)

    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_roles_name', 'roles', ['name'], unique=True)
    op.create_index('ix_permissions_name', 'permissions', ['name'], unique=True)
    op.create_index('ix_permissions_resource', 'permissions', ['resource'], unique=False)

    # GateLog & Checklist (new indices - model lacked explicit index flags)
    op.create_index('ix_gatelog_wo_number', 'gatelog', ['wo_number'], unique=False)
    op.create_index('ix_gatelog_wo_status', 'gatelog', ['wo_status'], unique=False)
    op.create_index('ix_gatelog_gate_time', 'gatelog', ['gate_time'], unique=False)
    op.create_index('ix_gate_checklist_item_wo_type', 'gate_checklist_item', ['wo_type'], unique=False)
    op.create_index('ix_gate_checklist_item_is_active', 'gate_checklist_item', ['is_active'], unique=False)

    # COMPOSITE INDEXES
    op.create_index('ix_work_order_status_planned_start', 'work_order', ['status', 'planned_start'], unique=False)
    op.create_index('ix_work_order_cari_code_status', 'work_order', ['cari_code', 'status'], unique=False)

    op.create_index('ix_work_order_item_invoiced_work_order', 'work_order_item', ['is_invoiced', 'work_order_id'], unique=False)
    op.create_index('ix_work_order_item_service_invoiced', 'work_order_item', ['service_code', 'is_invoiced'], unique=False)

    op.create_index('ix_MbTrip_MotorbotId_SeferTarihi', 'MbTrip', ['MotorbotId', 'SeferTarihi'], unique=False)
    op.create_index('ix_MbTrip_Durum_SeferTarihi', 'MbTrip', ['Durum', 'SeferTarihi'], unique=False)

    op.create_index('ix_PriceList_active_validity', 'PriceList', ['AktifMi', 'GecerlilikBaslangic', 'GecerlilikBitis'], unique=False)
    op.create_index('ix_PriceList_Durum_AktifMi', 'PriceList', ['Durum', 'AktifMi'], unique=False)
    op.create_index('ix_PriceListItem_PriceListId_HizmetKodu', 'PriceListItem', ['PriceListId', 'HizmetKodu'], unique=False)

    op.create_index('ix_Parametre_Kategori_AktifMi', 'Parametre', ['Kategori', 'AktifMi'], unique=False)

    op.create_index('ix_ExchangeRate_pair_date', 'ExchangeRate', ['CurrencyFrom', 'CurrencyTo', 'RateDate'], unique=False)

    op.create_index('ix_gatelog_wo_number_gate_time', 'gatelog', ['wo_number', 'gate_time'], unique=False)
    op.create_index('ix_gatelog_wo_status_gate_time', 'gatelog', ['wo_status', 'gate_time'], unique=False)
    op.create_index('ix_gatelog_exception_gate_time', 'gatelog', ['is_exception', 'gate_time'], unique=False)

    op.create_index('ix_gate_checklist_item_wotype_active_order', 'gate_checklist_item', ['wo_type', 'is_active', 'display_order'], unique=False)

    op.create_index('ix_Hizmet_GrupKod_AktifMi', 'Hizmet', ['GrupKod', 'AktifMi'], unique=False)


def downgrade() -> None:
    """Downgrade schema: drop created indexes in reverse order."""
    # COMPOSITE INDEXES (reverse order)
    op.drop_index('ix_Hizmet_GrupKod_AktifMi', table_name='Hizmet')
    op.drop_index('ix_gate_checklist_item_wotype_active_order', table_name='gate_checklist_item')
    op.drop_index('ix_gatelog_exception_gate_time', table_name='gatelog')
    op.drop_index('ix_gatelog_wo_status_gate_time', table_name='gatelog')
    op.drop_index('ix_gatelog_wo_number_gate_time', table_name='gatelog')
    op.drop_index('ix_ExchangeRate_pair_date', table_name='ExchangeRate')
    op.drop_index('ix_Parametre_Kategori_AktifMi', table_name='Parametre')
    op.drop_index('ix_PriceListItem_PriceListId_HizmetKodu', table_name='PriceListItem')
    op.drop_index('ix_PriceList_Durum_AktifMi', table_name='PriceList')
    op.drop_index('ix_PriceList_active_validity', table_name='PriceList')
    op.drop_index('ix_MbTrip_Durum_SeferTarihi', table_name='MbTrip')
    op.drop_index('ix_MbTrip_MotorbotId_SeferTarihi', table_name='MbTrip')
    op.drop_index('ix_work_order_item_service_invoiced', table_name='work_order_item')
    op.drop_index('ix_work_order_item_invoiced_work_order', table_name='work_order_item')
    op.drop_index('ix_work_order_cari_code_status', table_name='work_order')
    op.drop_index('ix_work_order_status_planned_start', table_name='work_order')

    # SINGLE-COLUMN INDEXES
    op.drop_index('ix_gate_checklist_item_is_active', table_name='gate_checklist_item')
    op.drop_index('ix_gate_checklist_item_wo_type', table_name='gate_checklist_item')
    op.drop_index('ix_gatelog_gate_time', table_name='gatelog')
    op.drop_index('ix_gatelog_wo_status', table_name='gatelog')
    op.drop_index('ix_gatelog_wo_number', table_name='gatelog')
    op.drop_index('ix_permissions_resource', table_name='permissions')
    op.drop_index('ix_permissions_name', table_name='permissions')
    op.drop_index('ix_roles_name', table_name='roles')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_Hizmet_Kod', table_name='Hizmet')
    op.drop_index('ix_ExchangeRate_RateDate', table_name='ExchangeRate')
    op.drop_index('ix_ExchangeRate_CurrencyTo', table_name='ExchangeRate')
    op.drop_index('ix_ExchangeRate_CurrencyFrom', table_name='ExchangeRate')
    op.drop_index('ix_Parametre_Kod', table_name='Parametre')
    op.drop_index('ix_Parametre_Kategori', table_name='Parametre')
    op.drop_index('ix_PriceListItem_PriceListId', table_name='PriceListItem')
    op.drop_index('ix_PriceList_Kod', table_name='PriceList')
    op.drop_index('ix_Cari_CariKod', table_name='Cari')
    op.drop_index('ix_work_order_item_is_invoiced', table_name='work_order_item')
    op.drop_index('ix_work_order_item_wo_number', table_name='work_order_item')
    op.drop_index('ix_work_order_item_work_order_id', table_name='work_order_item')
    op.drop_index('ix_work_order_status', table_name='work_order')
    op.drop_index('ix_work_order_type', table_name='work_order')
    op.drop_index('ix_work_order_cari_code', table_name='work_order')
    op.drop_index('ix_work_order_wo_number', table_name='work_order')
