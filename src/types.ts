export type ShoppingListStatus = 'pendiente' | 'en curso' | 'realizada';

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
}

export type ScreenView =
  | { type: 'home' }
  | { type: 'create' }
  | { type: 'edit'; listId: string }
  | { type: 'shopping'; listId: string }
  | { type: 'history' };
