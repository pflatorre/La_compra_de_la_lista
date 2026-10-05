export type ShoppingListStatus = 'pendiente' | 'en curso' | 'realizada';

export interface AppUser {
  id: string;
  nombre: string;
  password: string; // 4 dígitos numéricos (0-9)
}

export interface ShoppingLine {
  id: string;
  nombreProducto: string;
  cantidad: number;
  marcado: boolean;
  guardada: boolean;
}

export interface ShoppingList {
  id: string;
  nombre: string;
  fechaCompra: string; // YYYY-MM-DD
  estado: ShoppingListStatus;
  lineas: ShoppingLine[];
  fechaFinalizacion?: string; // ISO string when estado === 'realizada'
  usuarioId?: string;
  usuarioNombre?: string;
}

export type ScreenView =
  | { type: 'home' }
  | { type: 'create' }
  | { type: 'edit'; listId: string }
  | { type: 'shopping'; listId: string }
  | { type: 'history' };
