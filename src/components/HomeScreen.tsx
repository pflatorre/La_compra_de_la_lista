import React, { useState, useMemo } from 'react';
import {
  Plus,
  History,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  User,
  FilterX,
} from 'lucide-react';
import { AppUser, ShoppingList } from '../types';
import { getTodayDateString } from '../utils/storage';
import { ListCard } from './ListCard';

interface HomeScreenProps {
  lists: ShoppingList[];
  users: AppUser[];
  onOpenSettings: () => void;
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
  onOpenSettings,
  onNewList,
  onOpenHistory,
  onStartShopping,
  onEditList,
  onDeleteList,
  onUpdateUserPassword,
}) => {
  const [selectedUserFilter, setSelectedUserFilter] = useState('');
  const today = getTodayDateString();

  // Listas vigentes (no realizadas y con fecha igual o posterior a hoy),
  // ordenadas poniendo arriba las más cercanas a la fecha actual (las compras que deben efectuarse más pronto)
  const activeLists = useMemo(() => {
    return lists
      .filter((list) => list.estado !== 'realizada' && list.fechaCompra >= today)
      .sort((a, b) => a.fechaCompra.localeCompare(b.fechaCompra));
  }, [lists, today]);

  // Opciones de usuarios disponibles para filtrar en la pantalla inicial
  const userFilterOptions = useMemo(() => {
    const namesSet = new Set<string>();
    for (const u of users) {
      if (u.nombre.trim()) namesSet.add(u.nombre.trim());
    }
    for (const l of activeLists) {
      const creator = l.usuarioId
        ? users.find((u) => u.id === l.usuarioId)
        : undefined;
      const name = (creator?.nombre || l.usuarioNombre || '').trim();
      if (name) namesSet.add(name);
    }
    return Array.from(namesSet).sort((a, b) => a.localeCompare(b, 'es'));
  }, [users, activeLists]);

  // Listas vigentes filtradas por el usuario seleccionado
  const filteredActiveLists = useMemo(() => {
    if (!selectedUserFilter) return activeLists;
    return activeLists.filter((list) => {
      const creator =
        (list.usuarioId
          ? users.find((u) => u.id === list.usuarioId)
          : undefined) ??
        (list.usuarioNombre
          ? users.find(
              (u) =>
                u.nombre.toLowerCase() === list.usuarioNombre?.toLowerCase()
            )
          : undefined);
      const displayUserName = (
        creator?.nombre ||
        list.usuarioNombre ||
        ''
      ).trim();
      return (
        displayUserName.toLowerCase() === selectedUserFilter.toLowerCase()
      );
    });
  }, [activeLists, users, selectedUserFilter]);

  const completedCount = lists.filter(
    (list) => list.estado === 'realizada' || list.fechaCompra < today
  ).length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-16 flex-1 flex flex-col">
        {/* 1. Título de la aplicación con logotipo de carro de la compra y botón Configuración arriba a la derecha */}
        <header className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                aria-hidden="true"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-900/15 shrink-0"
              >
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.25]" />
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50"
                style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
              >
                La Compra de la Lista
              </h1>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Configuración"
              title="Configuración"
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 flex items-center justify-center shadow-xs transition-all shrink-0"
            >
              <Settings className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            </button>
          </div>

          <p className="mt-2.5 text-sm text-stone-600 dark:text-stone-400">
            Crea y gestiona tus listas de la compra...{' '}
            <em className="italic">by PabloFL</em>
          </p>
        </header>

        {/* 2. Barra de botones entre el título y las listas (solo Nueva lista e Histórico) */}
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
            className="flex-1 min-h-[52px] px-4 py-3 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 font-semibold text-base flex items-center justify-center gap-2 shadow-xs transition-all whitespace-nowrap"
          >
            <History className="w-5 h-5 text-stone-600 dark:text-stone-400 shrink-0" />
            <span>Histórico</span>
            {completedCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
                ({completedCount})
              </span>
            )}
          </button>
        </nav>

        {/* 3. Listas de la compra pendientes y en curso */}
        <main className="flex-1">
          {activeLists.length > 0 ? (
            <div className="space-y-3.5">
              {/* Filtro únicamente por usuario para las próximas compras */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 shadow-xs">
                <label
                  htmlFor="home-user-filter-select"
                  className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5"
                >
                  Filtrar por usuario
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="home-user-filter-select"
                    value={selectedUserFilter}
                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                    className="w-full min-h-[46px] pl-10 pr-8 py-2 rounded-xl bg-stone-50/70 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  >
                    <option value="">Todos los usuarios</option>
                    {userFilterOptions.map((uName) => (
                      <option key={uName} value={uName}>
                        {uName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  {selectedUserFilter
                    ? `Próximas compras de ${selectedUserFilter} (${filteredActiveLists.length})`
                    : `Próximas compras (${activeLists.length})`}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  Toca una lista para ver opciones
                </span>
              </div>

              {filteredActiveLists.length > 0 ? (
                filteredActiveLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    users={users}
                    onStartShopping={onStartShopping}
                    onEditList={onEditList}
                    onDeleteList={onDeleteList}
                    onUpdateUserPassword={onUpdateUserPassword}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 p-7 text-center">
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    No hay compras pendientes para «{selectedUserFilter}»
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedUserFilter('')}
                    className="mt-3 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    <span>Ver todos los usuarios</span>
                  </button>
                </div>
              )}
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
