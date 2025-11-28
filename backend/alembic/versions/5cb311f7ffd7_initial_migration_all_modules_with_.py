"""Initial migration - all modules with updated Cari fields

Revision ID: 5cb311f7ffd7
Revises: 
Create Date: 2025-11-23 03:20:40.666116

This migration creates all core tables for the Aliaport system:
- Cari (Customers/Suppliers)
- Motorbot & MbTrip (Vessels & Trips)
- Hizmet (Services)
- ExchangeRate (Currency Exchange Rates)
- Parametre (Parameters/Settings)
- PriceList & PriceListItem (Price Lists)
- BarinmaContract (Berth Contracts)
- WorkOrder & WorkOrderItem (Work Orders)
- WorkLog (Field Work Logs)
- GateLog & GateChecklistItem (Security Gate Logs)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5cb311f7ffd7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all core tables."""
    
    # ============================================
    # 1. CARI (Customer/Supplier) - Base table, no FK dependencies
    # ============================================
    op.create_table('Cari',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('CariKod', sa.String(length=50), nullable=False),
        sa.Column('Unvan', sa.String(length=200), nullable=False),
        sa.Column('CariTip', sa.String(length=20), nullable=False),
        sa.Column('Rol', sa.String(length=20), nullable=False),
        sa.Column('VergiDairesi', sa.String(length=100), nullable=True),
        sa.Column('VergiNo', sa.String(length=20), nullable=True),
        sa.Column('Tckn', sa.String(length=11), nullable=True),
        sa.Column('Ulke', sa.String(length=50), nullable=True),
        sa.Column('Il', sa.String(length=50), nullable=True),
        sa.Column('Ilce', sa.String(length=50), nullable=True),
        sa.Column('Adres', sa.String(length=500), nullable=True),
        sa.Column('Telefon', sa.String(length=50), nullable=True),
        sa.Column('Eposta', sa.String(length=100), nullable=True),
        sa.Column('IletisimKisi', sa.String(length=100), nullable=True),
        sa.Column('Iban', sa.String(length=34), nullable=True),
        sa.Column('VadeGun', sa.Integer(), nullable=True),
        sa.Column('ParaBirimi', sa.String(length=10), nullable=True),
        sa.Column('Notlar', sa.String(length=1000), nullable=True),
        sa.Column('AktifMi', sa.Boolean(), nullable=False),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.Column('CreatedBy', sa.Integer(), nullable=True),
        sa.Column('UpdatedBy', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_Cari_CariKod', 'Cari', ['CariKod'], unique=True)
    
    # ============================================
    # 2. MOTORBOT (Vessels) - FK to Cari
    # ============================================
    op.create_table('Motorbot',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('Kod', sa.String(length=50), nullable=False),
        sa.Column('Ad', sa.String(length=200), nullable=False),
        sa.Column('Plaka', sa.String(length=20), nullable=True),
        sa.Column('KapasiteTon', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('MaxHizKnot', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('OwnerCariId', sa.Integer(), nullable=True),
        sa.Column('OwnerCariKod', sa.String(length=50), nullable=True),
        sa.Column('Durum', sa.String(length=20), nullable=False),
        sa.Column('AlisTarihi', sa.Date(), nullable=True),
        sa.Column('Notlar', sa.String(), nullable=True),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('CreatedBy', sa.Integer(), nullable=True),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.Column('UpdatedBy', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['OwnerCariId'], ['Cari.Id'], ),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_Motorbot_Durum', 'Motorbot', ['Durum'], unique=False)
    op.create_index('ix_Motorbot_Kod', 'Motorbot', ['Kod'], unique=True)
    
    # ============================================
    # 3. MBTRIP (Motorbot Trips) - FK to Motorbot, Cari
    # ============================================
    op.create_table('MbTrip',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('MotorbotId', sa.Integer(), nullable=False),
        sa.Column('SeferTarihi', sa.Date(), nullable=False),
        sa.Column('CikisZamani', sa.DateTime(), nullable=True),
        sa.Column('DonusZamani', sa.DateTime(), nullable=True),
        sa.Column('KalkisIskele', sa.String(length=100), nullable=True),
        sa.Column('VarisIskele', sa.String(length=100), nullable=True),
        sa.Column('CariId', sa.Integer(), nullable=True),
        sa.Column('CariKod', sa.String(length=50), nullable=True),
        sa.Column('YukAciklama', sa.String(length=200), nullable=True),
        sa.Column('Notlar', sa.String(), nullable=True),
        sa.Column('Durum', sa.String(length=20), nullable=False),
        sa.Column('FaturaDurumu', sa.String(length=20), nullable=True),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('CreatedBy', sa.Integer(), nullable=True),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.Column('UpdatedBy', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['CariId'], ['Cari.Id'], ),
        sa.ForeignKeyConstraint(['MotorbotId'], ['Motorbot.Id'], ),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_MbTrip_Durum', 'MbTrip', ['Durum'], unique=False)
    op.create_index('ix_MbTrip_MotorbotId', 'MbTrip', ['MotorbotId'], unique=False)
    op.create_index('ix_MbTrip_SeferTarihi', 'MbTrip', ['SeferTarihi'], unique=False)
    
    # ============================================
    # 4. HIZMET (Services)
    # ============================================
    op.create_table('Hizmet',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('Kod', sa.String(length=50), nullable=False),
        sa.Column('Ad', sa.String(length=200), nullable=False),
        sa.Column('Aciklama', sa.Text(), nullable=True),
        sa.Column('MuhasebeKodu', sa.String(length=50), nullable=True),
        sa.Column('GrupKod', sa.String(length=50), nullable=True),
        sa.Column('Birim', sa.String(length=20), nullable=True),
        sa.Column('Fiyat', sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column('ParaBirimi', sa.String(length=10), nullable=False),
        sa.Column('KdvOrani', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('UnitId', sa.Integer(), nullable=True),
        sa.Column('VatRateId', sa.Integer(), nullable=True),
        sa.Column('VatExemptionId', sa.Integer(), nullable=True),
        sa.Column('GroupId', sa.Integer(), nullable=True),
        sa.Column('CategoryId', sa.Integer(), nullable=True),
        sa.Column('PricingRuleId', sa.Integer(), nullable=True),
        sa.Column('MetadataJson', sa.Text(), nullable=True),
        sa.Column('SiraNo', sa.Integer(), nullable=True),
        sa.Column('AktifMi', sa.Boolean(), nullable=False),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.Column('CreatedBy', sa.Integer(), nullable=True),
        sa.Column('UpdatedBy', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_Hizmet_Kod', 'Hizmet', ['Kod'], unique=True)
    
    # ============================================
    # 5. EXCHANGERATE (Currency Exchange Rates)
    # ============================================
    op.create_table('ExchangeRate',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('CurrencyFrom', sa.String(length=10), nullable=False),
        sa.Column('CurrencyTo', sa.String(length=10), nullable=False),
        sa.Column('Rate', sa.Float(), nullable=False),
        sa.Column('SellRate', sa.Float(), nullable=True),
        sa.Column('BanknoteBuyingRate', sa.Float(), nullable=True),
        sa.Column('BanknoteSellRate', sa.Float(), nullable=True),
        sa.Column('RateDate', sa.Date(), nullable=False),
        sa.Column('Source', sa.String(length=50), nullable=True),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_ExchangeRate_CurrencyFrom', 'ExchangeRate', ['CurrencyFrom'], unique=False)
    op.create_index('ix_ExchangeRate_RateDate', 'ExchangeRate', ['RateDate'], unique=False)
    op.create_index('ix_exchangerate_date_currency', 'ExchangeRate', ['RateDate', 'CurrencyFrom'], unique=False)
    op.create_index('ix_exchangerate_unique', 'ExchangeRate', ['RateDate', 'CurrencyFrom', 'CurrencyTo'], unique=True)
    
    # ============================================
    # 6. PARAMETRE (Parameters/Settings)
    # ============================================
    op.create_table('Parametre',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('Kategori', sa.String(length=50), nullable=False),
        sa.Column('Kod', sa.String(length=100), nullable=False),
        sa.Column('Ad', sa.String(length=200), nullable=False),
        sa.Column('Deger', sa.String(length=500), nullable=True),
        sa.Column('Aciklama', sa.String(length=1000), nullable=True),
        sa.Column('AktifMi', sa.Boolean(), nullable=False),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_Parametre_Kategori', 'Parametre', ['Kategori'], unique=False)
    op.create_index('ix_Parametre_Kod', 'Parametre', ['Kod'], unique=True)
    
    # ============================================
    # 7. PRICELIST (Price Lists)
    # ============================================
    op.create_table('PriceList',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('Kod', sa.String(length=50), nullable=False),
        sa.Column('Ad', sa.String(length=200), nullable=False),
        sa.Column('Aciklama', sa.Text(), nullable=True),
        sa.Column('ParaBirimi', sa.String(length=10), nullable=False),
        sa.Column('Versiyon', sa.Integer(), nullable=False),
        sa.Column('Durum', sa.String(length=20), nullable=False),
        sa.Column('GecerlilikBaslangic', sa.Date(), nullable=True),
        sa.Column('GecerlilikBitis', sa.Date(), nullable=True),
        sa.Column('AktifMi', sa.Boolean(), nullable=False),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_PriceList_Kod', 'PriceList', ['Kod'], unique=True)
    
    # ============================================
    # 8. PRICELISTITEM (Price List Items) - FK to PriceList
    # ============================================
    op.create_table('PriceListItem',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('PriceListId', sa.Integer(), nullable=False),
        sa.Column('HizmetKodu', sa.String(length=50), nullable=False),
        sa.Column('HizmetAdi', sa.String(length=200), nullable=False),
        sa.Column('Birim', sa.String(length=20), nullable=True),
        sa.Column('BirimFiyat', sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column('KdvOrani', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('Aciklama', sa.Text(), nullable=True),
        sa.Column('SiraNo', sa.Integer(), nullable=True),
        sa.Column('AktifMi', sa.Boolean(), nullable=False),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['PriceListId'], ['PriceList.Id'], ),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_PriceListItem_PriceListId', 'PriceListItem', ['PriceListId'], unique=False)
    
    # ============================================
    # 9. BARINMA_CONTRACT (Berth Contracts) - FK to Motorbot, Cari, Hizmet, PriceList
    # ============================================
    op.create_table('barinma_contract',
        sa.Column('Id', sa.Integer(), nullable=False),
        sa.Column('ContractNumber', sa.String(length=50), nullable=False),
        sa.Column('MotorbotId', sa.Integer(), nullable=False),
        sa.Column('CariId', sa.Integer(), nullable=False),
        sa.Column('ServiceCardId', sa.Integer(), nullable=False),
        sa.Column('PriceListId', sa.Integer(), nullable=False),
        sa.Column('StartDate', sa.Date(), nullable=False),
        sa.Column('EndDate', sa.Date(), nullable=True),
        sa.Column('UnitPrice', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('Currency', sa.String(length=3), nullable=False),
        sa.Column('VatRate', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('BillingPeriod', sa.String(length=20), nullable=False),
        sa.Column('IsActive', sa.Boolean(), nullable=False),
        sa.Column('Notes', sa.Text(), nullable=True),
        sa.Column('CreatedAt', sa.DateTime(), nullable=False),
        sa.Column('UpdatedAt', sa.DateTime(), nullable=True),
        sa.Column('CreatedBy', sa.Integer(), nullable=True),
        sa.Column('UpdatedBy', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['CariId'], ['Cari.Id'], ),
        sa.ForeignKeyConstraint(['MotorbotId'], ['Motorbot.Id'], ),
        sa.ForeignKeyConstraint(['PriceListId'], ['PriceList.Id'], ),
        sa.ForeignKeyConstraint(['ServiceCardId'], ['Hizmet.Id'], ),
        sa.PrimaryKeyConstraint('Id')
    )
    op.create_index('ix_barinma_contract_CariId', 'barinma_contract', ['CariId'], unique=False)
    op.create_index('ix_barinma_contract_ContractNumber', 'barinma_contract', ['ContractNumber'], unique=True)
    op.create_index('ix_barinma_contract_IsActive', 'barinma_contract', ['IsActive'], unique=False)
    op.create_index('ix_barinma_contract_MotorbotId', 'barinma_contract', ['MotorbotId'], unique=False)
    
    # ============================================
    # 10. WORK_ORDER (Work Orders) - FK to Cari, Motorbot
    # ============================================
    op.create_table('work_order',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('work_order_no', sa.String(length=50), nullable=False),
        sa.Column('cari_id', sa.Integer(), nullable=True),
        sa.Column('cari_kod', sa.String(length=50), nullable=True),
        sa.Column('cari_unvan', sa.String(length=200), nullable=True),
        sa.Column('motorbot_id', sa.Integer(), nullable=True),
        sa.Column('motorbot_kod', sa.String(length=50), nullable=True),
        sa.Column('motorbot_ad', sa.String(length=200), nullable=True),
        sa.Column('requester_user_id', sa.Integer(), nullable=True),
        sa.Column('requester_user_name', sa.String(length=100), nullable=True),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('service_code', sa.String(length=50), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=True),
        sa.Column('subject', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=10), nullable=False),
        sa.Column('planned_start', sa.DateTime(), nullable=True),
        sa.Column('planned_end', sa.DateTime(), nullable=True),
        sa.Column('actual_start', sa.DateTime(), nullable=True),
        sa.Column('actual_end', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('gate_required', sa.Boolean(), nullable=True),
        sa.Column('saha_kayit_yetkisi', sa.Boolean(), nullable=True),
        sa.Column('attachments_count', sa.Integer(), nullable=True),
        sa.Column('has_signature', sa.Boolean(), nullable=True),
        sa.Column('is_cabatoge_tr_flag', sa.Boolean(), nullable=True),
        sa.Column('apply_rule_addons', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_by_name', sa.String(length=100), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('updated_by_name', sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(['cari_id'], ['Cari.Id'], ),
        sa.ForeignKeyConstraint(['motorbot_id'], ['Motorbot.Id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_work_order_cari_id', 'work_order', ['cari_id'], unique=False)
    op.create_index('ix_work_order_motorbot_id', 'work_order', ['motorbot_id'], unique=False)
    op.create_index('ix_work_order_status', 'work_order', ['status'], unique=False)
    op.create_index('ix_work_order_type', 'work_order', ['type'], unique=False)
    op.create_index('ix_work_order_work_order_no', 'work_order', ['work_order_no'], unique=True)
    
    # ============================================
    # 11. WORK_ORDER_ITEM (Work Order Items) - FK to work_order
    # ============================================
    op.create_table('work_order_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('hizmet_kod', sa.String(length=50), nullable=True),
        sa.Column('hizmet_ad', sa.String(length=200), nullable=False),
        sa.Column('miktar', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('birim', sa.String(length=20), nullable=True),
        sa.Column('birim_fiyat', sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column('para_birimi', sa.String(length=10), nullable=True),
        sa.Column('kdv_orani', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('aciklama', sa.Text(), nullable=True),
        sa.Column('sira_no', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_order.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_work_order_item_work_order_id', 'work_order_item', ['work_order_id'], unique=False)
    
    # ============================================
    # 12. WORKLOG (Field Work Logs) - FK to work_order, motorbot
    # ============================================
    op.create_table('worklog',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=True),
        sa.Column('sefer_id', sa.Integer(), nullable=True),
        sa.Column('motorbot_id', sa.Integer(), nullable=True),
        sa.Column('hizmet_kodu', sa.String(length=20), nullable=True),
        sa.Column('personnel_name', sa.String(length=100), nullable=False),
        sa.Column('time_start', sa.DateTime(), nullable=False),
        sa.Column('time_end', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('service_type', sa.String(length=50), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('is_processed', sa.Integer(), nullable=True),
        sa.Column('is_approved', sa.Integer(), nullable=True),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_worklog_id', 'worklog', ['id'], unique=False)
    
    # ============================================
    # 13. GATELOG (Security Gate Logs) - FK to work_order, motorbot
    # ============================================
    op.create_table('gatelog',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('motorbot_id', sa.Integer(), nullable=True),
        sa.Column('entry_type', sa.String(length=10), nullable=False),
        sa.Column('wo_number', sa.String(length=50), nullable=False),
        sa.Column('wo_status', sa.String(length=20), nullable=False),
        sa.Column('security_personnel', sa.String(length=100), nullable=False),
        sa.Column('is_approved', sa.Boolean(), nullable=True),
        sa.Column('checklist_complete', sa.Boolean(), nullable=True),
        sa.Column('checklist_data', sa.Text(), nullable=True),
        sa.Column('is_exception', sa.Boolean(), nullable=True),
        sa.Column('exception_pin', sa.String(length=10), nullable=True),
        sa.Column('exception_reason', sa.Text(), nullable=True),
        sa.Column('exception_approved_by', sa.String(length=100), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('gate_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_gatelog_id', 'gatelog', ['id'], unique=False)
    
    # ============================================
    # 14. GATE_CHECKLIST_ITEM (Security Checklist Items)
    # ============================================
    op.create_table('gate_checklist_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('wo_type', sa.String(length=20), nullable=False),
        sa.Column('item_label', sa.String(length=200), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_gate_checklist_item_id', 'gate_checklist_item', ['id'], unique=False)


def downgrade() -> None:
    """Drop all core tables in reverse order."""
    
    # Drop in reverse order (handle FK dependencies)
    op.drop_index('ix_gate_checklist_item_id', table_name='gate_checklist_item')
    op.drop_table('gate_checklist_item')
    
    op.drop_index('ix_gatelog_id', table_name='gatelog')
    op.drop_table('gatelog')
    
    op.drop_index('ix_worklog_id', table_name='worklog')
    op.drop_table('worklog')
    
    op.drop_index('ix_work_order_item_work_order_id', table_name='work_order_item')
    op.drop_table('work_order_item')
    
    op.drop_index('ix_work_order_work_order_no', table_name='work_order')
    op.drop_index('ix_work_order_type', table_name='work_order')
    op.drop_index('ix_work_order_status', table_name='work_order')
    op.drop_index('ix_work_order_motorbot_id', table_name='work_order')
    op.drop_index('ix_work_order_cari_id', table_name='work_order')
    op.drop_table('work_order')
    
    op.drop_index('ix_barinma_contract_MotorbotId', table_name='barinma_contract')
    op.drop_index('ix_barinma_contract_IsActive', table_name='barinma_contract')
    op.drop_index('ix_barinma_contract_ContractNumber', table_name='barinma_contract')
    op.drop_index('ix_barinma_contract_CariId', table_name='barinma_contract')
    op.drop_table('barinma_contract')
    
    op.drop_index('ix_PriceListItem_PriceListId', table_name='PriceListItem')
    op.drop_table('PriceListItem')
    
    op.drop_index('ix_PriceList_Kod', table_name='PriceList')
    op.drop_table('PriceList')
    
    op.drop_index('ix_Parametre_Kod', table_name='Parametre')
    op.drop_index('ix_Parametre_Kategori', table_name='Parametre')
    op.drop_table('Parametre')
    
    op.drop_index('ix_exchangerate_unique', table_name='ExchangeRate')
    op.drop_index('ix_exchangerate_date_currency', table_name='ExchangeRate')
    op.drop_index('ix_ExchangeRate_RateDate', table_name='ExchangeRate')
    op.drop_index('ix_ExchangeRate_CurrencyFrom', table_name='ExchangeRate')
    op.drop_table('ExchangeRate')
    
    op.drop_index('ix_Hizmet_Kod', table_name='Hizmet')
    op.drop_table('Hizmet')
    
    op.drop_index('ix_MbTrip_SeferTarihi', table_name='MbTrip')
    op.drop_index('ix_MbTrip_MotorbotId', table_name='MbTrip')
    op.drop_index('ix_MbTrip_Durum', table_name='MbTrip')
    op.drop_table('MbTrip')
    
    op.drop_index('ix_Motorbot_Kod', table_name='Motorbot')
    op.drop_index('ix_Motorbot_Durum', table_name='Motorbot')
    op.drop_table('Motorbot')
    
    op.drop_index('ix_Cari_CariKod', table_name='Cari')
    op.drop_table('Cari')

