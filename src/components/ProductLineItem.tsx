import React, { useState, useRef, useEffect } from 'react';
import { Check, Pencil, Trash2, Plus, Minus } from 'lucide-react';
import { ShoppingLine } from '../types';
import { getCatalogSuggestions } from '../utils/storage';

interface ProductLineItemProps {
  line: ShoppingLine;
  index: number;
  catalog: string[];
  autoFocusInput?: boolean;
  canDelete: boolean;
  onUpdateLine: (id: string, changes: Partial<ShoppingLine>) => void;
  onSaveLine: (id: string) => void;
  onEditLine: (id: string) => void;
  onDeleteLine: (id: string) => void;
}

export const ProductLineItem: React.FC<ProductLineItemProps> = ({
  line,
  index,
  catalog,
  autoFocusInput,
  canDelete,
  onUpdateLine,
  onSaveLine,
  onEditLine,
  onDeleteLine,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lineError, setLineError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocusInput && !line.guardada && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusInput, line.guardada]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = !line.guardada
    ? getCatalogSuggestions(catalog, line.nombreProducto)
    : [];

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (lineError && val.trim().length > 0) {
      setLineError(false);
    }
    onUpdateLine(line.id, { nombreProducto: val });
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onUpdateLine(line.id, { nombreProducto: suggestion });
    setLineError(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleDecrement = () => {
    if (line.guardada) return;
    const nextQty = Math.max(1, Math.floor(line.cantidad) - 1);
    onUpdateLine(line.id, { cantidad: nextQty });
  };

  const handleIncrement = () => {
    if (line.guardada) return;
    const nextQty = Math.max(1, Math.floor(line.cantidad) + 1);
    onUpdateLine(line.id, { cantidad: nextQty });
  };

  const handleSaveClick = () => {
    if (line.guardada) return;
    if (!line.nombreProducto.trim()) {
      setLineError(true);
      inputRef.current?.focus();
      return;
    }
    setLineError(false);
    setShowSuggestions(false);
    onSaveLine(line.id);
  };

  const handleEditClick = () => {
    if (!line.guardada) return;
    onEditLine(line.id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`rounded-2xl border p-3.5 sm:p-4 transition-colors ${
        line.guardada
          ? 'bg-stone-100/80 dark:bg-stone-900/50 border-stone-200/80 dark:border-stone-800'
          : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 shadow-xs'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Fila superior: Campo de producto con autocompletado y botón eliminar */}
        <div className="relative flex items-center gap-2">
          <span className="text-xs font-mono tabular-nums font-semibold text-stone-400 dark:text-stone-500 w-5 shrink-0 text-right">
            {index + 1}.
          </span>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={line.nombreProducto}
              disabled={line.guardada}
              onChange={handleProductChange}
              onFocus={() => {
                if (!line.guardada && line.nombreProducto.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ej. Leche entera, Pan de molde, Huevos..."
              aria-label={`Nombre del producto de la línea ${index + 1}`}
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors ${
                line.guardada
                  ? 'bg-transparent text-stone-800 dark:text-stone-200 cursor-default border border-transparent font-semibold'
                  : lineError
                  ? 'bg-red-50/40 dark:bg-red-950/20 border border-red-500 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-red-500/30'
                  : 'bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
              }`}
            />

            {/* Desplegable de sugerencias de autocompletado */}
            {showSuggestions && !line.guardada && suggestions.length > 0 && (
              <ul
                role="listbox"
                aria-label="Sugerencias del catálogo de productos"
                className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-52 overflow-y-auto rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-lg divide-y divide-stone-100 dark:divide-stone-800"
              >
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        // Evita que el input pierda foco antes de rellenar
                        e.preventDefault();
                        handleSelectSuggestion(suggestion);
                      }}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                    >
                      <span>{suggestion}</span>
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        Catálogo
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDeleteLine(line.id)}
              aria-label={`Eliminar línea ${index + 1}`}
              title="Eliminar línea"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {lineError && !line.guardada && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400 pl-7">
            Escribe el nombre del producto antes de guardar la línea.
          </p>
        )}

        {/* Fila inferior: Control de cantidad (− / +) y Botones Guardar línea / Editar línea */}
        <div className="flex flex-wrap items-center justify-between gap-2 pl-7">
          {/* Selector de cantidad */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200/70 dark:border-stone-700/70">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={line.guardada || line.cantidad <= 1}
              aria-label="Disminuir cantidad"
              className="min-h-[42px] min-w-[42px] rounded-lg flex items-center justify-center text-xl font-bold text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors select-none leading-none"
            >
              −
            </button>

            <span
              aria-label="Cantidad"
              className="min-w-[40px] text-center font-mono tabular-nums text-base font-semibold text-stone-900 dark:text-stone-100 px-2"
            >
              {line.cantidad}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={line.guardada}
              aria-label="Aumentar cantidad"
              className="min-h-[42px] min-w-[42px] rounded-lg flex items-center justify-center text-xl font-bold text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors select-none leading-none"
            >
              +
            </button>
          </div>

          {/* Botones de acción de línea */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={line.guardada}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                line.guardada
                  ? 'bg-stone-200/70 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar línea</span>
            </button>

            <button
              type="button"
              onClick={handleEditClick}
              disabled={!line.guardada}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                !line.guardada
                  ? 'bg-stone-200/70 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                  : 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>Editar línea</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
