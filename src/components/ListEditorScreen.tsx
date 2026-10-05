import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { ShoppingLine, ShoppingList } from '../types';
import { generateId, getTodayDateString } from '../utils/storage';
import { CalendarDatePicker } from './CalendarDatePicker';
import { ProductLineItem } from './ProductLineItem';

interface ListEditorScreenProps {
  initialList?: ShoppingList;
  catalog: string[];
  onAddCatalogProduct: (productName: string) => void;
  onSaveList: (data: {
    nombre: string;
    fechaCompra: string;
    lineas: ShoppingLine[];
  }) => void;
  onBack: () => void;
}

function createBlankLine(): ShoppingLine {
  return {
    id: generateId(),
    nombreProducto: '',
    cantidad: 1,
    marcado: false,
    guardada: false,
  };
}

export const ListEditorScreen: React.FC<ListEditorScreenProps> = ({
  initialList,
  catalog,
  onAddCatalogProduct,
  onSaveList,
  onBack,
}) => {
  const isEditing = Boolean(initialList);

  const [nombre, setNombre] = useState(initialList?.nombre ?? '');
  const [fechaCompra, setFechaCompra] = useState(
    initialList?.fechaCompra ?? getTodayDateString()
  );

  // Al editar una lista existente, cargamos sus líneas guardadas y añadimos una línea en blanco al final para poder añadir más
  const [lineas, setLineas] = useState<ShoppingLine[]>(() => {
    if (initialList && initialList.lineas.length > 0) {
      const savedLines = initialList.lineas.map((l) => ({
        ...l,
        guardada: true,
      }));
      return [...savedLines, createBlankLine()];
    }
    return [createBlankLine()];
  });

  const [focusLineId, setFocusLineId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleUpdateLine = (id: string, changes: Partial<ShoppingLine>) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...changes } : l))
    );
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSaveLine = (id: string) => {
    const targetLine = lineas.find((l) => l.id === id);
    if (!targetLine || !targetLine.nombreProducto.trim()) return;

    const cleanName = targetLine.nombreProducto.trim();
    onAddCatalogProduct(cleanName);

    setLineas((prev) => {
      const updated = prev.map((l) =>
        l.id === id
          ? {
              ...l,
              nombreProducto: cleanName,
              cantidad: Math.max(1, Math.floor(l.cantidad)),
              guardada: true,
            }
          : l
      );

      // Si no hay ninguna línea en blanco al final, generamos automáticamente una nueva línea en blanco debajo con foco en ella
      const lastLine = updated[updated.length - 1];
      if (lastLine && (lastLine.guardada || lastLine.nombreProducto.trim() !== '')) {
        const newLine = createBlankLine();
        setFocusLineId(newLine.id);
        return [...updated, newLine];
      } else if (lastLine && !lastLine.guardada) {
        setFocusLineId(lastLine.id);
      }

      return updated;
    });

    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleEditLine = (id: string) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, guardada: false } : l))
    );
    setFocusLineId(id);
  };

  const handleDeleteLine = (id: string) => {
    setLineas((prev) => {
      const filtered = prev.filter((l) => l.id !== id);
      if (filtered.length === 0) {
        const blank = createBlankLine();
        setFocusLineId(blank.id);
        return [blank];
      }
      // Asegurar que siempre quede al menos una línea editable o en blanco al final para poder añadir más
      const hasBlankAtEnd =
        !filtered[filtered.length - 1].guardada &&
        filtered[filtered.length - 1].nombreProducto.trim() === '';
      if (!hasBlankAtEnd && filtered.every((l) => l.guardada)) {
        const blank = createBlankLine();
        return [...filtered, blank];
      }
      return filtered;
    });
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    const trimmedName = nombre.trim();
    if (!trimmedName) {
      errors.push('Indica un nombre para la lista de la compra.');
    }

    if (!fechaCompra.trim()) {
      errors.push('Selecciona la fecha en la que harás la compra.');
    }

    // Ignorar líneas en blanco vacías
    const nonBlankLines = lineas.filter(
      (l) => l.nombreProducto.trim().length > 0
    );

    if (nonBlankLines.length === 0) {
      errors.push('Añade al menos un producto a la lista antes de finalizar.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Aseguramos que todos los productos con nombre se añadan al catálogo y queden marcados como guardados
    const finalLines: ShoppingLine[] = nonBlankLines.map((l) => {
      const cleanProduct = l.nombreProducto.trim();
      onAddCatalogProduct(cleanProduct);
      return {
        ...l,
        nombreProducto: cleanProduct,
        cantidad: Math.max(1, Math.floor(l.cantidad)),
        guardada: true,
      };
    });

    onSaveList({
      nombre: trimmedName,
      fechaCompra: fechaCompra.trim(),
      lineas: finalLines,
    });
  };

  const savedProductsCount = lineas.filter(
    (l) => l.guardada && l.nombreProducto.trim().length > 0
  ).length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-28 flex-1 flex flex-col">
        {/* Cabecera con botón Volver */}
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

          <h1
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isEditing ? 'Editar lista' : 'Crear lista'}
          </h1>
        </header>

        <form onSubmit={handleFinalize} noValidate className="space-y-6 flex-1">
          {/* Datos principales de la lista */}
          <section className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
            {/* 1. Campo de texto para el nombre de la lista */}
            <div>
              <label
                htmlFor="list-name-input"
                className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1.5"
              >
                Nombre de la lista
              </label>
              <input
                id="list-name-input"
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
                placeholder="Ej. Compra semanal Mercadona, Barbacoa domingo..."
                className={`w-full min-h-[52px] px-4 py-3 rounded-2xl text-base font-medium border transition-colors ${
                  validationErrors.some((err) => err.includes('nombre'))
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-stone-900 dark:text-stone-100'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                }`}
              />
            </div>

            {/* 2. Selector de fecha con desplegable de calendario */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
                Fecha de la compra
              </label>
              <CalendarDatePicker
                value={fechaCompra}
                onChange={(newDate) => {
                  setFechaCompra(newDate);
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
                hasError={validationErrors.some((err) => err.includes('fecha'))}
              />
            </div>
          </section>

          {/* 3. Líneas de productos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Productos de la lista
              </h2>
              <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
                {savedProductsCount}{' '}
                {savedProductsCount === 1 ? 'guardado' : 'guardados'}
              </span>
            </div>

            <div className="space-y-3">
              {lineas.map((line, index) => (
                <ProductLineItem
                  key={line.id}
                  line={line}
                  index={index}
                  catalog={catalog}
                  autoFocusInput={focusLineId === line.id}
                  canDelete={lineas.length > 1 || line.guardada}
                  onUpdateLine={handleUpdateLine}
                  onSaveLine={handleSaveLine}
                  onEditLine={handleEditLine}
                  onDeleteLine={handleDeleteLine}
                />
              ))}
            </div>
          </section>

          {/* Mensajes de validación claros */}
          {validationErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 p-4 text-red-800 dark:text-red-200 animate-in fade-in duration-150"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-bold">
                    Revisa los siguientes datos antes de finalizar:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 6. En la parte inferior, botón "Finalizar" */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[56px] px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Finalizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
