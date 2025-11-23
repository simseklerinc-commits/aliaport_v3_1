# backend/aliaport_api/core/cache.py
"""Basit In-Memory TTL Cache Katmanı (FAZ 5)
Redis öncesi geçici hafızada düşük hacimli veri tutmak için.
"""
from __future__ import annotations
from typing import Any, Optional, Dict, Tuple
import time
import threading

class TTLCache:
    def __init__(self, max_items: int = 1000):
        self._store: Dict[str, Tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self._max_items = max_items

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            expires_at, value = entry
            if expires_at < now:
                # Süresi dolmuş; sil ve None dön
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        if ttl_seconds <= 0:
            return
        expires_at = time.time() + ttl_seconds
        with self._lock:
            if len(self._store) >= self._max_items:
                # Basit temizleme: en eski expire süresi
                oldest_key = min(self._store.items(), key=lambda kv: kv[1][0])[0]
                self._store.pop(oldest_key, None)
            self._store[key] = (expires_at, value)

    def invalidate(self, key_prefix: str) -> int:
        """Belirli prefix ile başlayan anahtarları temizle. Dönüş: silinen sayısı."""
        removed = 0
        with self._lock:
            keys = [k for k in self._store.keys() if k.startswith(key_prefix)]
            for k in keys:
                self._store.pop(k, None)
                removed += 1
        return removed

    def stats(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "size": len(self._store),
                "keys": list(self._store.keys())[:20]
            }

# Global cache instance
cache = TTLCache(max_items=2000)

# Helper fonksiyonlar

def cache_key(namespace: str, **parts: Any) -> str:
    dynamic = ":".join(f"{k}={v}" for k, v in sorted(parts.items()))
    return f"{namespace}:{dynamic}" if dynamic else namespace

def cached_get_or_set(key: str, ttl_seconds: int, fetcher):
    data = cache.get(key)
    if data is not None:
        return data, True  # hit
    value = fetcher()
    cache.set(key, value, ttl_seconds)
    return value, False  # miss
