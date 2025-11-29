@echo off
cd /d C:\Aliaport\Aliaport_v3_1\backend
set PYTHONPATH=C:\Aliaport\Aliaport_v3_1\backend
python -m uvicorn aliaport_api.main:app --reload --host 0.0.0.0 --port 8000
pause
