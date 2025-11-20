# app/aliaport_web.py
from fastapi import FastAPI
from .database import Base, engine
from .models_cari import Cari  # tablonun ORM'i yüklensin
from . import router_cari
from . import router_cari
from . import router_motorbot
from . import router_mbtrip

app = FastAPI(title="Aliaport v3.1")

# ORM tabloları (zaten SQL'de var; burada create_all tekrar dener, zarar yok)
Base.metadata.create_all(bind=engine)

app.include_router(router_cari.router)
app.include_router(router_cari.router)
app.include_router(router_motorbot.router)
app.include_router(router_mbtrip.router)

@app.get("/")
def root():
    return {"status": "ok", "app": "Aliaport_v3_1"}
