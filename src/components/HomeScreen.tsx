import React from 'react';
import { Plus, History, Sun, Moon, ShoppingBasket, ShoppingCart } from 'lucide-react';
import { AppUser, ShoppingList } from '../types';
import { ThemeMode } from '../utils/storage';
import { ListCard } from './ListCard';

interface HomeScreenProps {
  lists: ShoppingList[];
  users: AppUser[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNewList: () => void;
  onOpenHistory: () => void;
  onStartShopping: (listId: string) => void;
  onEditList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lists,
  users,
  theme,
  onToggleTheme,
  onNewList,
  onOpenHistory,
  onStartShopping,
  onEditList,
  onDeleteList,
  onUpdateUserPassword,
}) => {
  // Listas NO realizadas (pendientes y en curso), ordenadas por fecha de compra de la más próxima a la más lejana
  const activeLists = lists
    .filter((list) => list.estado !== 'realizada')
    .sort((a, b) => a.fechaCompra.localeCompare(b.fechaCompra));

  const completedCount = lists.filter((list) => list.estado === 'realizada').length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-16 flex-1 flex flex-col">
        {/* 1. Título de la aplicación con logotipo de carro de la compra */}
        <header className="mb-5 flex items-center gap-3.5">
          <div
            aria-hidden="true"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-900/15 shrink-0"
          >
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.25]" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50"
              style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
            >
              La Compra de la Lista
            </h1>
            <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
              Crea y gestiona tus listas de la compra...{' '}
              <em className="italic">by PabloFL</em>
            </p>
          </div>
        </header>

        {/* 2. Barra de botones entre el título y las listas */}
        <nav
          aria-label="Acciones principales"
          className="flex items-center gap-2.5 mb-7"
        >
          <button
            type="button"
            onClick={onNewList}
            className="flex-1 min-h-[52px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
            <span>Nueva lista</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="min-h-[52px] px-4 py-3 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 font-semibold text-base flex items-center justify-center gap-2 shadow-xs transition-all whitespace-nowrap"
          >
            <History className="w-5 h-5 text-stone-600 dark:text-stone-400 shrink-0" />
            <span>Histórico</span>
            {completedCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
                ({completedCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            }
            title={
              theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            }
            className="min-h-[52px] min-w-[52px] rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 flex items-center justify-center shadow-xs transition-all shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-stone-700" />
            )}
          </button>
        </nav>

        {/* 3. Listas de la compra pendientes y en curso */}
        <main className="flex-1">
          {activeLists.length > 0 ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Próximas compras ({activeLists.length})
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  Toca una lista para ver opciones
                </span>
              </div>

              {activeLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  users={users}
                  onStartShopping={onStartShopping}
                  onEditList={onEditList}
                  onDeleteList={onDeleteList}
                  onUpdateUserPassword={onUpdateUserPassword}
                />
              ))}
            </div>
          ) : (
            /* Estado vacío amigable */
            <div className="mt-4 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 p-8 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <ShoppingBasket className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                No tienes listas de la compra pendientes
              </h2>
              <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                ¡Empieza creando tu primera lista! Añade los productos que necesitas, elige qué día irás al súper y llévala contigo en el móvil.
              </p>
              <button
                type="button"
                onClick={onNewList}
                className="mt-6 min-h-[48px] px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Crear mi primera lista</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
