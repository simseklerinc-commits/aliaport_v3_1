import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { queryClient } from '@/core/cache/queryClient';

interface PingResult {
  ok: boolean;
  status: number;
  json?: any;
  error?: string;
}

export const ApiDebugPanel: React.FC = () => {
  const { token } = useAuth();
  const [ping, setPing] = useState<PingResult | null>(null);
  const [secured, setSecured] = useState<PingResult | null>(null);

  useEffect(() => {
    // Health endpoint tek: /health
    (async () => {
      try {
        const r = await fetch('/health');
        const data = await r.json().catch(() => undefined);
        setPing({ ok: r.ok, status: r.status, json: data });
      } catch (e: any) {
        setPing({ ok: false, status: 0, error: e.message });
      }
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    // Örnek korunan endpoint (varsayım: /api/cari?page=1 veya /api/cari/list)
    const protectedCandidates = ['/api/cari', '/api/cari?page=1'];
    (async () => {
      for (const url of protectedCandidates) {
        try {
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await r.json().catch(() => undefined);
          if (r.ok) {
            setSecured({ ok: true, status: r.status, json: data });
            break;
          } else {
            setSecured({ ok: false, status: r.status, json: data });
          }
        } catch (e: any) {
          setSecured({ ok: false, status: 0, error: e.message });
        }
      }
    })();
  }, [token]);

  // Query cache metrics
  const queries = queryClient.getQueryCache().getAll();
  const totalQueries = queries.length;
  const fetching = queries.filter(q => q.state.fetchStatus === 'fetching').length;
  const errors = queries.filter(q => q.state.status === 'error').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 text-xs bg-black/80 text-white p-3 rounded shadow space-y-2">
      <div className="font-semibold mb-2">API Debug Panel</div>
      <div className="space-y-2">
        <div>
          <div className="font-medium">Health Ping:</div>
          {!ping && <div>Yükleniyor...</div>}
          {ping && (
            <div className={ping.ok ? 'text-green-400' : 'text-red-400'}>
              Status: {ping.status} {ping.ok ? 'OK' : 'FAIL'}
              {ping.error && <div>Err: {ping.error}</div>}
            </div>
          )}
        </div>
        <div>
          <div className="font-medium">Secured Fetch (Cari):</div>
          {!token && <div>Token yok (giriş yapın)</div>}
          {token && !secured && <div>İstek gönderiliyor...</div>}
          {secured && (
            <div className={secured.ok ? 'text-green-400' : 'text-orange-400'}>
              Status: {secured.status} {secured.ok ? 'OK' : 'FAIL'}
              {secured.error && <div>Err: {secured.error}</div>}
            </div>
          )}
        </div>
        <div>
          <div className="font-medium">Query Cache:</div>
          <div>Toplam: {totalQueries} · Fetching: {fetching} · Hata: {errors}</div>
        </div>
      </div>
    </div>
  );
};
