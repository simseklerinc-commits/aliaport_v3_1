# backend/aliaport_api/config/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

# SQLite database - Enterprise yapı
# Database dosyası proje root/database/ klasöründe
DB_PATH = Path(__file__).parent.parent.parent.parent / "database" / "aliaport.db"
DB_PATH.parent.mkdir(exist_ok=True)  # database klasörünü oluştur
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLite için check_same_thread=False gerekli
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
