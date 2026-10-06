import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { ShoppingList } from '../types';
import {
  formatSpanishDate,
  formatCompletedTimestamp,
  getTodayDateString,
} from '../utils/storage';

interface HistoryScreenProps {
  lists: ShoppingList[];
  onDeleteList: (listId: string) => void;
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  lists,
  onDeleteList,
  onBack,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const today = getTodayDateString();

  // Listas realizadas o cuya fecha de compra ya ha pasado, ordenadas de la más reciente a la más antigua
  const completedLists = lists
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

        <main className="flex-1">
          {completedLists.length > 0 ? (
            <div className="space-y-4">
              {completedLists.map((list) => {
                const isConfirming = confirmDeleteId === list.id;
                const markedCount = list.lineas.filter((l) => l.marcado).length;

                return (
                  <article
                    key={list.id}
                    className="relative rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs"
                  >
                    {/* Encabezado de la tarjeta del histórico */}
                    <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-stone-100 dark:border-stone-800">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate">
                          {list.usuarioNombre ? `${list.usuarioNombre} · ${list.nombre}` : list.nombre}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span>
                            Compra: {formatSpanishDate(list.fechaCompra)}
                          </span>
                          {list.fechaFinalizacion ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                Finalizada:{' '}
                                {formatCompletedTimestamp(
                                  list.fechaFinalizacion
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
                            {markedCount}/{list.lineas.length} comprados
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId((prev) =>
                            prev === list.id ? null : list.id
                          )
                        }
                        aria-label={`Borrar lista ${list.nombre} del histórico`}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 active:scale-[0.98] text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Borrar lista</span>
                      </button>
                    </div>

                    {/* Bocadillo de confirmación en dos pasos para borrar del histórico */}
                    {isConfirming && (
                      <div
                        role="alertdialog"
                        aria-label={`Confirmar borrado de ${list.nombre}`}
                        className="my-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border-2 border-red-500/80 p-4 shadow-md animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                              ¿Borrar «{list.nombre}» del histórico?
                            </h3>
                            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                              Esta lista realizada se eliminará permanentemente.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(null);
                              onDeleteList(list.id);
                            }}
                            className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
                          >
                            Confirmar borrado
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Lista de productos en modo solo lectura indicando cuáles se marcaron */}
                    <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800/60">
                      {list.lineas.map((line) => (
                        <li
                          key={line.id}
                          className="py-2.5 flex items-center justify-between gap-3 text-sm"
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
                );
              })}
            </div>
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
    </div>
  );
};
