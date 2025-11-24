#!/usr/bin/env python3
"""Check database users"""
import sys
from pathlib import Path
sys.path.insert(0, '.')

backend_path = Path(__file__).parent
db_file = backend_path / "aliaport.db"

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = f"sqlite:///{db_file.absolute()}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)
session = Session()

result = session.execute(text('SELECT id, email, is_active FROM users'))
rows = result.fetchall()
print(f'Toplam users: {len(rows)}')
for row in rows:
    print(f'  ID: {row[0]}, Email: {row[1]}, Active: {row[2]}')

session.close()
