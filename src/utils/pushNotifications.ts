import { ShoppingList } from '../types';

const NOTIFIED_TOMORROW_STORAGE_KEY = 'la_compra_notified_tomorrow_v1';
const PUSH_REMINDERS_ENABLED_KEY = 'la_compra_push_enabled_v1';

/**
 * Devuelve la fecha de MAÑANA en formato YYYY-MM-DD (hora local).
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function loadPushRemindersEnabled(): boolean {
  try {
    const raw = localStorage.getItem(PUSH_REMINDERS_ENABLED_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function savePushRemindersEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PUSH_REMINDERS_ENABLED_KEY, String(enabled));
  } catch {
    // Ignorar error de almacenamiento
  }
}

/**
 * Registra el Service Worker de notificaciones push (`/push-sw.js`)
 * o recupera la registración activa de PWA.
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;

    const registration = await navigator.serviceWorker.register('/push-sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('No se pudo registrar el Service Worker:', err);
    return null;
  }
}

/**
 * Solicita permiso al navegador para mostrar Notificaciones Push y asegura que el Service Worker esté activo.
 */
export async function requestPushNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!isNotificationSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    savePushRemindersEnabled(true);
    await registerPushServiceWorker();
  }
  return permission;
}

function getNotifiedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_TOMORROW_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function markListNotifiedForDate(listId: string, dateStr: string): void {
  try {
    const current = getNotifiedMap();
    current[listId] = dateStr;
    localStorage.setItem(NOTIFIED_TOMORROW_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignorar error
  }
}

/**
 * Construye el texto del recordatorio para una lista programada para mañana.
 */
export function buildTomorrowReminderPayload(list: ShoppingList): {
  title: string;
  body: string;
  tag: string;
} {
  const userName = list.usuarioNombre ? `Estimado ${list.usuarioNombre}, ` : '';
  const itemsPreview = list.lineas
    .slice(0, 4)
    .map(
      (l) =>
        `${l.nombreProducto} (${l.cantidad} ${
          l.cantidad === 1 ? 'ud.' : 'uds.'
        })`
    )
    .join(', ');
  const extraCount =
    list.lineas.length > 4 ? ` y ${list.lineas.length - 4} más` : '';

  return {
    title: `Compra para mañana: ${list.nombre}`,
    body: `${userName}recuerda que mañana tienes previsto hacer la compra «${list.nombre}»: ${itemsPreview}${extraCount}.`,
    tag: `recordatorio-manana-${list.id}-${list.fechaCompra}`,
  };
}

/**
 * Envía una notificación a través del Service Worker activo (o fallback a Notification API).
 */
export async function showServiceWorkerNotification(payload: {
  title: string;
  body: string;
  tag: string;
}): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await registerPushServiceWorker();
    if (registration) {
      if (registration.active) {
        registration.active.postMessage({
          type: 'SHOW_SHOPPING_REMINDER',
          ...payload,
        });
        return true;
      }
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: payload.tag,
      });
      return true;
    }
  } catch {
    // Fallback a Notification API directa
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/icon.svg',
      tag: payload.tag,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Comprueba todas las listas pendientes cuya fecha de compra sea MAÑANA
 * y dispara automáticamente la notificación push del Service Worker si aún no se ha enviado hoy.
 */
export async function checkAndNotifyTomorrowShoppingLists(
  lists: ShoppingList[],
  options?: { force?: boolean }
): Promise<number> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return 0;
  }
  if (!loadPushRemindersEnabled() && !options?.force) {
    return 0;
  }

  const tomorrow = getTomorrowDateString();
  const notifiedMap = getNotifiedMap();

  const tomorrowLists = lists.filter(
    (l) => l.estado !== 'realizada' && l.fechaCompra === tomorrow
  );

  let sentCount = 0;

  for (const list of tomorrowLists) {
    const alreadyNotifiedForDate = notifiedMap[list.id] === tomorrow;
    if (alreadyNotifiedForDate && !options?.force) {
      continue;
    }

    const payload = buildTomorrowReminderPayload(list);
    const sent = await showServiceWorkerNotification(payload);
    if (sent) {
      markListNotifiedForDate(list.id, tomorrow);
      sentCount++;
    }
  }

  return sentCount;
}
