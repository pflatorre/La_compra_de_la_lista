import React, { useState } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Users,
  ChevronRight,
  Settings,
  Smartphone,
  Share,
  PlusSquare,
  X,
} from 'lucide-react';
import { ThemeMode } from '../utils/storage';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsScreenProps {
  theme: ThemeMode;
  usersCount: number;
  onToggleTheme: () => void;
  onOpenUsersManagement: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  usersCount,
  onToggleTheme,
  onOpenUsersManagement,
  onBack,
}) => {
  const safeUsersCount = typeof usersCount === 'number' ? usersCount : 0;
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-16 flex-1 flex flex-col">
        {/* Cabecera con botón Volver */}
        <header className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a inicio"
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-semibold text-sm inline-flex items-center gap-2 shadow-xs transition-all whitespace-nowrap"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1
              className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Configuración
            </h1>
          </div>
        </header>

        <main className="space-y-3.5">
          {/* 1. Botón de modo día / noche */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full min-h-[72px] p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 active:scale-[0.99] border border-stone-200/90 dark:border-stone-800 shadow-xs flex items-center justify-between gap-4 text-left transition-all"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                {theme === 'dark' ? (
                  <Sun className="w-6 h-6 text-amber-400" />
                ) : (
                  <Moon className="w-6 h-6 text-stone-700" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Modo día / noche
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Actualmente en{' '}
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {theme === 'dark'
                      ? 'modo oscuro (noche)'
                      : 'modo claro (día)'}
                  </span>
                  . Toca para cambiar.
                </p>
              </div>
            </div>

            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold whitespace-nowrap shrink-0">
              {theme === 'dark' ? 'Pasar a día' : 'Pasar a noche'}
            </span>
          </button>

          {/* 2. Botón de Gestión de usuarios */}
          <button
            type="button"
            onClick={onOpenUsersManagement}
            className="w-full min-h-[72px] p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 active:scale-[0.99] border border-stone-200/90 dark:border-stone-800 shadow-xs flex items-center justify-between gap-4 text-left transition-all"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Gestión de usuarios
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  {safeUsersCount === 0
                    ? 'Aún no hay usuarios registrados'
                    : `${safeUsersCount} ${
                        safeUsersCount === 1
                          ? 'usuario registrado'
                          : 'usuarios registrados'
                      } · Editar nombre y correo`}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
          </button>

          {/* 3. Botón para instalar la aplicación en el móvil (iOS / Android) */}
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full min-h-[72px] p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 active:scale-[0.99] border border-stone-200/90 dark:border-stone-800 shadow-xs flex items-center justify-between gap-4 text-left transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                    Instalar en el móvil (iOS / Android)
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    Añade «La Compra de la Lista» a tu pantalla de inicio como una app nativa
                  </p>
                </div>
              </div>

              <span className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold whitespace-nowrap shrink-0">
                {isInstallable ? 'Instalar' : isIOS ? 'Ver pasos iOS' : 'Cómo instalar'}
              </span>
            </button>
          )}
        </main>
      </div>

      {/* Modal con instrucciones paso a paso para iOS (Safari) y Android (Chrome) */}
      {showInstallGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cómo instalar la aplicación en el móvil"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h2
                  className="text-lg font-bold text-stone-900 dark:text-stone-100"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Instalar en tu móvil
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-stone-700 dark:text-stone-300">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>🍏 En iPhone / iPad (Safari)</span>
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  <li>
                    Abre la web publicada en <strong>Safari</strong>.
                  </li>
                  <li>
                    Pulsa el botón <strong>Compartir</strong>{' '}
                    <Share className="inline w-4 h-4 text-emerald-600 -mt-0.5" />{' '}
                    en la barra inferior.
                  </li>
                  <li>
                    Baja y selecciona{' '}
                    <strong>«Añadir a pantalla de inicio»</strong>{' '}
                    <PlusSquare className="inline w-4 h-4 text-emerald-600 -mt-0.5" />.
                  </li>
                  <li>
                    Pulsa <strong>«Añadir»</strong> arriba a la derecha.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>🤖 En Android (Chrome)</span>
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  <li>
                    Abre la web publicada en <strong>Google Chrome</strong>.
                  </li>
                  <li>
                    Toca el menú de los tres puntos <strong>(⋮)</strong> arriba
                    a la derecha.
                  </li>
                  <li>
                    Pulsa en <strong>«Instalar aplicación»</strong> o{' '}
                    <strong>«Añadir a pantalla de inicio»</strong>.
                  </li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
