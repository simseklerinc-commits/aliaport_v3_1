"""Storage configuration helpers for SGK uploads."""
from __future__ import annotations

import os
from pathlib import Path

DEFAULT_BASE_SGK_DIR = "./uploads/sgk"  # Proje içinde uploads klasörü


def get_base_sgk_dir() -> Path:
    """Return the base directory for SGK documents as an absolute Path."""
    env_value = os.getenv("BASE_SGK_DIR", DEFAULT_BASE_SGK_DIR)
    base_path = Path(env_value).expanduser()
    # Klasörü oluştur
    base_path.mkdir(parents=True, exist_ok=True)
    try:
        # resolve() without strict to allow non-existent paths while still normalizing
        return base_path.resolve()
    except FileNotFoundError:
        # Path may be on a mount that does not exist yet; fall back to expanded path
        return base_path
