import React from 'react';
import { useRequestMetaStore } from '../../core/state/requestMetaStore';

export const RequestDebugPanel: React.FC = () => {
  const { lastRequestId, lastErrorCode, reset } = useRequestMetaStore();
  if (!lastRequestId && !lastErrorCode) return null;
  return (
    <div className="fixed bottom-2 right-2 bg-neutral-900 text-neutral-100 text-xs px-3 py-2 rounded shadow-lg space-y-1 z-40">
      {lastRequestId && (
        <div className="flex items-center gap-2">
          <span className="opacity-70">req-id:</span>
          <code className="font-mono">{lastRequestId}</code>
        </div>
      )}
      {lastErrorCode && (
        <div className="flex items-center gap-2">
          <span className="opacity-70">error:</span>
          <code className="font-mono text-red-300">{lastErrorCode}</code>
        </div>
      )}
      <button
        onClick={() => reset()}
        className="mt-1 w-full bg-neutral-700 hover:bg-neutral-600 transition rounded py-1 text-center"
      >Temizle</button>
    </div>
  );
};

export default RequestDebugPanel;
