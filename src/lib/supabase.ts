import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ShoppingLine, ShoppingList, ShoppingListStatus } from '../types';

/**
 * Limpia y normaliza la URL de Supabase para evitar el error PGRST125 ("Invalid path specified in request URL")
 * cuando el usuario pega comillas, rutas como "/rest/v1", o la URL del dashboard de Supabase.
 */
function sanitizeSupabaseUrl(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().replace(/^['"]+|['"]+$/g, '').trim();

  // Si el usuario pegó la URL del Dashboard de Supabase: https://supabase.com/dashboard/project/<project-ref>...
  const dashboardMatch = cleaned.match(
    /supabase\.com\/dashboard\/project\/([a-z0-9]+)/i
  );
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Si no tiene protocolo pero parece un dominio .supabase.co
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    if (cleaned.includes('.supabase.co')) {
      cleaned = `https://${cleaned}`;
    } else if (/^[a-z0-9]{15,25}$/i.test(cleaned)) {
      // Si pegó únicamente el Project ID / Reference ID
      cleaned = `https://${cleaned}.supabase.co`;
    }
  }

  try {
    const parsed = new URL(cleaned);
    // Devolver únicamente el origin (ej. https://xyzcompany.supabase.co) sin "/rest/v1" ni barras finales
    return parsed.origin;
  } catch {
    return '';
  }
}

function sanitizeSupabaseKey(raw?: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
}

const supabaseUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = sanitizeSupabaseKey(
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 15
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface DbLineaRow {
  id: string;
  lista_id: string;
  nombre_producto: string;
  cantidad: number;
  marcado: boolean;
  guardada?: boolean;
  orden?: number;
}

interface DbListaRow {
  id: string;
  nombre: string;
  fecha_compra: string;
  estado: ShoppingListStatus;
  fecha_finalizacion: string | null;
}

export async function fetchAllDataFromSupabase(): Promise<{
  lists: ShoppingList[];
  catalog: string[];
}> {
  if (!supabase) {
    return { lists: [], catalog: [] };
  }

  const [listsRes, linesRes, catalogRes] = await Promise.all([
    supabase
      .from('listas_compra')
      .select('*')
      .order('fecha_compra', { ascending: true }),
    supabase
      .from('lineas_compra')
      .select('*')
      .order('orden', { ascending: true }),
    supabase
      .from('catalogo_productos')
      .select('nombre')
      .order('nombre', { ascending: true }),
  ]);

  if (listsRes.error) {
    throw listsRes.error;
  }
  if (linesRes.error) {
    throw linesRes.error;
  }
  if (catalogRes.error) {
    throw catalogRes.error;
  }

  const allLines = (linesRes.data ?? []) as DbLineaRow[];
  const linesByListId = new Map<string, ShoppingLine[]>();

  for (const row of allLines) {
    const mappedLine: ShoppingLine = {
      id: row.id,
      nombreProducto: row.nombre_producto,
      cantidad: row.cantidad,
      marcado: row.marcado,
      guardada: row.guardada ?? true,
    };
    const existing = linesByListId.get(row.lista_id) ?? [];
    existing.push(mappedLine);
    linesByListId.set(row.lista_id, existing);
  }

  const lists: ShoppingList[] = ((listsRes.data ?? []) as DbListaRow[]).map(
    (row) => ({
      id: row.id,
      nombre: row.nombre,
      fechaCompra: row.fecha_compra,
      estado: row.estado,
      lineas: linesByListId.get(row.id) ?? [],
      ...(row.fecha_finalizacion
        ? { fechaFinalizacion: row.fecha_finalizacion }
        : {}),
    })
  );

  const catalog = ((catalogRes.data ?? []) as { nombre: string }[]).map(
    (c) => c.nombre
  );

  return { lists, catalog };
}

export async function insertCatalogProductInSupabase(
  nombre: string
): Promise<void> {
  if (!supabase || !nombre.trim()) return;
  const { error } = await supabase
    .from('catalogo_productos')
    .insert({ nombre: nombre.trim() });

  // Ignoramos el código 23505 (unique_violation) porque significa que el producto ya existe en el catálogo
  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function createShoppingListInSupabase(
  list: ShoppingList
): Promise<void> {
  if (!supabase) return;

  const { error: listErr } = await supabase.from('listas_compra').insert({
    id: list.id,
    nombre: list.nombre,
    fecha_compra: list.fechaCompra,
    estado: list.estado,
    fecha_finalizacion: list.fechaFinalizacion ?? null,
  });

  if (listErr) throw listErr;

  if (list.lineas.length > 0) {
    const linesToInsert = list.lineas.map((line, idx) => ({
      id: line.id,
      lista_id: list.id,
      nombre_producto: line.nombreProducto,
      cantidad: line.cantidad,
      marcado: line.marcado,
      guardada: true,
      orden: idx,
    }));

    const { error: linesErr } = await supabase
      .from('lineas_compra')
      .insert(linesToInsert);

    if (linesErr) throw linesErr;
  }
}

export async function updateShoppingListInSupabase(
  listId: string,
  data: { nombre: string; fechaCompra: string; lineas: ShoppingLine[] }
): Promise<void> {
  if (!supabase) return;

  const { error: updateErr } = await supabase
    .from('listas_compra')
    .update({
      nombre: data.nombre,
      fecha_compra: data.fechaCompra,
    })
    .eq('id', listId);

  if (updateErr) throw updateErr;

  // Reemplazar las líneas de la lista manteniendo sus IDs y estado
  const { error: delErr } = await supabase
    .from('lineas_compra')
    .delete()
    .eq('lista_id', listId);

  if (delErr) throw delErr;

  if (data.lineas.length > 0) {
    const linesToInsert = data.lineas.map((line, idx) => ({
      id: line.id,
      lista_id: listId,
      nombre_producto: line.nombreProducto,
      cantidad: line.cantidad,
      marcado: line.marcado,
      guardada: true,
      orden: idx,
    }));

    const { error: insErr } = await supabase
      .from('lineas_compra')
      .insert(linesToInsert);

    if (insErr) throw insErr;
  }
}

export async function deleteShoppingListInSupabase(
  listId: string
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('listas_compra')
    .delete()
    .eq('id', listId);
  if (error) throw error;
}

export async function updateListStatusInSupabase(
  listId: string,
  estado: ShoppingListStatus,
  fechaFinalizacion?: string
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('listas_compra')
    .update({
      estado,
      fecha_finalizacion: fechaFinalizacion ?? null,
    })
    .eq('id', listId);
  if (error) throw error;
}

export async function toggleLineCheckInSupabase(
  listId: string,
  lineId: string,
  marcado: boolean
): Promise<void> {
  if (!supabase) return;
  await Promise.all([
    supabase.from('lineas_compra').update({ marcado }).eq('id', lineId),
    supabase
      .from('listas_compra')
      .update({ estado: 'en curso' })
      .eq('id', listId),
  ]);
}
