#!/usr/bin/env python3
"""
Test İş Emirleri Oluştur
Portal kullanıcısı (test@aliaport.com) tarafından oluşturulan iş emirleri
"""

import sqlite3
from datetime import datetime, timedelta

db_path = 'database/aliaport.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Portal user ID'sini bul (test@aliaport.com)
c.execute('SELECT id, cari_id FROM portal_user WHERE email = ?', ('test@aliaport.com',))
result = c.fetchone()

if not result:
    print('❌ Portal user (test@aliaport.com) bulunamadı!')
    conn.close()
    exit(1)

portal_user_id = result[0]
cari_id = result[1]

# Cari kodunu ve unvanını al
c.execute('SELECT CariKod, Unvan FROM Cari WHERE Id = ?', (cari_id,))
cari_result = c.fetchone()
if cari_result:
    cari_code, cari_title = cari_result
else:
    cari_code = 'TEST'
    cari_title = 'Test Company'

print(f'✓ Portal User: id={portal_user_id}, email=test@aliaport.com')
print(f'✓ Cari: id={cari_id}, code={cari_code}, title={cari_title[:40]}...' if len(cari_title) > 40 else f'✓ Cari: id={cari_id}, code={cari_code}, title={cari_title}')

# Test iş emirleri oluştur
now = datetime.now()
test_work_orders = [
    {
        'wo_number': f'WO-{now.strftime("%Y%m%d")}-001',
        'cari_id': cari_id,
        'cari_code': cari_code,
        'cari_title': cari_title,
        'type': 'MOTORBOT',  # Enum type
        'action': 'ARAÇ_GİRİŞ',
        'subject': 'Portal Test İş Emri #1 - Gemi Tamir',
        'description': 'Portal kullanıcısı tarafından oluşturulan test iş emri',
        'planned_start': (now - timedelta(days=5)).isoformat(),
        'status': 'PENDING',
        'priority': 'MEDIUM',
        'portal_user_id': portal_user_id,
    },
    {
        'wo_number': f'WO-{now.strftime("%Y%m%d")}-002',
        'cari_id': cari_id,
        'cari_code': cari_code,
        'cari_title': cari_title,
        'type': 'HIZMET',
        'action': 'FORKLIFT',
        'subject': 'Portal Test İş Emri #2 - Gemi Kargo',
        'description': 'Portal kullanıcısı tarafından oluşturulan test iş emri',
        'planned_start': (now - timedelta(days=3)).isoformat(),
        'status': 'PENDING',
        'priority': 'MEDIUM',
        'portal_user_id': portal_user_id,
    },
    {
        'wo_number': f'WO-{now.strftime("%Y%m%d")}-003',
        'cari_id': cari_id,
        'cari_code': cari_code,
        'cari_title': cari_title,
        'type': 'MOTORBOT',
        'action': 'ARAÇ_TARAMA',
        'subject': 'Portal Test İş Emri #3 - Gemi Temizlik',
        'description': 'Portal kullanıcısı tarafından oluşturulan test iş emri',
        'planned_start': now.isoformat(),
        'status': 'PENDING',
        'priority': 'HIGH',
        'portal_user_id': portal_user_id,
    },
    {
        'wo_number': f'WO-{now.strftime("%Y%m%d")}-004',
        'cari_id': cari_id,
        'cari_code': cari_code,
        'cari_title': cari_title,
        'type': 'BARINMA',
        'action': None,
        'subject': 'Portal Test İş Emri #4 - Acil Barınma',
        'description': 'Portal kullanıcısı tarafından oluşturulan acil test iş emri',
        'planned_start': now.isoformat(),
        'status': 'PENDING',
        'priority': 'HIGH',
        'portal_user_id': portal_user_id,
    },
    {
        'wo_number': f'WO-{now.strftime("%Y%m%d")}-005',
        'cari_id': cari_id,
        'cari_code': cari_code,
        'cari_title': cari_title,
        'type': 'HIZMET',
        'action': 'FORKLIFT',
        'subject': 'Portal Test İş Emri #5 - Düzenli Bakım',
        'description': 'Portal kullanıcısı tarafından oluşturulan test iş emri',
        'planned_start': (now + timedelta(days=7)).isoformat(),
        'status': 'PENDING',
        'priority': 'MEDIUM',
        'portal_user_id': portal_user_id,
    },
]

print(f'\n📋 {len(test_work_orders)} test iş emri oluşturuluyor...\n')

created_count = 0
for i, wo in enumerate(test_work_orders, 1):
    try:
        c.execute('''
            INSERT INTO work_order (
                wo_number, cari_id, cari_code, cari_title,
                type, action, subject, description,
                planned_start, status, priority, portal_user_id,
                approval_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            wo['wo_number'],
            wo['cari_id'],
            wo['cari_code'],
            wo['cari_title'],
            wo['type'],
            wo['action'],
            wo['subject'],
            wo['description'],
            wo['planned_start'],
            wo['status'],
            wo['priority'],
            wo['portal_user_id'],
            'PENDING',  # approval_status
            now.isoformat(),
            now.isoformat(),
        ))
        created_count += 1
        print(f"  ✓ İş Emri #{i} ({wo['wo_number']}): {wo['subject']}")
    except Exception as e:
        print(f"  ❌ İş Emri #{i} hatası: {str(e)}")

conn.commit()

# Doğrula
c.execute('''
    SELECT id, wo_number, subject, status, priority, planned_start
    FROM work_order
    WHERE cari_id = ? AND portal_user_id = ?
    ORDER BY id DESC
''', (cari_id, portal_user_id))

rows = c.fetchall()
print(f'\n✅ Oluşturulan İş Emirleri ({len(rows)} toplam):')
for row in rows:
    wo_number = row[1]
    subject = row[2]
    status = row[3]
    priority = row[4]
    planned = row[5][:10] if row[5] else '-'
    subject_short = subject[:45] + '...' if len(subject) > 45 else subject
    print(f'   WO: {wo_number} | Status: {status:12s} | Priority: {priority:6s} | {subject_short}')

conn.close()
print(f'\n✓ Toplam {created_count} iş emri başarıyla oluşturuldu!')
