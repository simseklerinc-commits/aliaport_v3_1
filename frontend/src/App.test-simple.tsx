// Minimal test component - beyaz ekran debug için
import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>✅ Aliaport Yüklendi</h1>
      <p>Frontend çalışıyor!</p>
      <p>Tarih: {new Date().toLocaleString('tr-TR')}</p>
    </div>
  );
}
