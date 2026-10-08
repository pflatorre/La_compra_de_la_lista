import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatSpanishDate, getTodayDateString } from '../utils/storage';

interface CalendarDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (newDate: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MONTH_NAMES = [
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

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  value,
  onChange,
  hasError,
  disabled = false,
  placeholder = 'Selecciona una fecha...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseYearMonth = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return { year: parts[0], month: parts[1] - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [viewDate, setViewDate] = useState(() => parseYearMonth(value));

  useEffect(() => {
    if (value) {
      setViewDate(parseYearMonth(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewDate.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewDate.year}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = getTodayDateString();
    onChange(today);
    setIsOpen(false);
  };

  const handleSelectTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const y = tom.getFullYear();
    const m = String(tom.getMonth() + 1).padStart(2, '0');
    const d = String(tom.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  // Calculate calendar grid (Monday-first)
  const firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1);
  // getDay() is 0 (Sun) to 6 (Sat). Convert to 0 (Mon) to 6 (Sun)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const todayStr = getTodayDateString();

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          aria-expanded={isOpen}
          aria-label="Abrir desplegable de calendario para elegir fecha de la compra"
          className={`w-full min-h-[52px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between transition-colors ${
            disabled
              ? 'border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/40 cursor-not-allowed opacity-60'
              : hasError
              ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
              : isOpen
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-white dark:bg-stone-900'
              : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="truncate">
              {value ? (
                <span className="font-medium text-stone-900 dark:text-stone-100">
                  {formatSpanishDate(value)}
                </span>
              ) : (
                <span className="text-stone-400 dark:text-stone-500">
                  {placeholder}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400 ml-2 shrink-0">
            {value || 'AAAA-MM-DD'}
          </span>
        </button>

        {/* Input nativo sincronizado para accesibilidad y soporte directo */}
        <input
          type="date"
          disabled={disabled}
          aria-label="Fecha de la compra"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Calendario selector de fecha"
          className="absolute left-0 right-0 sm:right-auto sm:w-84 mt-2 z-40 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Atajos rápidos */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleSelectTomorrow}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              Mañana
            </button>
          </div>

          {/* Cabecera Mes y Año */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Mes anterior"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-base text-stone-900 dark:text-stone-100">
              {MONTH_NAMES[viewDate.month]} {viewDate.year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Mes siguiente"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="text-xs font-semibold text-stone-400 dark:text-stone-500 py-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Cuadrícula de días */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }
              const cellDateStr = `${viewDate.year}-${String(
                viewDate.month + 1
              ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = cellDateStr === value;
              const isToday = cellDateStr === todayStr;

              return (
                <button
                  key={cellDateStr}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`min-h-[42px] rounded-xl text-sm font-mono tabular-nums font-medium flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : isToday
                      ? 'border border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
