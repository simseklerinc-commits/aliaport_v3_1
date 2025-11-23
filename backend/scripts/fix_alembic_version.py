# backend/scripts/fix_alembic_version.py
"""
Fix alembic_version table - Reset to last known good revision.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from aliaport_api.config.database import engine

def fix_alembic_version():
    """Reset alembic_version to 5cb311f7ffd7."""
    with engine.connect() as conn:
        # Check current version
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        current = result.fetchone()
        print(f"Current version: {current[0] if current else 'None'}")
        
        # Update to valid version
        conn.execute(text("UPDATE alembic_version SET version_num = '5cb311f7ffd7'"))
        conn.commit()
        
        # Verify
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        new = result.fetchone()
        print(f"Updated version: {new[0]}")
        print("✅ Alembic version fixed!")

if __name__ == "__main__":
    fix_alembic_version()
