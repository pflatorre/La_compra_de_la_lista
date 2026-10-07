import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Users,
  ChevronRight,
  Settings,
  Bell,
  BellOff,
  CheckCircle2,
  Send,
  Mail,
  Copy,
  Activity,
} from 'lucide-react';
import { ShoppingList } from '../types';
import { ThemeMode } from '../utils/storage';
import {
  generateGoogleAppsScriptCode,
  verifySupabaseRestEndpoints,
} from '../lib/supabase';
import {
  checkAndNotifyTomorrowShoppingLists,
  getNotificationPermission,
  getTomorrowDateString,
  isServiceWorkerSupported,
  loadPushRemindersEnabled,
  registerPushServiceWorker,
  requestPushNotificationPermission,
  savePushRemindersEnabled,
  showServiceWorkerNotification,
} from '../utils/pushNotifications';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsScreenProps {
  theme: ThemeMode;
  usersCount: number;
  lists: ShoppingList[];
  onToggleTheme: () => void;
  onOpenUsersManagement: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  usersCount,
  lists,
  onToggleTheme,
  onOpenUsersManagement,
  onBack,
}) => {
  const [swReady, setSwReady] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getNotificationPermission());
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() =>
    loadPushRemindersEnabled()
  );
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [appsScriptFeedback, setAppsScriptFeedback] = useState<string | null>(
    null
  );
  const [restCheckOk, setRestCheckOk] = useState<boolean | null>(null);

  const tomorrow = getTomorrowDateString();
  const tomorrowListsCount = lists.filter(
    (l) => l.estado !== 'realizada' && l.fechaCompra === tomorrow
  ).length;

  useEffect(() => {
    if (!isServiceWorkerSupported()) return;
    registerPushServiceWorker().then((reg) => {
      if (reg) setSwReady(true);
    });
  }, []);

  const handleTogglePushNotifications = async () => {
    setStatusFeedback(null);

    if (permission === 'unsupported') {
      setStatusFeedback(
        'Este navegador no soporta notificaciones push nativas.'
      );
      return;
    }

    if (permission !== 'granted') {
      const nextPerm = await requestPushNotificationPermission();
      setPermission(nextPerm);
      if (nextPerm === 'granted') {
        setRemindersEnabled(true);
        const sent = await checkAndNotifyTomorrowShoppingLists(lists, {
          force: true,
        });
        setStatusFeedback(
          sent > 0
            ? `Notificaciones activadas. Se ha enviado ${sent} recordatorio para mañana.`
            : 'Notificaciones push activadas correctamente.'
        );
      } else if (nextPerm === 'denied') {
        setStatusFeedback(
          'Permiso denegado en el navegador. Habilita las notificaciones en los ajustes del navegador.'
        );
      }
      return;
    }

    const nextEnabled = !remindersEnabled;
    setRemindersEnabled(nextEnabled);
    savePushRemindersEnabled(nextEnabled);
    setStatusFeedback(
      nextEnabled
        ? 'Recordatorios push para compras del día siguiente activados.'
        : 'Recordatorios push pausados.'
    );
  };

  const handleTestTomorrowNotification = async () => {
    setStatusFeedback(null);

    if (permission !== 'granted') {
      const nextPerm = await requestPushNotificationPermission();
      setPermission(nextPerm);
      if (nextPerm !== 'granted') {
        setStatusFeedback(
          'Primero debes conceder permiso de notificaciones al navegador.'
        );
        return;
      }
      setRemindersEnabled(true);
    }

    if (tomorrowListsCount > 0) {
      const sent = await checkAndNotifyTomorrowShoppingLists(lists, {
        force: true,
      });
      if (sent > 0) {
        setStatusFeedback(
          `Se ha enviado el recordatorio push de ${sent} ${
            sent === 1 ? 'compra programada' : 'compras programadas'
          } para mañana.`
        );
        return;
      }
    }

    // Si no hay compras para mañana todavía, enviar notificación de prueba a través del Service Worker
    const ok = await showServiceWorkerNotification({
      title: 'Recordatorio de compra para mañana',
      body: 'Tu Service Worker está activo. Cuando tengas una lista con fecha de mañana recibirás este aviso.',
      tag: 'prueba-recordatorio-compra',
    });

    setStatusFeedback(
      ok
        ? 'Notificación de prueba enviada a través del Service Worker.'
        : 'No se pudo mostrar la notificación en este dispositivo.'
    );
  };

  const isPushActive = permission === 'granted' && remindersEnabled;

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
                    {theme === 'dark' ? 'modo oscuro (noche)' : 'modo claro (día)'}
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
                  {usersCount === 0
                    ? 'Aún no hay usuarios registrados'
                    : `${usersCount} ${
                        usersCount === 1
                          ? 'usuario registrado'
                          : 'usuarios registrados'
                      } · Editar nombre y correo`}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
          </button>

          {/* 3. Notificaciones Push (Service Worker) para compras del día siguiente */}
          <section className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isPushActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {isPushActive ? (
                    <Bell className="w-6 h-6" />
                  ) : (
                    <BellOff className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                      Notificaciones Push
                    </h2>
                    {swReady && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Service Worker activo</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    Recuerda al usuario las compras programadas para el día siguiente
                    {tomorrowListsCount > 0
                      ? ` (${tomorrowListsCount} prevista para mañana)`
                      : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePushNotifications}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isPushActive
                    ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isPushActive ? 'Desactivar' : 'Activar avisos'}
              </button>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestTomorrowNotification}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {tomorrowListsCount > 0
                    ? 'Enviar recordatorio de mañana ahora'
                    : 'Probar notificación push'}
                </span>
              </button>

              {statusFeedback && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {statusFeedback}
                </p>
              )}
            </div>
          </section>

          {/* 4. Recordatorio por correo 20:00h (Google Apps Script + Diagnóstico REST Supabase) */}
          <section className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Correo automático 20:00h (Apps Script)
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  Copia el código ya configurado con tu URL base y tu clave API de Supabase sin errores de ruta
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      generateGoogleAppsScriptCode()
                    );
                    setRestCheckOk(true);
                    setAppsScriptFeedback(
                      'Código de Apps Script copiado al portapapeles con tus credenciales exactas.'
                    );
                  } catch {
                    setRestCheckOk(false);
                    setAppsScriptFeedback(
                      'No se pudo copiar automáticamente al portapapeles.'
                    );
                  }
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar código Apps Script</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setAppsScriptFeedback('Verificando endpoint REST y RLS...');
                  const res = await verifySupabaseRestEndpoints();
                  setRestCheckOk(res.ok);
                  setAppsScriptFeedback(res.message);
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Verificar conexión REST</span>
              </button>
            </div>

            {appsScriptFeedback && (
              <p
                className={`text-xs font-medium ${
                  restCheckOk === false
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {appsScriptFeedback}
              </p>
            )}
          </section>

          {/* 5. Botón de instalación PWA en pantalla de inicio */}
          <PWAInstallButton />
        </main>
      </div>
    </div>
  );
};
