import React, { useState } from 'react';
import { ArrowLeft, User, Lock, Users, ChevronRight } from 'lucide-react';
import { AppUser } from '../types';
import { NumericKeypadModal } from './NumericKeypadModal';

interface UsersManagementScreenProps {
  users: AppUser[];
  onSelectVerifiedUserForEdit: (userId: string) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  onPasswordChangeComplete: () => void;
  onBack: () => void;
}

export const UsersManagementScreen: React.FC<UsersManagementScreenProps> = ({
  users,
  onSelectVerifiedUserForEdit,
  onUpdateUserPassword,
  onPasswordChangeComplete,
  onBack,
}) => {
  const [verifyingUser, setVerifyingUser] = useState<AppUser | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-16 flex-1 flex flex-col">
        {/* Cabecera con botón Volver */}
        <header className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a configuración"
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-semibold text-sm inline-flex items-center gap-2 shadow-xs transition-all whitespace-nowrap"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <h1
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Gestión de usuarios
          </h1>
        </header>

        <main className="flex-1">
          {users.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 px-1">
                Toca sobre tu usuario e introduce el password para editar o eliminar tu cuenta
              </p>

              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setVerifyingUser(user)}
                  className="w-full min-h-[68px] p-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 active:scale-[0.99] border border-stone-200/90 dark:border-stone-800 shadow-xs flex items-center justify-between gap-3 text-left transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                          {user.nombre}
                        </span>
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 p-8 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                No hay usuarios dados de alta
              </h2>
              <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                Puedes registrar nuevos usuarios al crear una nueva lista de la compra pulsando en «Nuevo usuario».
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Teclado numérico al clicar sobre un usuario dado de alta */}
      {verifyingUser && (
        <NumericKeypadModal
          mode="verify"
          userName={verifyingUser.nombre}
          expectedPin={verifyingUser.password}
          onChangePassword={(newPin) => {
            onUpdateUserPassword(verifyingUser.id, newPin);
            setVerifyingUser((prev) =>
              prev ? { ...prev, password: newPin } : null
            );
          }}
          onPasswordChangeComplete={() => {
            setVerifyingUser(null);
            onPasswordChangeComplete();
          }}
          onSuccess={() => {
            const targetId = verifyingUser.id;
            setVerifyingUser(null);
            onSelectVerifiedUserForEdit(targetId);
          }}
          onCancel={() => setVerifyingUser(null)}
        />
      )}
    </div>
  );
};
