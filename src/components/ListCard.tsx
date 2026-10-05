import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  Play,
  AlertTriangle,
  X,
  User,
  Lock,
} from 'lucide-react';
import { AppUser, ShoppingList } from '../types';
import { formatSpanishDate } from '../utils/storage';
import { NumericKeypadModal } from './NumericKeypadModal';

interface ListCardProps {
  list: ShoppingList;
  users: AppUser[];
  onStartShopping: (listId: string) => void;
  onEditList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  list,
  users,
  onStartShopping,
  onEditList,
  onDeleteList,
  onUpdateUserPassword,
}) => {
  const [menuStep, setMenuStep] = useState<'closed' | 'actions' | 'confirmDelete'>('closed');
  const [showPinVerify, setShowPinVerify] = useState(false);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  const totalProducts = list.lineas.length;
  const checkedProducts = list.lineas.filter((l) => l.marcado).length;
  const isEnCurso = list.estado === 'en curso';

  // Buscar el usuario que creó la lista (por id o por nombre)
  const creatorUser =
    users.find((u) => u.id === list.usuarioId) ??
    users.find(
      (u) =>
        list.usuarioNombre &&
        u.nombre.toLowerCase() === list.usuarioNombre.toLowerCase()
    );

  const displayUserName = creatorUser?.nombre || list.usuarioNombre;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cardWrapperRef.current &&
        !cardWrapperRef.current.contains(event.target as Node)
      ) {
        setMenuStep('closed');
      }
    };

    if (menuStep !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuStep]);

  const handleCardClick = () => {
    if (menuStep !== 'closed') {
      setMenuStep('closed');
      return;
    }

    // Si la lista tiene usuario creador con password, pedimos primero el password de 4 dígitos
    if (creatorUser && creatorUser.password) {
      setShowPinVerify(true);
    } else {
      setMenuStep('actions');
    }
  };

  return (
    <div ref={cardWrapperRef} className="relative">
      {/* Tarjeta de la lista */}
      <button
        type="button"
        onClick={handleCardClick}
        aria-expanded={menuStep !== 'closed'}
        className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
          menuStep !== 'closed'
            ? 'bg-white dark:bg-stone-900 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-600/15'
            : isEnCurso
            ? 'bg-white dark:bg-stone-900 border-amber-500/60 dark:border-amber-500/40 shadow-xs hover:border-amber-500'
            : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 shadow-xs hover:border-stone-300 dark:hover:border-stone-700'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Nombre del usuario antes del nombre de la lista de la compra */}
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate flex items-center gap-2">
              {displayUserName && (
                <>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span>{displayUserName}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-stone-300 dark:text-stone-600 font-normal"
                  >
                    ·
                  </span>
                </>
              )}
              <span className="truncate">{list.nombre}</span>
              {creatorUser?.password && (
                <Lock
                  aria-label="Protegida con password"
                  className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 ml-0.5"
                />
              )}
            </h2>

            {/* Metadatos limpios con separadores tipográficos */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {formatSpanishDate(list.fechaCompra)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          </div>

          {/* Etiqueta "En curso" con progreso si está en curso */}
          {isEnCurso && (
            <div className="shrink-0 flex flex-col items-end">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>En curso</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums font-bold">
                  {checkedProducts}/{totalProducts}
                </span>
              </div>
              {/* Mini barra visual de progreso */}
              <div className="w-20 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-amber-500 transition-all duration-200"
                  style={{
                    width: `${
                      totalProducts > 0
                        ? Math.round((checkedProducts / totalProducts) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Teclado numérico para verificar el password del usuario que creó la lista */}
      {showPinVerify && creatorUser && (
        <NumericKeypadModal
          mode="verify"
          userName={creatorUser.nombre}
          expectedPin={creatorUser.password}
          onChangePassword={(newPin) =>
            onUpdateUserPassword(creatorUser.id, newPin)
          }
          onSuccess={() => {
            setShowPinVerify(false);
            setMenuStep('actions');
          }}
          onCancel={() => setShowPinVerify(false)}
        />
      )}

      {/* Primer Bocadillo (Popover de acciones junto a la tarjeta) */}
      {menuStep === 'actions' && (
        <div
          role="dialog"
          aria-label={`Acciones para la lista ${list.nombre}`}
          className="relative sm:absolute sm:right-4 sm:top-full mt-2 z-30 w-full sm:w-72 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Puntero superior del bocadillo */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute -top-2 right-8 w-3.5 h-3.5 rotate-45 bg-white dark:bg-stone-900 border-l border-t border-stone-200 dark:border-stone-700"
          />

          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 truncate">
              Opciones · {displayUserName ? `${displayUserName} · ` : ''}
              {list.nombre}
            </span>
            <button
              type="button"
              onClick={() => setMenuStep('closed')}
              aria-label="Cerrar menú"
              className="min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMenuStep('closed');
                onStartShopping(list.id);
              }}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center gap-3 transition-all whitespace-nowrap shadow-xs"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{isEnCurso ? 'Continuar compra' : 'Iniciar compra'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuStep('closed');
                onEditList(list.id);
              }}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.99] text-stone-800 dark:text-stone-100 font-semibold text-sm flex items-center gap-3 transition-all whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 shrink-0 text-stone-600 dark:text-stone-300" />
              <span>Editar lista</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuStep('confirmDelete')}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 active:scale-[0.99] text-red-700 dark:text-red-300 font-semibold text-sm flex items-center gap-3 transition-all whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Borrar lista</span>
            </button>
          </div>
        </div>
      )}

      {/* Segundo Bocadillo de Confirmación de Borrado */}
      {menuStep === 'confirmDelete' && (
        <div
          role="alertdialog"
          aria-label={`Confirmar borrado de ${list.nombre}`}
          className="relative sm:absolute sm:right-4 sm:top-full mt-2 z-30 w-full sm:w-80 rounded-2xl bg-white dark:bg-stone-900 border-2 border-red-500/80 dark:border-red-500/70 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            aria-hidden="true"
            className="hidden sm:block absolute -top-2 right-8 w-3.5 h-3.5 rotate-45 bg-white dark:bg-stone-900 border-l-2 border-t-2 border-red-500/80 dark:border-red-500/70"
          />

          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                ¿Eliminar «{list.nombre}»?
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Esta acción borrará la lista y no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMenuStep('closed');
                onDeleteList(list.id);
              }}
              className="flex-1 min-h-[46px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
            >
              Confirmar borrado
            </button>
            <button
              type="button"
              onClick={() => setMenuStep('closed')}
              className="flex-1 min-h-[46px] px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center transition-all whitespace-nowrap"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
