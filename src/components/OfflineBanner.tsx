import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced';
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  syncStatus,
}) => {
  if (isOnline && syncStatus === 'idle') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full px-4 pt-2.5 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto pointer-events-auto">
        {!isOnline ? (
          <div className="rounded-2xl bg-amber-600 dark:bg-amber-700 text-white px-4 py-3 shadow-lg border border-amber-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1 text-xs sm:text-sm leading-snug">
              <p className="font-bold">Modo offline (sin conexión)</p>
              <p className="text-amber-50 text-xs">
                Tus cambios se guardan en el móvil y se sincronizarán automáticamente al recuperar la red.
              </p>
            </div>
          </div>
        ) : syncStatus === 'syncing' ? (
          <div className="rounded-2xl bg-emerald-700 text-white px-4 py-2.5 shadow-lg border border-emerald-500/40 flex items-center gap-3 animate-in fade-in duration-150">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Conexión recuperada · Sincronizando cambios pendientes...
            </span>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-600 text-white px-4 py-2.5 shadow-lg border border-emerald-500/40 flex items-center gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Conexión restablecida · Todos los datos están sincronizados
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
