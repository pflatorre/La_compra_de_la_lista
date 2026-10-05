import { AppUser, ShoppingList } from '../types';

const LISTS_STORAGE_KEY = 'la_compra_de_la_lista_listas_v1';
const CATALOG_STORAGE_KEY = 'la_compra_de_la_lista_catalogo_v1';
const USERS_STORAGE_KEY = 'la_compra_de_la_lista_usuarios_v1';
const THEME_STORAGE_KEY = 'la_compra_de_la_lista_tema_v1';

/**
 * Normaliza un texto eliminando acentos/diacríticos, pasando a minúsculas
 * y recortando espacios para comparaciones sin distinción de mayúsculas ni acentos.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Añade un producto al catálogo si no existe aún (ignorando mayúsculas y acentos).
 */
export function addProductToCatalog(catalog: string[], rawName: string): string[] {
  const trimmed = rawName.trim();
  if (!trimmed) return catalog;

  const normalizedNew = normalizeText(trimmed);
  const exists = catalog.some((item) => normalizeText(item) === normalizedNew);
  if (exists) {
    return catalog;
  }
  return [...catalog, trimmed];
}

/**
 * Devuelve sugerencias del catálogo cuyo nombre contenga el texto buscado
 * (sin distinguir mayúsculas/minúsculas ni acentos).
 */
export function getCatalogSuggestions(catalog: string[], query: string): string[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  return catalog
    .filter((item) => {
      const normItem = normalizeText(item);
      return normItem.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const normA = normalizeText(a);
      const normB = normalizeText(b);
      const aStarts = normA.startsWith(normalizedQuery);
      const bStarts = normB.startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return normA.localeCompare(normB, 'es');
    });
}

export function loadLists(): ShoppingList[] {
  try {
    const raw = localStorage.getItem(LISTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLists(lists: ShoppingList[]): void {
  try {
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));
  } catch (err) {
    console.error('Error guardando listas en localStorage:', err);
  }
}

export function loadCatalog(): string[] {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCatalog(catalog: string[]): void {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.error('Error guardando catálogo en localStorage:', err);
  }
}

export function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error guardando usuarios en localStorage:', err);
  }
}

export type ThemeMode = 'light' | 'dark';

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // ignore storage errors
  }
  return 'light';
}

export function saveThemePreference(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatSpanishDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  const todayStr = getTodayDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(
    tomorrowDate.getMonth() + 1
  ).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const cleanFormatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  if (dateStr === todayStr) {
    return `Hoy · ${cleanFormatted}`;
  }
  if (dateStr === tomorrowStr) {
    return `Mañana · ${cleanFormatted}`;
  }
  return cleanFormatted;
}

export function formatCompletedTimestamp(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
