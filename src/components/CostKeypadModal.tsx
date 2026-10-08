import React, { useState } from 'react';
import { Delete, CheckCircle2, X, Euro } from 'lucide-react';

interface CostKeypadModalProps {
  title?: string;
  initialCost?: number;
  onSave: (cost: number) => void;
  onCancel: () => void;
}

export const CostKeypadModal: React.FC<CostKeypadModalProps> = ({
  title = '¿Cuánto has gastado en esta compra?',
  initialCost,
  onSave,
  onCancel,
}) => {
  // Inicializamos vacío para que si guarda sin meter ninguna cifra se guarde con 0 €
  const [rawInput, setRawInput] = useState<string>(() => {
    if (typeof initialCost === 'number' && initialCost > 0) {
      return String(initialCost).replace('.', ',');
    }
    return '';
  });

  const handleDigitPress = (digit: string) => {
    setRawInput((prev) => {
      // Si ya hay coma decimal, permitir máximo 2 decimales
      if (prev.includes(',')) {
        const [, decimals = ''] = prev.split(',');
        if (decimals.length >= 2) return prev;
        return prev + digit;
      }
      // Limitar parte entera a 6 dígitos razonables
      if (prev.length >= 6) return prev;
      // Evitar múltiples ceros a la izquierda ("00")
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const handleCommaPress = () => {
    setRawInput((prev) => {
      if (prev.includes(',')) return prev;
      if (prev === '') return '0,';
      return prev + ',';
    });
  };

  const handleBackspace = () => {
    setRawInput((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      onSave(0);
      return;
    }
    const normalized = trimmed.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed < 0) {
      onSave(0);
      return;
    }
    onSave(Math.round(parsed * 100) / 100);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Euro className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar teclado de coste"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visor del importe */}
        <div className="mb-4 rounded-2xl bg-stone-100/90 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-4 py-3.5 text-center">
          <div className="flex items-baseline justify-center gap-1.5 font-mono tabular-nums">
            <span
              className={`text-3xl font-bold tracking-tight ${
                rawInput
                  ? 'text-stone-900 dark:text-stone-50'
                  : 'text-stone-400 dark:text-stone-500'
              }`}
            >
              {rawInput || '0'}
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              €
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Si pulsas Guardar sin meter cifra se guardará con 0 €
          </p>
        </div>

        {/* Teclado numérico (0-9 y coma decimal) */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="min-h-[54px] rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-900 dark:text-stone-100 font-mono text-xl font-bold flex items-center justify-center transition-all select-none shadow-2xs"
            >
              {digit}
            </button>
          ))}

          {/* Coma decimal */}
          <button
            type="button"
            onClick={handleCommaPress}
            aria-label="Coma decimal"
            className="min-h-[54px] rounded-2xl bg-stone-200/70 hover:bg-stone-300/70 dark:bg-stone-800/60 dark:hover:bg-stone-700 active:scale-95 text-stone-900 dark:text-stone-100 font-mono text-2xl font-bold flex items-center justify-center transition-all select-none"
          >
            ,
          </button>

          {/* Dígito 0 */}
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="min-h-[54px] rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-900 dark:text-stone-100 font-mono text-xl font-bold flex items-center justify-center transition-all select-none shadow-2xs"
          >
            0
          </button>

          {/* Borrar último carácter */}
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Borrar último dígito"
            className="min-h-[54px] rounded-2xl bg-stone-200/70 hover:bg-stone-300/70 dark:bg-stone-800/60 dark:hover:bg-stone-700 active:scale-95 text-stone-700 dark:text-stone-300 flex items-center justify-center transition-all select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botones Guardar y Cancelar */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Guardar</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-sm flex items-center justify-center transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
