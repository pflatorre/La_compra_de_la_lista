import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { ShoppingList } from '../types';
import { formatSpanishDate } from '../utils/storage';
import { CostKeypadModal } from './CostKeypadModal';

interface ShoppingModeScreenProps {
  list: ShoppingList;
  onToggleLineCheck: (listId: string, lineId: string) => void;
  onFinishShopping: (listId: string, costeCompra: number) => void;
  onExitShopping: (listId: string) => void;
}

export const ShoppingModeScreen: React.FC<ShoppingModeScreenProps> = ({
  list,
  onToggleLineCheck,
  onFinishShopping,
  onExitShopping,
}) => {
  const [showUncheckedConfirm, setShowUncheckedConfirm] = useState(false);
  const [showCostKeypad, setShowCostKeypad] = useState(false);

  const totalProducts = list.lineas.length;
  const checkedProducts = list.lineas.filter((l) => l.marcado).length;
  const uncheckedProducts = totalProducts - checkedProducts;
  const progressPercent =
    totalProducts > 0 ? Math.round((checkedProducts / totalProducts) * 100) : 0;

  const handleFinishClick = () => {
    if (uncheckedProducts > 0) {
      setShowUncheckedConfirm(true);
    } else {
      setShowCostKeypad(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-28 flex-1 flex flex-col">
        {/* Navegación superior con botón Volver */}
        <header className="flex items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={() => onExitShopping(list.id)}
            aria-label="Volver a inicio guardando progreso"
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-semibold text-sm inline-flex items-center gap-2 shadow-xs transition-all whitespace-nowrap"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Modo compra
          </span>
        </header>

        {/* Resumen de la lista y progreso */}
        <section className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs mb-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1
              className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {list.nombre}
            </h1>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {formatSpanishDate(list.fechaCompra)}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm font-semibold mb-2">
              <span className="text-stone-800 dark:text-stone-200 font-mono tabular-nums">
                {checkedProducts} de {totalProducts} productos
              </span>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-200 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Líneas de productos para marcar en el supermercado */}
        <main className="flex-1 space-y-2.5 mb-8">
          {list.lineas.map((line) => {
            const isChecked = line.marcado;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => onToggleLineCheck(list.id, line.id)}
                aria-pressed={isChecked}
                className={`w-full min-h-[68px] p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all duration-150 active:scale-[0.99] select-none ${
                  isChecked
                    ? 'bg-stone-100/70 dark:bg-stone-900/40 border-stone-200/70 dark:border-stone-800/70'
                    : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 shadow-xs hover:border-emerald-500/60'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Check grande y fácil de pulsar */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-950 text-transparent'
                    }`}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>

                  {/* Nombre del producto (tachado y atenuado si está marcado) */}
                  <span
                    className={`text-lg font-semibold truncate transition-all ${
                      isChecked
                        ? 'line-through opacity-50 text-stone-500 dark:text-stone-400'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {line.nombreProducto}
                  </span>
                </div>

                {/* Cantidad del producto */}
                <div
                  className={`shrink-0 font-mono tabular-nums text-base font-bold px-3 py-1.5 rounded-xl transition-opacity ${
                    isChecked
                      ? 'line-through opacity-45 text-stone-500 dark:text-stone-500 bg-stone-200/50 dark:bg-stone-800/40'
                      : 'text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800'
                  }`}
                >
                  × {line.cantidad}
                </div>
              </button>
            );
          })}
        </main>

        {/* Confirmación sencilla si quedan productos sin marcar */}
        {showUncheckedConfirm && (
          <div
            role="alertdialog"
            aria-label="Confirmar finalización con productos pendientes"
            className="mb-4 rounded-2xl bg-white dark:bg-stone-900 border-2 border-amber-500/80 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Quedan {uncheckedProducts}{' '}
                  {uncheckedProducts === 1
                    ? 'producto sin marcar'
                    : 'productos sin marcar'}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                  ¿Seguro que quieres finalizar la compra y mover la lista al histórico?
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUncheckedConfirm(false);
                  if (checkedProducts === 0) {
                    onFinishShopping(list.id, 0);
                  } else {
                    setShowCostKeypad(true);
                  }
                }}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
              >
                Confirmar y finalizar
              </button>
              <button
                type="button"
                onClick={() => setShowUncheckedConfirm(false)}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}

        {/* Botones de acción en modo compra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleFinishClick}
            className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 transition-all whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5] shrink-0" />
            <span>Finalizar compra</span>
          </button>

          <button
            type="button"
            onClick={() => onExitShopping(list.id)}
            className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 font-bold text-base flex items-center justify-center gap-2.5 shadow-xs transition-all whitespace-nowrap"
          >
            <LogOut className="w-5 h-5 shrink-0 text-stone-600 dark:text-stone-400" />
            <span>Salir de la compra</span>
          </button>
        </div>
      </div>

      {/* Teclado numérico para introducir cuánto has gastado al finalizar la compra */}
      {showCostKeypad && (
        <CostKeypadModal
          title="¿Cuánto has gastado en esta compra?"
          onSave={(cost) => {
            setShowCostKeypad(false);
            onFinishShopping(list.id, cost);
          }}
          onCancel={() => setShowCostKeypad(false)}
        />
      )}
    </div>
  );
};
