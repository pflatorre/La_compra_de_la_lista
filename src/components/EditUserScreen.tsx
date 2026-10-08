import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Mail,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { AppUser } from '../types';

interface EditUserScreenProps {
  user: AppUser;
  onSaveUser: (
    userId: string,
    data: { nombre: string; email: string; recibirRecordatorio: boolean }
  ) => void;
  onDeleteUser: (userId: string) => void;
  onBack: () => void;
}

export const EditUserScreen: React.FC<EditUserScreenProps> = ({
  user,
  onSaveUser,
  onDeleteUser,
  onBack,
}) => {
  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email ?? '');
  const [sendReminderChecked, setSendReminderChecked] = useState<boolean>(
    Boolean(user.recibirRecordatorio && user.email)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nombre.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMsg('El nombre del usuario no puede estar vacío.');
      return;
    }

    const shouldReceiveReminder =
      trimmedEmail.length > 0 && sendReminderChecked;

    onSaveUser(user.id, {
      nombre: trimmedName,
      email: trimmedEmail,
      recibirRecordatorio: shouldReceiveReminder,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-16 flex-1 flex flex-col">
        {/* Cabecera con botón Volver */}
        <header className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a gestión de usuarios"
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-semibold text-sm inline-flex items-center gap-2 shadow-xs transition-all whitespace-nowrap"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <h1
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Editar usuario
          </h1>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <section className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs space-y-4">
            {/* Campo para editar el nombre del usuario */}
            <div>
              <label
                htmlFor="edit-user-name"
                className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1.5"
              >
                Nombre del usuario
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="edit-user-name"
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Nombre de la persona"
                  className="w-full min-h-[52px] pl-11 pr-4 py-3 rounded-2xl bg-stone-50/60 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-base font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            {/* Campo para poner o editar el correo electrónico del usuario */}
            <div>
              <label
                htmlFor="edit-user-email"
                className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1.5"
              >
                Correo del usuario
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="edit-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ej. usuario@correo.com"
                  className="w-full min-h-[52px] pl-11 pr-4 py-3 rounded-2xl bg-stone-50/60 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-base font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            {/* Casilla para marcar si se quiere recibir un correo recordatorio de la compra */}
            <label
              htmlFor="edit-user-reminder-checkbox"
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 cursor-pointer select-none"
            >
              <input
                id="edit-user-reminder-checkbox"
                type="checkbox"
                checked={sendReminderChecked}
                onChange={(e) => setSendReminderChecked(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-600 shrink-0 accent-emerald-600"
              />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Marca esta casilla si quieres recibir un correo recordatorio de la compra
                </span>
                <span
                  className={`mt-1 block text-xs font-medium ${
                    sendReminderChecked && email.trim().length > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {sendReminderChecked && email.trim().length > 0
                    ? '✓ Se enviará el día antes de la compra a las 20:00h.'
                    : 'Se enviará el día antes de la compra a las 20:00h (requiere marcar la casilla e indicar correo).'}
                </span>
              </div>
            </label>
          </section>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 p-4 text-red-800 dark:text-red-200 flex items-center gap-3 text-sm font-semibold"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              className="w-full min-h-[56px] px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Guardar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full min-h-[52px] px-6 py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 active:scale-[0.99] text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/60 font-bold text-base flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              <Trash2 className="w-5 h-5" />
              <span>Eliminar Usuario</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cuadro de diálogo de confirmación para Eliminar Usuario */}
      {showDeleteDialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de usuario"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  ¿Está usted seguro de eliminar su usuario?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Se eliminará el usuario <strong>{user.nombre}</strong> y todas sus listas y datos de toda la aplicación.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  onDeleteUser(user.id);
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar la eliminación</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
