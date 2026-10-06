import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ShoppingList } from '../types';

interface ShoppingSummaryChartProps {
  lists: ShoppingList[];
}

interface MonthlySummaryPoint {
  monthKey: string; // YYYY-MM
  monthLabel: string; // Ej. "Oct 2026"
  productosComprados: number;
  unidadesCompradas: number;
  listasCount: number;
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

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const monthName = SHORT_MONTHS[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

export const ShoppingSummaryChart: React.FC<ShoppingSummaryChartProps> = ({
  lists,
}) => {
  const monthlyData = useMemo<MonthlySummaryPoint[]>(() => {
    const map = new Map<string, MonthlySummaryPoint>();

    for (const list of lists) {
      if (!list.fechaCompra || list.fechaCompra.length < 7) continue;
      const monthKey = list.fechaCompra.slice(0, 7); // YYYY-MM

      const current = map.get(monthKey) ?? {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        productosComprados: 0,
        unidadesCompradas: 0,
        listasCount: 0,
      };

      const markedLines = list.lineas.filter((l) => l.marcado);
      current.productosComprados += markedLines.length;
      current.unidadesCompradas += markedLines.reduce(
        (sum, l) => sum + l.cantidad,
        0
      );
      current.listasCount += 1;

      map.set(monthKey, current);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );
  }, [lists]);

  const totalProductosComprados = useMemo(
    () => monthlyData.reduce((acc, item) => acc + item.productosComprados, 0),
    [monthlyData]
  );

  if (monthlyData.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Resumen de Compras"
      className="mb-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
              Resumen de Compras
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Número de productos comprados por mes
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="block text-lg sm:text-xl font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {totalProductosComprados}
          </span>
          <span className="block text-[11px] text-stone-500 dark:text-stone-400">
            {totalProductosComprados === 1 ? 'producto total' : 'productos totales'}
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
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
              tick={{ fill: '#78716c', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#78716c', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(5, 150, 105, 0.08)' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload as MonthlySummaryPoint;
                return (
                  <div className="rounded-2xl bg-stone-900 dark:bg-stone-800 text-stone-50 px-3.5 py-2.5 shadow-lg border border-stone-700 text-xs space-y-1">
                    <p className="font-bold text-emerald-400">
                      {data.monthLabel}
                    </p>
                    <p className="font-mono tabular-nums">
                      Productos comprados:{' '}
                      <span className="font-bold">{data.productosComprados}</span>
                    </p>
                    <p className="font-mono tabular-nums text-stone-300">
                      Unidades totales: {data.unidadesCompradas}
                    </p>
                    <p className="text-stone-400">
                      {data.listasCount}{' '}
                      {data.listasCount === 1
                        ? 'lista en el mes'
                        : 'listas en el mes'}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="productosComprados"
              name="Productos comprados"
              fill="#059669"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
