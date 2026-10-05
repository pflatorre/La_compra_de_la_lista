import React, { useState, useEffect } from 'react';
import {
  Delete,
  KeyRound,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface NumericKeypadModalProps {
  mode: 'create' | 'verify';
  userName?: string;
  expectedPin?: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
  onChangePassword?: (newPin: string) => void;
  onPasswordChangeComplete?: () => void;
}

const KEYPAD_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

type KeypadStage =
  | 'createFirst'
  | 'createConfirm'
  | 'verifyUnlock'
  | 'changeVerifyCurrent'
  | 'changeNewFirst'
  | 'changeNewConfirm'
  | 'changeSuccess';

export const NumericKeypadModal: React.FC<NumericKeypadModalProps> = ({
  mode,
  userName,
  expectedPin,
  onSuccess,
  onCancel,
  onChangePassword,
  onPasswordChangeComplete,
}) => {
  const [stage, setStage] = useState<KeypadStage>(() =>
    mode === 'create' ? 'createFirst' : 'verifyUnlock'
  );
  const [activeExpectedPin, setActiveExpectedPin] = useState(expectedPin ?? '');
  const [firstPin, setFirstPin] = useState('');
  const [currentDigits, setCurrentDigits] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (expectedPin !== undefined) {
      setActiveExpectedPin(expectedPin);
    }
  }, [expectedPin]);

  const handleDigitPress = (digit: string) => {
    if (currentDigits.length >= 4 || stage === 'changeSuccess') return;
    setErrorMsg(null);

    const next = currentDigits + digit;
    setCurrentDigits(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (stage === 'createFirst') {
          setFirstPin(next);
          setCurrentDigits('');
          setStage('createConfirm');
          return;
        }

        if (stage === 'createConfirm') {
          if (next === firstPin) {
            onSuccess(next);
          } else {
            setErrorMsg(
              'Los 4 números no coinciden. Introduce de nuevo el password desde el principio.'
            );
            setFirstPin('');
            setCurrentDigits('');
            setStage('createFirst');
          }
          return;
        }

        if (stage === 'verifyUnlock') {
          if (next === activeExpectedPin) {
            onSuccess(next);
          } else {
            setErrorMsg('Contraseña incorrecta. Inténtalo de nuevo.');
            setCurrentDigits('');
          }
          return;
        }

        if (stage === 'changeVerifyCurrent') {
          if (next === activeExpectedPin) {
            setCurrentDigits('');
            setErrorMsg(null);
            setStage('changeNewFirst');
          } else {
            setErrorMsg(
              'La contraseña actual no es correcta. Inténtalo de nuevo.'
            );
            setCurrentDigits('');
          }
          return;
        }

        if (stage === 'changeNewFirst') {
          setFirstPin(next);
          setCurrentDigits('');
          setErrorMsg(null);
          setStage('changeNewConfirm');
          return;
        }

        if (stage === 'changeNewConfirm') {
          if (next === firstPin) {
            setActiveExpectedPin(next);
            setCurrentDigits('');
            setErrorMsg(null);
            onChangePassword?.(next);
            setStage('changeSuccess');
          } else {
            setErrorMsg(
              'Las dos contraseñas nuevas no coinciden. Introduce de nuevo la nueva contraseña.'
            );
            setFirstPin('');
            setCurrentDigits('');
            setStage('changeNewFirst');
          }
        }
      }, 160);
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

  const handleStartChangePassword = () => {
    setErrorMsg(null);
    setFirstPin('');
    setCurrentDigits('');
    setStage('changeVerifyCurrent');
  };

  // Diálogo de confirmación cuando la contraseña se ha cambiado correctamente
  if (stage === 'changeSuccess') {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Contraseña cambiada correctamente"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 stroke-[2.25]" />
          </div>

          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Contraseña cambiada correctamente
          </h2>

          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            La contraseña de{' '}
            <span className="font-semibold text-stone-900 dark:text-stone-200">
              {userName || 'este usuario'}
            </span>{' '}
            ha sido actualizada y ya está activa para el uso de la aplicación.
          </p>

          <button
            type="button"
            onClick={() => {
              if (onPasswordChangeComplete) {
                onPasswordChangeComplete();
              } else {
                onCancel();
              }
            }}
            className="mt-6 w-full min-h-[50px] px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center transition-all shadow-sm"
          >
            Aceptar
          </button>
        </div>
      </div>
    );
  }

  const getHeaderTitle = () => {
    switch (stage) {
      case 'createFirst':
        return 'Generar password (1/2)';
      case 'createConfirm':
        return 'Confirmar password (2/2)';
      case 'verifyUnlock':
        return 'Desbloquear lista';
      case 'changeVerifyCurrent':
        return 'Cambiar contraseña';
      case 'changeNewFirst':
        return 'Nueva contraseña (1/2)';
      case 'changeNewConfirm':
        return 'Confirmar nueva contraseña (2/2)';
    }
  };

  const getHeaderSubtitle = () => {
    switch (stage) {
      case 'createFirst':
        return 'Marca 4 números en el teclado (0 al 9)';
      case 'createConfirm':
        return 'Repite los mismos 4 números para confirmar';
      case 'verifyUnlock':
        return `Introduce los 4 números de ${userName || 'este usuario'}`;
      case 'changeVerifyCurrent':
        return `Introduce la contraseña actual de ${userName || 'este usuario'}`;
      case 'changeNewFirst':
        return 'Introduce los 4 números de la nueva contraseña';
      case 'changeNewConfirm':
        return 'Repite por segunda vez la nueva contraseña';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={getHeaderTitle()}
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
              {stage === 'verifyUnlock' ? (
                <Lock className="w-5 h-5" />
              ) : stage.startsWith('change') ? (
                <RefreshCw className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {getHeaderTitle()}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                {getHeaderSubtitle()}
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

        {/* Avisos de pasos intermedios */}
        {stage === 'createConfirm' && !errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Primer código registrado. Vuelve a introducirlo.</span>
          </div>
        )}

        {stage === 'changeNewFirst' && !errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Contraseña actual verificada. Introduce la nueva.</span>
          </div>
        )}

        {stage === 'changeNewConfirm' && !errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Repite la nueva contraseña una segunda vez.</span>
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

        {/* Botones inferiores: "Cambiar contraseña" (en Desbloquear lista) y "Cancelar" */}
        <div className="mt-4 flex flex-col gap-2">
          {stage === 'verifyUnlock' && onChangePassword && (
            <button
              type="button"
              onClick={handleStartChangePassword}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Cambiar contraseña</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[46px] rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
