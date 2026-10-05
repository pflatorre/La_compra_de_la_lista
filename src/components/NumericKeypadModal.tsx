import React, { useState } from 'react';
import { Delete, KeyRound, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface NumericKeypadModalProps {
  mode: 'create' | 'verify';
  userName?: string;
  expectedPin?: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

const KEYPAD_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const NumericKeypadModal: React.FC<NumericKeypadModalProps> = ({
  mode,
  userName,
  expectedPin,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState('');
  const [currentDigits, setCurrentDigits] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDigitPress = (digit: string) => {
    if (currentDigits.length >= 4) return;
    setErrorMsg(null);

    const next = currentDigits + digit;
    setCurrentDigits(next);

    if (next.length === 4) {
      if (mode === 'create') {
        if (step === 'first') {
          // Pasar a la segunda confirmación tras un breve instante visual
          setTimeout(() => {
            setFirstPin(next);
            setCurrentDigits('');
            setStep('confirm');
          }, 160);
        } else {
          // Confirmando por segunda vez
          setTimeout(() => {
            if (next === firstPin) {
              onSuccess(next);
            } else {
              setErrorMsg(
                'Los 4 números no coinciden. Introduce de nuevo el password desde el principio.'
              );
              setFirstPin('');
              setCurrentDigits('');
              setStep('first');
            }
          }, 160);
        }
      } else {
        // mode === 'verify'
        setTimeout(() => {
          if (next === expectedPin) {
            onSuccess(next);
          } else {
            setErrorMsg('Password incorrecto. Inténtalo de nuevo.');
            setCurrentDigits('');
          }
        }, 160);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setCurrentDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg(null);
    setCurrentDigits('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === 'create'
          ? 'Teclado numérico para crear password'
          : `Introducir password de ${userName ?? 'usuario'}`
      }
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {mode === 'create' ? (
                <KeyRound className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {mode === 'create'
                  ? step === 'first'
                    ? 'Generar password (1/2)'
                    : 'Confirmar password (2/2)'
                  : 'Desbloquear lista'}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                {mode === 'create'
                  ? step === 'first'
                    ? 'Marca 4 números en el teclado (0 al 9)'
                    : 'Repite los mismos 4 números para confirmar'
                  : `Introduce los 4 números de ${userName || 'este usuario'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar teclado numérico"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de 4 dígitos */}
        <div className="my-5 flex items-center justify-center gap-3.5">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < currentDigits.length;
            return (
              <div
                key={idx}
                className={`w-13 h-14 rounded-2xl border-2 flex items-center justify-center font-mono text-2xl font-bold transition-all ${
                  isFilled
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 scale-105'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-400'
                }`}
              >
                {isFilled ? '●' : ''}
              </div>
            );
          })}
        </div>

        {/* Paso de confirmación o mensaje de error */}
        {mode === 'create' && step === 'confirm' && !errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Primer código registrado. Vuelve a introducirlo.</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Teclado numérico del 0 al 9 */}
        <div className="grid grid-cols-3 gap-2.5">
          {KEYPAD_NUMBERS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num)}
              className="min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-900 dark:text-stone-100 font-mono text-xl font-bold flex items-center justify-center transition-all select-none shadow-2xs"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-600 dark:text-stone-300 text-xs font-bold flex items-center justify-center transition-all select-none"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-900 dark:text-stone-100 font-mono text-xl font-bold flex items-center justify-center transition-all select-none shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Borrar último número"
            className="min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-all select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botón cancelar */}
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full min-h-[46px] rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
