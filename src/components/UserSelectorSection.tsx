import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  UserPlus,
  ChevronDown,
  KeyRound,
  Check,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { AppUser } from '../types';
import { generateId } from '../utils/storage';
import { NumericKeypadModal } from './NumericKeypadModal';

interface UserSelectorSectionProps {
  users: AppUser[];
  selectedUserId: string;
  isUserVerified: boolean;
  hasError?: boolean;
  onSelectVerifiedUser: (user: AppUser) => void;
  onCreateUser: (newUser: AppUser) => void;
}

export const UserSelectorSection: React.FC<UserSelectorSectionProps> = ({
  users,
  selectedUserId,
  isUserVerified,
  hasError,
  onSelectVerifiedUser,
  onCreateUser,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [showCreateKeypad, setShowCreateKeypad] = useState(false);
  const [pendingVerifyUser, setPendingVerifyUser] = useState<AppUser | null>(
    null
  );
  const [registerError, setRegisterError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const completeUserCreation = (nameToUse: string, pinToUse: string) => {
    const trimmed = nameToUse.trim();
    if (!trimmed || pinToUse.length !== 4) return;

    const created: AppUser = {
      id: generateId(),
      nombre: trimmed,
      password: pinToUse,
    };

    onCreateUser(created);
    onSelectVerifiedUser(created);
    setNewUserName('');
    setNewUserPin('');
    setRegisterError(null);
    setShowRegisterForm(false);
  };

  const handlePinCreated = (pin: string) => {
    setShowCreateKeypad(false);
    setNewUserPin(pin);
    setRegisterError(null);

    // Si ya se había escrito el nombre, al confirmar el password queda creado y verificado el usuario
    if (newUserName.trim().length > 0) {
      completeUserCreation(newUserName, pin);
    }
  };

  const handleSaveNewUserManual = () => {
    if (!newUserName.trim()) {
      setRegisterError('Escribe el nombre del usuario.');
      return;
    }
    if (newUserPin.length !== 4) {
      setRegisterError('Pulsa en "Generar password" e introduce los 4 números.');
      return;
    }
    completeUserCreation(newUserName, newUserPin);
  };

  const handleClickUserOption = (user: AppUser) => {
    setDropdownOpen(false);
    setShowRegisterForm(false);
    // Al elegir un usuario del desplegable, salta el teclado numérico para pedir su password
    setPendingVerifyUser(user);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
          Usuario de la lista
        </label>
        {selectedUser && isUserVerified && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Verificado</span>
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Botón desplegable con las personas registradas */}
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            className={`w-full min-h-[52px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors ${
              hasError
                ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
                : dropdownOpen
                ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-white dark:bg-stone-900'
                : selectedUser && isUserVerified
                ? 'border-emerald-600/60 dark:border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-stone-300 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950 hover:border-stone-400 dark:hover:border-stone-600'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {selectedUser && isUserVerified ? (
                <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {selectedUser.nombre}
                </span>
              ) : (
                <span className="text-stone-400 dark:text-stone-500 truncate">
                  {users.length > 0
                    ? 'Elegir usuario registrado...'
                    : 'No hay usuarios registrados aún'}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-stone-400 shrink-0 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Menú desplegable de usuarios */}
          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Personas registradas"
              className="absolute left-0 right-0 mt-1.5 z-30 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              {users.length > 0 ? (
                <ul className="max-h-56 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                  {users.map((u) => {
                    const isSelected =
                      u.id === selectedUserId && isUserVerified;
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => handleClickUserOption(u)}
                          className={`w-full min-h-[48px] px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                              : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="truncate">{u.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-stone-400" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-stone-500 dark:text-stone-400">
                  Aún no hay personas registradas. Usa el botón «Nuevo usuario» para registrarte.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón para registrarse como usuario */}
        <button
          type="button"
          onClick={() => {
            setShowRegisterForm((prev) => !prev);
            setDropdownOpen(false);
            setRegisterError(null);
          }}
          className="min-h-[52px] px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-800 dark:text-stone-100 font-semibold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Nuevo usuario</span>
        </button>
      </div>

      {/* Panel de registro de nuevo usuario */}
      {showRegisterForm && (
        <div className="mt-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Registrar nuevo usuario
            </h3>
            <button
              type="button"
              onClick={() => setShowRegisterForm(false)}
              aria-label="Cerrar registro de usuario"
              className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="new-user-name-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1"
              >
                Nombre de la persona
              </label>
              <input
                id="new-user-name-input"
                type="text"
                value={newUserName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewUserName(val);
                  setRegisterError(null);
                }}
                placeholder="Ej. Ana, Carlos, Mamá..."
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-base font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRegisterError(null);
                  setShowCreateKeypad(true);
                }}
                className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                  newUserPin.length === 4
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-400/50'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs'
                }`}
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>
                  {newUserPin.length === 4
                    ? 'Password confirmado (●●●●)'
                    : 'Generar password (4 números)'}
                </span>
              </button>

              {newUserPin.length === 4 && (
                <button
                  type="button"
                  onClick={handleSaveNewUserManual}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar usuario</span>
                </button>
              )}
            </div>

            {registerError && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {registerError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal con teclado numérico 0-9 para CREAR un nuevo usuario (4 números + confirmación) */}
      {showCreateKeypad && (
        <NumericKeypadModal
          mode="create"
          userName={newUserName.trim()}
          onSuccess={handlePinCreated}
          onCancel={() => setShowCreateKeypad(false)}
        />
      )}

      {/* Modal con teclado numérico 0-9 para VERIFICAR el password al elegir un usuario del desplegable */}
      {pendingVerifyUser && (
        <NumericKeypadModal
          mode="verify"
          userName={pendingVerifyUser.nombre}
          expectedPin={pendingVerifyUser.password}
          onSuccess={() => {
            const verified = pendingVerifyUser;
            setPendingVerifyUser(null);
            onSelectVerifiedUser(verified);
          }}
          onCancel={() => setPendingVerifyUser(null)}
        />
      )}
    </div>
  );
};
