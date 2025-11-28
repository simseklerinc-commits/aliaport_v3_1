import sqlite3

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

# Portal user bilgisi
user = cur.execute('SELECT id, email, cari_id FROM portal_user WHERE email="test@aliaport.com"').fetchone()
print(f'Portal User: id={user[0]}, email={user[1]}, cari_id={user[2]}')

# Employee verileri
emps = cur.execute('SELECT COUNT(*), MIN(cari_id), MAX(cari_id) FROM portal_employee').fetchone()
print(f'Employees: Total={emps[0]}, Min cari_id={emps[1]}, Max cari_id={emps[2]}')

# Vehicle verileri
vehs = cur.execute('SELECT COUNT(*), MIN(cari_id), MAX(cari_id) FROM portal_vehicle').fetchone()
print(f'Vehicles: Total={vehs[0]}, Min cari_id={vehs[1]}, Max cari_id={vehs[2]}')

# Eşleşme kontrolü
if user:
    user_cari_id = user[2]
    emp_match = cur.execute('SELECT COUNT(*) FROM portal_employee WHERE cari_id=?', (user_cari_id,)).fetchone()[0]
    veh_match = cur.execute('SELECT COUNT(*) FROM portal_vehicle WHERE cari_id=?', (user_cari_id,)).fetchone()[0]
    
    print(f'\n🔍 Eşleşme Kontrolü (cari_id={user_cari_id}):')
    print(f'   Employees matching: {emp_match}')
    print(f'   Vehicles matching: {veh_match}')
    
    if emp_match == 0:
        print('\n⚠️  SORUN: Portal user cari_id ile eşleşen employee yok!')
        sample_emps = cur.execute('SELECT id, full_name, cari_id FROM portal_employee LIMIT 3').fetchall()
        print(f'   Sample employees: {sample_emps}')
    
    if veh_match == 0:
        print('\n⚠️  SORUN: Portal user cari_id ile eşleşen vehicle yok!')
        sample_vehs = cur.execute('SELECT id, plaka, cari_id FROM portal_vehicle LIMIT 3').fetchall()
        print(f'   Sample vehicles: {sample_vehs}')

conn.close()
