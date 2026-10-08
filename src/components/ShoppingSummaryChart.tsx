import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  User,
  ChevronDown,
  Lock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AppUser, ShoppingList } from '../types';
import { formatEuros } from '../utils/storage';
import { NumericKeypadModal } from './NumericKeypadModal';

interface ShoppingSummaryChartProps {
  lists: ShoppingList[];
  users: AppUser[];
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  onGoHome: () => void;
}

interface MonthlySpendPoint {
  monthKey: string; // YYYY-MM
  monthLabel: string; // Ej. "Nov 25"
  fullMonthLabel: string; // Ej. "Noviembre 2025"
  gastoTotal: number;
  comprasCount: number;
  productosComprados: number;
}

const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const FULL_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const ShoppingSummaryChart: React.FC<ShoppingSummaryChartProps> = ({
  lists,
  users,
  onUpdateUserPassword,
  onGoHome,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState<AppUser | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<AppUser | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Calcular los últimos 12 meses para el usuario verificado
  const last12MonthsData = useMemo<MonthlySpendPoint[]>(() => {
    if (!verifiedUser) return [];

    const now = new Date();
    const months: MonthlySpendPoint[] = [];
    const byMonth = new Map<string, MonthlySpendPoint>();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const mIdx = d.getMonth();
      const mStr = String(mIdx + 1).padStart(2, '0');
      const key = `${y}-${mStr}`;
      const shortYear = String(y).slice(-2);

      const point: MonthlySpendPoint = {
        monthKey: key,
        monthLabel: `${SHORT_MONTHS[mIdx]} ${shortYear}`,
        fullMonthLabel: `${FULL_MONTHS[mIdx]} ${y}`,
        gastoTotal: 0,
        comprasCount: 0,
        productosComprados: 0,
      };
      months.push(point);
      byMonth.set(key, point);
    }

    for (const list of lists) {
      const belongsToUser =
        list.usuarioId === verifiedUser.id ||
        (!list.usuarioId &&
          list.usuarioNombre?.toLowerCase() ===
            verifiedUser.nombre.toLowerCase());

      if (!belongsToUser) continue;
      if (!list.fechaCompra || list.fechaCompra.length < 7) continue;

      const monthKey = list.fechaCompra.slice(0, 7);
      const bucket = byMonth.get(monthKey);
      if (!bucket) continue;

      const cost =
        typeof list.costeCompra === 'number' && !isNaN(list.costeCompra)
          ? list.costeCompra
          : 0;
      const markedCount = list.lineas.filter((l) => l.marcado).length;

      bucket.gastoTotal = Math.round((bucket.gastoTotal + cost) * 100) / 100;
      bucket.comprasCount += 1;
      bucket.productosComprados += markedCount;
    }

    return months;
  }, [lists, verifiedUser]);

  const totalSpent12Months = useMemo(
    () =>
      Math.round(
        last12MonthsData.reduce((acc, m) => acc + m.gastoTotal, 0) * 100
      ) / 100,
    [last12MonthsData]
  );

  const totalPurchases12Months = useMemo(
    () => last12MonthsData.reduce((acc, m) => acc + m.comprasCount, 0),
    [last12MonthsData]
  );

  const handleSelectUserOption = (user: AppUser) => {
    setDropdownOpen(false);
    setVerifyingUser(user);
  };

  return (
    <section
      aria-label="Gráficos históricos"
      className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Cabecera del cuadro Gráficos históricos */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
              Gráficos históricos
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Selecciona un usuario e introduce su password para ver el gasto de los últimos 12 meses
            </p>
          </div>
        </div>

        {verifiedUser && (
          <button
            type="button"
            onClick={() => setVerifiedUser(null)}
            aria-label="Cerrar gráfico de usuario"
            title="Cerrar gráfico"
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desplegable de usuarios con verificación de contraseña */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
          Usuario para ver tendencias de consumo
        </label>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors ${
            verifiedUser
              ? 'border-emerald-600/60 bg-emerald-50/40 dark:bg-emerald-950/20'
              : dropdownOpen
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-stone-50/70 dark:bg-stone-950'
              : 'border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-950 hover:border-stone-400'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {verifiedUser ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                  {verifiedUser.nombre}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verificado
                </span>
              </div>
            ) : (
              <span className="text-sm text-stone-500 dark:text-stone-400 truncate">
                {users.length === 0
                  ? 'No hay usuarios registrados'
                  : 'Seleccionar usuario...'}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {dropdownOpen && (
          <div
            role="listbox"
            aria-label="Usuarios disponibles para gráficos históricos"
            className="absolute left-0 right-0 mt-1.5 z-30 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {users.length > 0 ? (
              users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUserOption(u)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {u.nombre}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pedir PIN</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400 text-center">
                No hay usuarios dados de alta todavía.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gráfico Recharts de los últimos 12 meses una vez verificado el password del usuario */}
      {verifiedUser && (
        <div className="pt-2 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800">
            <div>
              <span className="block text-xs text-stone-500 dark:text-stone-400">
                Gasto acumulado últimos 12 meses ({verifiedUser.nombre})
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatEuros(totalSpent12Months)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-xs text-stone-500 dark:text-stone-400">
                Compras en el periodo
              </span>
              <span className="text-base font-mono font-bold tabular-nums text-stone-800 dark:text-stone-200">
                {totalPurchases12Months}{' '}
                {totalPurchases12Months === 1 ? 'compra' : 'compras'}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={last12MonthsData}
                margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#d6d3d1"
                  opacity={0.45}
                />
                <XAxis
                  dataKey="monthLabel"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={48}
                  tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}€`}
                  tick={{ fill: '#78716c', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(5, 150, 105, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) {
                      return null;
                    }
                    const data = payload[0].payload as MonthlySpendPoint;
                    return (
                      <div className="rounded-2xl bg-stone-900 dark:bg-stone-800 text-stone-50 px-3.5 py-2.5 shadow-lg border border-stone-700 text-xs space-y-1">
                        <p className="font-bold text-emerald-400">
                          {data.fullMonthLabel}
                        </p>
                        <p className="font-mono tabular-nums">
                          Gasto del mes:{' '}
                          <span className="font-bold">
                            {formatEuros(data.gastoTotal)}
                          </span>
                        </p>
                        <p className="text-stone-300 font-mono tabular-nums">
                          {data.comprasCount}{' '}
                          {data.comprasCount === 1
                            ? 'lista realizada'
                            : 'listas realizadas'}{' '}
                          · {data.productosComprados} prod.
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="gastoTotal"
                  name="Gasto mensual (€)"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  type="monotone"
                  dataKey="gastoTotal"
                  name="Tendencia"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modal de teclado numérico al elegir un usuario en Gráficos históricos */}
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
            onGoHome();
          }}
          onSuccess={() => {
            const target = verifyingUser;
            setVerifyingUser(null);
            setVerifiedUser(target);
          }}
          onCancel={() => setVerifyingUser(null)}
        />
      )}
    </section>
  );
};
