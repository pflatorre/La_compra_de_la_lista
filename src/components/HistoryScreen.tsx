import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Archive,
  User,
  Lock,
  ChevronRight,
  RotateCcw,
  Search,
  FilterX,
  Pencil,
  Euro,
} from 'lucide-react';
import { AppUser, ShoppingList } from '../types';
import {
  formatSpanishDate,
  formatCompletedTimestamp,
  formatEuros,
  getTodayDateString,
} from '../utils/storage';
import { NumericKeypadModal } from './NumericKeypadModal';
import { CalendarDatePicker } from './CalendarDatePicker';
import { CostKeypadModal } from './CostKeypadModal';

interface HistoryScreenProps {
  lists: ShoppingList[];
  users: AppUser[];
  onReuseList: (list: ShoppingList) => void;
  onUpdateListCost: (listId: string, newCost: number) => void;
  onDeleteList: (listId: string) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  onGoHome: () => void;
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  lists,
  users,
  onReuseList,
  onUpdateListCost,
  onDeleteList,
  onUpdateUserPassword,
  onGoHome,
  onBack,
}) => {
  const [verifyingList, setVerifyingList] = useState<ShoppingList | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingCostList, setEditingCostList] = useState<ShoppingList | null>(
    null
  );

  // Estados de búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const today = getTodayDateString();

  const getCreatorUser = (list: ShoppingList): AppUser | undefined => {
    return (
      (list.usuarioId
        ? users.find((u) => u.id === list.usuarioId)
        : undefined) ??
      (list.usuarioNombre
        ? users.find(
            (u) =>
              u.nombre.toLowerCase() === list.usuarioNombre?.toLowerCase()
          )
        : undefined)
    );
  };

  // Listas realizadas o cuya fecha de compra ya ha pasado, ordenadas de la más reciente a la más antigua
  const completedLists = useMemo(() => {
    return lists
      .filter((l) => l.estado === 'realizada' || l.fechaCompra < today)
      .sort((a, b) => {
        const dateA = a.fechaCompra;
        const dateB = b.fechaCompra;
        if (dateB !== dateA) {
          return dateB.localeCompare(dateA);
        }
        return (b.fechaFinalizacion || '').localeCompare(
          a.fechaFinalizacion || ''
        );
      });
  }, [lists, today]);

  // Opciones de usuarios disponibles para el filtro
  const userFilterOptions = useMemo(() => {
    const namesSet = new Set<string>();
    for (const u of users) {
      if (u.nombre.trim()) namesSet.add(u.nombre.trim());
    }
    for (const l of completedLists) {
      const creator =
        (l.usuarioId ? users.find((u) => u.id === l.usuarioId) : undefined) ??
        undefined;
      const name = (creator?.nombre || l.usuarioNombre || '').trim();
      if (name) namesSet.add(name);
    }
    return Array.from(namesSet).sort((a, b) => a.localeCompare(b, 'es'));
  }, [users, completedLists]);

  // Listas filtradas por búsqueda de usuario/nombre y periodo de fecha de compra (inicio y fin)
  const filteredLists = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return completedLists.filter((list) => {
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

      // 1. Filtro por selector de usuario
      if (
        selectedUserFilter &&
        displayUserName.toLowerCase() !== selectedUserFilter.toLowerCase()
      ) {
        return false;
      }

      // 2. Filtro por campo de texto (busca por nombre de usuario o nombre de la lista)
      if (normalizedQuery) {
        const matchesUser = displayUserName
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesListName = list.nombre
          .toLowerCase()
          .includes(normalizedQuery);
        if (!matchesUser && !matchesListName) {
          return false;
        }
      }

      // 3. Filtro por fecha de inicio (Desde)
      if (startDateFilter && list.fechaCompra < startDateFilter) {
        return false;
      }

      // 4. Filtro por fecha de fin (Hasta)
      if (endDateFilter && list.fechaCompra > endDateFilter) {
        return false;
      }

      return true;
    });
  }, [
    completedLists,
    users,
    searchQuery,
    selectedUserFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedUserFilter ||
      startDateFilter ||
      endDateFilter
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUserFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleCardClick = (list: ShoppingList) => {
    const creator = getCreatorUser(list);
    if (creator) {
      setVerifyingList(list);
    } else {
      setConfirmDelete(false);
      setSelectedListId(list.id);
    }
  };

  // Vista de DETALLE de la lista del histórico (una vez confirmado el password)
  const selectedList = completedLists.find((l) => l.id === selectedListId);

  if (selectedList) {
    const creator = getCreatorUser(selectedList);
    const displayUserName = creator?.nombre || selectedList.usuarioNombre;
    const markedCount = selectedList.lineas.filter((l) => l.marcado).length;

    return (
      <div className="min-h-screen flex flex-col">
        <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-16 flex-1 flex flex-col">
          {/* Cabecera del detalle con botón Volver al listado del histórico y botones Reutilizar lista / Borrar lista */}
          <header className="flex flex-wrap items-center justify-between gap-2.5 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setSelectedListId(null);
                }}
                aria-label="Volver al histórico"
                className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-semibold text-sm inline-flex items-center gap-2 shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>

              <h1
                className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Detalle de la lista
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onReuseList(selectedList)}
                aria-label={`Reutilizar lista ${selectedList.nombre}`}
                className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reutilizar lista</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDelete((prev) => !prev)}
                aria-label={`Borrar lista ${selectedList.nombre} del histórico`}
                className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 active:scale-[0.98] text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/60 text-sm font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar lista</span>
              </button>
            </div>
          </header>

          <main className="flex-1">
            {/* Confirmación de borrado */}
            {confirmDelete && (
              <div
                role="alertdialog"
                aria-label={`Confirmar borrado de ${selectedList.nombre}`}
                className="mb-4 rounded-2xl bg-white dark:bg-stone-900 border-2 border-red-500/80 p-4 shadow-md animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      ¿Borrar «{selectedList.nombre}» del histórico?
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                      Esta lista se eliminará permanentemente del histórico.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const idToRemove = selectedList.id;
                      setConfirmDelete(false);
                      setSelectedListId(null);
                      onDeleteList(idToRemove);
                    }}
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
                  >
                    Confirmar borrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Tarjeta con el detalle completo y las líneas del pedido */}
            <article className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs">
              <div className="pb-4 border-b border-stone-100 dark:border-stone-800">
                {displayUserName && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{displayUserName}</span>
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {selectedList.nombre}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  <span>
                    Compra: {formatSpanishDate(selectedList.fechaCompra)}
                  </span>
                  {selectedList.fechaFinalizacion ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        Finalizada:{' '}
                        {formatCompletedTimestamp(
                          selectedList.fechaFinalizacion
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        Fecha pasada
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {markedCount}/{selectedList.lineas.length} comprados
                  </span>
                </div>

                {/* Bloque de Coste de la compra con botón para editarlo */}
                <div className="mt-3.5 pt-3.5 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Euro className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        Coste de la compra
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {formatEuros(selectedList.costeCompra)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={markedCount === 0}
                    onClick={() => {
                      if (markedCount > 0) {
                        setEditingCostList(selectedList);
                      }
                    }}
                    title={
                      markedCount === 0
                        ? 'No se puede editar el coste porque hay 0 productos comprados'
                        : 'Editar coste de la compra'
                    }
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      markedCount === 0
                        ? 'bg-stone-100/70 dark:bg-stone-800/40 text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-60'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <Pencil
                      className={`w-3.5 h-3.5 ${
                        markedCount === 0
                          ? 'text-stone-400 dark:text-stone-600'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    />
                    <span>Editar coste</span>
                  </button>
                </div>
              </div>

              {/* Líneas del pedido */}
              <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800/60">
                {selectedList.lineas.map((line) => (
                  <li
                    key={line.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {line.marcado ? (
                        <span
                          title="Producto marcado como comprado"
                          className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span
                          title="Producto no marcado"
                          className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </span>
                      )}
                      <span
                        className={`font-medium truncate ${
                          line.marcado
                            ? 'text-stone-800 dark:text-stone-200'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {line.nombreProducto}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">
                        {line.marcado ? '(comprado)' : '(sin marcar)'}
                      </span>
                    </div>

                    <span className="font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300 shrink-0">
                      × {line.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </main>
        </div>

        {/* Teclado numérico para editar el coste de la compra en el histórico */}
        {editingCostList && (
          <CostKeypadModal
            title="¿Cuánto has gastado en esta compra?"
            initialCost={editingCostList.costeCompra}
            onSave={(newCost) => {
              onUpdateListCost(editingCostList.id, newCost);
              setEditingCostList(null);
            }}
            onCancel={() => setEditingCostList(null)}
          />
        )}
      </div>
    );
  }

  // Vista PRINCIPAL del Histórico (con buscador por usuario y periodo de fecha de compra)
  const verifyingCreator = verifyingList
    ? getCreatorUser(verifyingList)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-16 flex-1 flex flex-col">
        {/* Cabecera con botón Volver a inicio */}
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

          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Histórico de compras
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-5">
          {completedLists.length > 0 && (
            /* Panel de búsqueda por usuario y periodo de fechas (inicio y fin) */
            <section
              aria-label="Filtrar histórico de compras"
              className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Buscar en el histórico</span>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 inline-flex items-center gap-1.5 transition-all"
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    <span>Limpiar filtros</span>
                  </button>
                )}
              </div>

              {/* Fila 1: Búsqueda por texto y Selector de usuario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="history-search-input"
                    className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1"
                  >
                    Buscar por usuario o lista
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="history-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ej. Ana, Mercadona..."
                      className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="history-user-select"
                    className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1"
                  >
                    Filtrar por usuario
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="history-user-select"
                      value={selectedUserFilter}
                      onChange={(e) => setSelectedUserFilter(e.target.value)}
                      className="w-full min-h-[48px] pl-10 pr-8 py-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
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
              </div>

              {/* Fila 2: Periodo de fecha de compra (Fecha inicio y Fecha fin) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Fecha de compra desde (inicio)
                  </label>
                  <CalendarDatePicker
                    value={startDateFilter}
                    onChange={setStartDateFilter}
                    placeholder="Fecha inicio..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Fecha de compra hasta (fin)
                  </label>
                  <CalendarDatePicker
                    value={endDateFilter}
                    onChange={setEndDateFilter}
                    placeholder="Fecha fin..."
                  />
                </div>
              </div>
            </section>
          )}

          {completedLists.length > 0 ? (
            filteredLists.length > 0 ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    {hasActiveFilters
                      ? `Mostrando ${filteredLists.length} de ${completedLists.length} listas`
                      : `Listas archivadas (${completedLists.length})`}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    Toca una lista para ver el detalle
                  </span>
                </div>

                {filteredLists.map((list) => {
                  const creator = getCreatorUser(list);
                  const displayUserName = creator?.nombre || list.usuarioNombre;
                  const markedCount = list.lineas.filter((l) => l.marcado).length;

                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => handleCardClick(list)}
                      className="w-full text-left rounded-2xl p-4 sm:p-5 bg-white dark:bg-stone-900 hover:bg-stone-100/70 dark:hover:bg-stone-800/60 active:scale-[0.99] border border-stone-200/90 dark:border-stone-800 shadow-xs flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {displayUserName && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 text-xs font-bold shrink-0">
                              <User className="w-3.5 h-3.5" />
                              <span>{displayUserName}</span>
                            </span>
                          )}
                          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate">
                            {list.nombre}
                          </h2>
                          {creator && (
                            <Lock
                              aria-label="Protegida con password"
                              className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0"
                            />
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span>
                            Compra: {formatSpanishDate(list.fechaCompra)}
                          </span>
                          {list.fechaFinalizacion ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                Finalizada:{' '}
                                {formatCompletedTimestamp(list.fechaFinalizacion)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 dark:text-amber-400 font-medium">
                                Fecha pasada
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {markedCount}/{list.lineas.length} comprados
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                            Coste: {formatEuros(list.costeCompra)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Sin resultados para el filtro */
              <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 p-8 text-center">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  No hay listas que coincidan con la búsqueda
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Prueba a cambiar el usuario o ampliar el rango entre la fecha de inicio y fin.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                >
                  <FilterX className="w-4 h-4" />
                  <span>Mostrar todas las listas</span>
                </button>
              </div>
            )
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 p-8 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center mx-auto mb-4">
                <Archive className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Aún no hay compras en el histórico
              </h2>
              <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                Cuando finalices una compra desde el modo supermercado, aparecerá archivada aquí para que puedas consultarla cuando quieras.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Teclado numérico al hacer clic sobre una lista del histórico */}
      {verifyingList && verifyingCreator && (
        <NumericKeypadModal
          mode="verify"
          userName={verifyingCreator.nombre}
          expectedPin={verifyingCreator.password}
          onChangePassword={(newPin) =>
            onUpdateUserPassword(verifyingCreator.id, newPin)
          }
          onPasswordChangeComplete={() => {
            setVerifyingList(null);
            onGoHome();
          }}
          onSuccess={() => {
            const unlockedId = verifyingList.id;
            setVerifyingList(null);
            setConfirmDelete(false);
            setSelectedListId(unlockedId);
          }}
          onCancel={() => setVerifyingList(null)}
        />
      )}
    </div>
  );
};
