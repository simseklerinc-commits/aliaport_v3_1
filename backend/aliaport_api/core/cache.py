# backend/aliaport_api/core/cache.py
"""Cache Abstraction Layer - Redis/In-Memory Desteği (FAZ 5+)
Production'da Redis'e geçiş için hazır altyapı.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Optional, Dict, Tuple, Callable
import time
import threading


# ============================================================================
# ABSTRACTION LAYER: Cache Backend Interface
# ============================================================================

class CacheBackend(ABC):
    """Abstract base class for cache implementations.
    
    Supports both in-memory (TTLCache) and distributed (Redis) backends.
    """
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Retrieve value from cache. Returns None if key not found or expired."""
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Store value in cache with TTL (time-to-live) in seconds."""
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete specific key from cache. Returns True if key existed."""
        pass
    
    @abstractmethod
    def clear(self) -> None:
        """Clear all cache entries."""
        pass
    
    @abstractmethod
    def invalidate(self, key_prefix: str) -> int:
        """Delete all keys matching prefix pattern. Returns count of deleted keys."""
        pass
    
    @abstractmethod
    def stats(self) -> Dict[str, Any]:
        """Return cache statistics (size, keys, hit rate, etc.)."""
        pass
    
    def get_or_set(self, key: str, ttl_seconds: int, fetcher: Callable[[], Any]) -> Tuple[Any, bool]:
        """Get from cache or compute and store. Returns (value, cache_hit)."""
        data = self.get(key)
        if data is not None:
            return data, True  # cache hit
        value = fetcher()
        self.set(key, value, ttl_seconds)
        return value, False  # cache miss


# ============================================================================
# IMPLEMENTATION: In-Memory Backend (Current)
# ============================================================================

class InMemoryCacheBackend(CacheBackend):
    """Thread-safe in-memory cache with TTL support.
    
    Suitable for single-instance deployments and development.
    For production multi-instance setups, use RedisCacheBackend instead.
    """
    
    def __init__(self, max_items: int = 2000):
        self._store: Dict[str, Tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self._max_items = max_items
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                self._misses += 1
                return None
            
            expires_at, value = entry
            if expires_at < now:
                # Expired entry - clean up
                del self._store[key]
                self._misses += 1
                return None
            
            self._hits += 1
            return value
    
    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        if ttl_seconds <= 0:
            return
        
        expires_at = time.time() + ttl_seconds
        with self._lock:
            # Evict oldest entry if cache is full
            if key not in self._store and len(self._store) >= self._max_items:
                oldest_key = min(self._store.items(), key=lambda kv: kv[1][0])[0]
                self._store.pop(oldest_key, None)
            
            self._store[key] = (expires_at, value)
    
    def delete(self, key: str) -> bool:
        with self._lock:
            return self._store.pop(key, None) is not None
    
    def clear(self) -> None:
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0
    
    def invalidate(self, key_prefix: str) -> int:
        """Delete all keys starting with prefix."""
        removed = 0
        with self._lock:
            keys_to_remove = [k for k in self._store.keys() if k.startswith(key_prefix)]
            for k in keys_to_remove:
                self._store.pop(k, None)
                removed += 1
        return removed
    
    def stats(self) -> Dict[str, Any]:
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0.0
            
            return {
                "backend": "in-memory",
                "size": len(self._store),
                "max_items": self._max_items,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate_percent": round(hit_rate, 2),
                "sample_keys": list(self._store.keys())[:20]
            }


# ============================================================================
# TODO: Redis Backend Implementation (Production)
# ============================================================================
# 
# class RedisCacheBackend(CacheBackend):
#     """Redis-based distributed cache backend.
#     
#     Usage:
#         redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
#         cache_backend = RedisCacheBackend(redis_client, key_prefix="aliaport:")
#     
#     Implementation Guide:
#         - get(): redis.get(key) + json.loads() or pickle.loads()
#         - set(): redis.setex(key, ttl_seconds, serialized_value)
#         - delete(): redis.delete(key)
#         - clear(): redis.flushdb() or scan+delete with prefix
#         - invalidate(): redis.scan_iter(match=f"{prefix}*") + delete
#         - stats(): redis.info("stats") + dbsize
#     
#     Dependencies:
#         pip install redis
#     """
#     pass


# ============================================================================
# GLOBAL CACHE INSTANCE
# ============================================================================

# Default backend: In-Memory (backward compatible)
# To switch to Redis: _cache_backend = RedisCacheBackend(redis_client)
_cache_backend: CacheBackend = InMemoryCacheBackend(max_items=2000)

# BACKWARD COMPATIBILITY: Expose backend as 'cache' for existing code
cache = _cache_backend


# ============================================================================
# PUBLIC API: Backward Compatible Helper Functions
# ============================================================================

def cache_key(namespace: str, **parts: Any) -> str:
    """Generate cache key from namespace and dynamic parts.
    
    Example:
        cache_key("user", user_id=123, lang="tr") -> "user:lang=tr:user_id=123"
    """
    dynamic = ":".join(f"{k}={v}" for k, v in sorted(parts.items()))
    return f"{namespace}:{dynamic}" if dynamic else namespace


def cached_get_or_set(key: str, ttl_seconds: int, fetcher: Callable[[], Any]) -> Tuple[Any, bool]:
    """Get value from cache or compute and store.
    
    Args:
        key: Cache key
        ttl_seconds: Time to live in seconds
        fetcher: Function to compute value on cache miss
    
    Returns:
        Tuple of (value, cache_hit: bool)
    """
    return _cache_backend.get_or_set(key, ttl_seconds, fetcher)


def get_cache() -> CacheBackend:
    """Get current cache backend instance.
    
    Useful for dependency injection and testing.
    """
    return _cache_backend


def set_cache_backend(backend: CacheBackend) -> None:
    """Replace cache backend (for testing or Redis migration).
    
    Example:
        # Switch to Redis in production
        redis_backend = RedisCacheBackend(redis_client)
        set_cache_backend(redis_backend)
    """
    global _cache_backend
    _cache_backend = backend
