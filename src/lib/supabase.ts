import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppUser, ShoppingLine, ShoppingList, ShoppingListStatus } from '../types';

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
      cleaned = `https://${cleaned}.supabase.co`;
    }
  }

  try {
    const parsed = new URL(cleaned);
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
  usuario_id?: string | null;
  usuario_nombre?: string | null;
}

interface DbUsuarioRow {
  id: string;
  nombre: string;
  email?: string | null;
  recibir_recordatorio?: boolean | null;
  password: string;
}

export async function fetchAllDataFromSupabase(): Promise<{
  lists: ShoppingList[];
  catalog: string[];
  users: AppUser[];
}> {
  if (!supabase) {
    return { lists: [], catalog: [], users: [] };
  }

  const [listsRes, linesRes, catalogRes, usersRes] = await Promise.all([
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
    supabase
      .from('usuarios')
      .select('*')
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

  // Si la tabla usuarios aún no ha sido creada en Supabase, no lanzamos error para no romper la carga
  const users: AppUser[] = !usersRes.error
    ? ((usersRes.data ?? []) as DbUsuarioRow[]).map((u) => ({
        id: u.id,
        nombre: u.nombre,
        ...(u.email ? { email: u.email } : {}),
        recibirRecordatorio: Boolean(u.recibir_recordatorio && u.email),
        password: u.password,
      }))
    : [];

  const usersById = new Map<string, AppUser>();
  for (const u of users) {
    usersById.set(u.id, u);
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
    (row) => {
      const matchedUser = row.usuario_id
        ? usersById.get(row.usuario_id)
        : undefined;
      return {
        id: row.id,
        nombre: row.nombre,
        fechaCompra: row.fecha_compra,
        estado: row.estado,
        lineas: linesByListId.get(row.id) ?? [],
        ...(row.fecha_finalizacion
          ? { fechaFinalizacion: row.fecha_finalizacion }
          : {}),
        ...(row.usuario_id ? { usuarioId: row.usuario_id } : {}),
        ...(row.usuario_nombre || matchedUser?.nombre
          ? { usuarioNombre: row.usuario_nombre || matchedUser?.nombre }
          : {}),
      };
    }
  );

  const catalog = ((catalogRes.data ?? []) as { nombre: string }[]).map(
    (c) => c.nombre
  );

  return { lists, catalog, users };
}

export async function createUserInSupabase(user: AppUser): Promise<void> {
  if (!supabase) return;
  const shouldRemind = Boolean(
    user.email && user.email.trim().length > 0 && user.recibirRecordatorio
  );

  const { error } = await supabase.from('usuarios').insert({
    id: user.id,
    nombre: user.nombre,
    email: user.email || null,
    recibir_recordatorio: shouldRemind,
    password: user.password,
  });

  // Si aún no se ha ejecutado el ALTER TABLE para añadir recibir_recordatorio o email, hacer fallback progresivo
  if (error) {
    const { error: fallbackEmailErr } = await supabase.from('usuarios').insert({
      id: user.id,
      nombre: user.nombre,
      email: user.email || null,
      password: user.password,
    });
    if (fallbackEmailErr) {
      const { error: fallbackBasicErr } = await supabase
        .from('usuarios')
        .insert({
          id: user.id,
          nombre: user.nombre,
          password: user.password,
        });
      if (fallbackBasicErr) throw fallbackBasicErr;
    }
  }
}

export async function updateUserProfileInSupabase(
  userId: string,
  data: { nombre: string; email?: string; recibirRecordatorio?: boolean }
): Promise<void> {
  if (!supabase) return;

  const shouldRemind = Boolean(
    data.email && data.email.trim().length > 0 && data.recibirRecordatorio
  );

  const { error } = await supabase
    .from('usuarios')
    .update({
      nombre: data.nombre,
      email: data.email || null,
      recibir_recordatorio: shouldRemind,
    })
    .eq('id', userId);

  if (error) {
    const { error: fallbackEmailErr } = await supabase
      .from('usuarios')
      .update({
        nombre: data.nombre,
        email: data.email || null,
      })
      .eq('id', userId);

    if (fallbackEmailErr) {
      const { error: fallbackBasicErr } = await supabase
        .from('usuarios')
        .update({
          nombre: data.nombre,
        })
        .eq('id', userId);
      if (fallbackBasicErr) throw fallbackBasicErr;
    }
  }

  // Actualizar también el nombre cacheado en listas_compra de este usuario
  await supabase
    .from('listas_compra')
    .update({ usuario_nombre: data.nombre })
    .eq('usuario_id', userId);
}

export async function updateUserPasswordInSupabase(
  userId: string,
  newPassword: string
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('usuarios')
    .update({ password: newPassword })
    .eq('id', userId);
  if (error) throw error;
}

export async function insertCatalogProductInSupabase(
  nombre: string
): Promise<void> {
  if (!supabase || !nombre.trim()) return;
  const { error } = await supabase
    .from('catalogo_productos')
    .insert({ nombre: nombre.trim() });

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
    usuario_id: list.usuarioId || null,
    usuario_nombre: list.usuarioNombre || null,
  });

  // Si el usuario aún no ejecutó el ALTER TABLE para añadir usuario_id / usuario_nombre, reintentar sin esas columnas
  if (listErr) {
    const { error: fallbackErr } = await supabase.from('listas_compra').insert({
      id: list.id,
      nombre: list.nombre,
      fecha_compra: list.fechaCompra,
      estado: list.estado,
      fecha_finalizacion: list.fechaFinalizacion ?? null,
    });
    if (fallbackErr) throw fallbackErr;
  }

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
  data: {
    nombre: string;
    fechaCompra: string;
    lineas: ShoppingLine[];
    usuarioId?: string;
    usuarioNombre?: string;
  }
): Promise<void> {
  if (!supabase) return;

  const { error: updateErr } = await supabase
    .from('listas_compra')
    .update({
      nombre: data.nombre,
      fecha_compra: data.fechaCompra,
      usuario_id: data.usuarioId || null,
      usuario_nombre: data.usuarioNombre || null,
    })
    .eq('id', listId);

  if (updateErr) {
    const { error: fallbackErr } = await supabase
      .from('listas_compra')
      .update({
        nombre: data.nombre,
        fecha_compra: data.fechaCompra,
      })
      .eq('id', listId);
    if (fallbackErr) throw fallbackErr;
  }

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

/**
 * Verifica que las tablas y vistas REST de Supabase respondan correctamente.
 */
export async function verifySupabaseRestEndpoints(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase no está configurado en las variables de entorno.',
    };
  }
  const { error } = await supabase
    .from('listas_compra')
    .select('id')
    .limit(1);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: 'Conexión con Supabase verificada correctamente.' };
}

/**
 * Genera el código de Google Apps Script para enviar los recordatorios diarios a las 20:00h.
 */
export function generateGoogleAppsScriptCode(): string {
  const url = supabaseUrl || 'https://TU_PROYECTO.supabase.co';
  const key = supabaseAnonKey || 'TU_SUPABASE_ANON_KEY';
  return `const SUPABASE_URL = '${url}';
const SUPABASE_KEY = '${key}';

function enviarRecordatoriosCompra() {
  const url = \`\${SUPABASE_URL}/rest/v1/recordatorios_compra_manana?select=*\`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': \`Bearer \${SUPABASE_KEY}\`,
      'Content-Type': 'application/json'
    }
  });

  const listas = JSON.parse(response.getContentText());

  listas.forEach((item) => {
    const asunto = \`Recordatorio de compra para mañana: \${item.nombre_lista}\`;
    const cuerpoMensaje = \`Estimado \${item.nombre_usuario},\\nte escribo para que te acuerdes de que mañana tienes previsto hacer la siguiente compra:\\n\${item.lineas_texto}\\n\\nUn saludo,\\nLa Compra de la Lista\`;

    MailApp.sendEmail({
      to: item.email_usuario,
      subject: asunto,
      body: cuerpoMensaje,
      name: 'La Compra de la Lista'
    });

    UrlFetchApp.fetch(\`\${SUPABASE_URL}/rest/v1/listas_compra?id=eq.\${item.lista_id}\`, {
      method: 'patch',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': \`Bearer \${SUPABASE_KEY}\`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({ recordatorio_enviado: true })
    });
  });
}`;
}

