"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const DAY_HEADERS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function getTodayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDisplayDateID(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return "";
  const d = new Date(parsed.year, parsed.month, parsed.day);
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatHeaderPreviewID(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return "Pilih tanggal";
  const d = new Date(parsed.year, parsed.month, parsed.day);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildCalendarCells(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Min .. 6=Sab
  const mondayOffset = (firstDayOfMonth + 6) % 7; // 0=Sen .. 6=Min
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: Array<{
    iso: string;
    day: number;
    inCurrentMonth: boolean;
    isWeekend: boolean;
  }> = [];

  for (let i = mondayOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, day);
    const dow = prevDate.getDay();
    cells.push({
      iso: toIsoDate(prevDate.getFullYear(), prevDate.getMonth(), day),
      day,
      inCurrentMonth: false,
      isWeekend: dow === 0 || dow === 6,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const dow = curDate.getDay();
    cells.push({
      iso: toIsoDate(year, month, day),
      day,
      inCurrentMonth: true,
      isWeekend: dow === 0 || dow === 6,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const nextDate = new Date(year, month + 1, nextDay);
    const dow = nextDate.getDay();
    cells.push({
      iso: toIsoDate(nextDate.getFullYear(), nextDate.getMonth(), nextDay),
      day: nextDay,
      inCurrentMonth: false,
      isWeekend: dow === 0 || dow === 6,
    });
    nextDay++;
  }

  return cells;
}

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  clearable?: boolean;
  disabled?: boolean;
  displayMode?: "popover" | "modal";
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  minDate,
  maxDate,
  clearable = true,
  disabled = false,
  displayMode = "popover",
  className,
}: DatePickerProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobileViewport();
  const effectiveMode = displayMode === "modal" || isMobile ? "modal" : "popover";
  const [open, setOpen] = React.useState(false);
  const [openUpward, setOpenUpward] = React.useState(false);
  const [pickerView, setPickerView] = React.useState<"days" | "months" | "years">("days");

  const todayIso = React.useMemo(() => getTodayIso(), []);
  const parsedValue = React.useMemo(() => parseIsoDate(value), [value]);

  const initialYear = parsedValue?.year ?? new Date().getFullYear();
  const initialMonth = parsedValue?.month ?? new Date().getMonth();

  const [viewYear, setViewYear] = React.useState<number>(initialYear);
  const [viewMonth, setViewMonth] = React.useState<number>(initialMonth);

  // Sinkronkan bulan tampilan setiap kali popup dibuka
  React.useEffect(() => {
    if (open) {
      const target = parseIsoDate(value) || parseIsoDate(minDate || "");
      const now = new Date();
      setViewYear(target?.year ?? now.getFullYear());
      setViewMonth(target?.month ?? now.getMonth());
      setPickerView("days");

      if (effectiveMode === "popover" && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 360 && rect.top > 360);
      }
    }
  }, [open, value, minDate, effectiveMode]);

  // Tutup popover saat klik di luar atau tekan Escape
  React.useEffect(() => {
    if (!open || effectiveMode !== "popover") return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, effectiveMode]);

  const cells = React.useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const isDateDisabled = (iso: string): boolean => {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const handleSelectIso = (iso: string) => {
    if (isDateDisabled(iso)) return;
    onChange(iso);
    setOpen(false);
  };

  const handlePrev = () => {
    if (pickerView === "days") {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (pickerView === "months") {
      setViewYear((y) => y - 1);
    } else {
      setViewYear((y) => y - 12);
    }
  };

  const handleNext = () => {
    if (pickerView === "days") {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (pickerView === "months") {
      setViewYear((y) => y + 1);
    } else {
      setViewYear((y) => y + 12);
    }
  };

  const yearGridStart = Math.floor(viewYear / 12) * 12;
  const yearOptions = Array.from({ length: 12 }, (_, i) => yearGridStart + i);

  const calendarCard = (
    <div className="w-[min(324px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-20px_rgba(20,22,24,0.28)]">
      {/* Header Midnight Velvet */}
      <div className="bg-midnight-luxury px-4 pt-3.5 pb-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              setPickerView((v) => (v === "years" ? "days" : "years"))
            }
            className="text-[11px] font-semibold text-[#E09F3E] hover:underline"
          >
            {viewYear}
          </button>
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">
            Kalender
          </span>
        </div>
        <p className="mt-0.5 font-display text-sm font-bold text-white truncate">
          {formatHeaderPreviewID(value)}
        </p>
      </div>

      {/* Bar Navigasi Bulan & Tahun */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Sebelumnya"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5F6978] hover:bg-[#F4F5F7] hover:text-[#141618] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            setPickerView((v) =>
              v === "days" ? "months" : v === "months" ? "years" : "days"
            )
          }
          className="rounded-full px-3 py-1 text-xs font-bold text-[#141618] hover:bg-[#F4F5F7] transition-colors"
        >
          {pickerView === "days"
            ? `${MONTH_NAMES_ID[viewMonth]} ${viewYear}`
            : pickerView === "months"
              ? `Pilih Bulan · ${viewYear}`
              : `${yearGridStart} – ${yearGridStart + 11}`}
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Berikutnya"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5F6978] hover:bg-[#F4F5F7] hover:text-[#141618] transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Konten Utama: Hari / Bulan / Tahun */}
      <div className="px-3 pb-3">
        {pickerView === "days" && (
          <>
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS_ID.map((dayLabel, idx) => (
                <div
                  key={dayLabel}
                  className={cn(
                    "py-1 text-center text-[10.5px] font-semibold",
                    idx >= 5 ? "text-[#4F6BF6]" : "text-[#8994A4]"
                  )}
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((cell) => {
                const isSelected = value === cell.iso;
                const isToday = todayIso === cell.iso;
                const disabledCell = isDateDisabled(cell.iso);

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={disabledCell}
                    onClick={() => handleSelectIso(cell.iso)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-xl text-xs font-medium tabular-nums transition-all",
                      isSelected
                        ? "bg-midnight-btn text-white font-bold shadow-sm"
                        : isToday
                          ? "ring-1 ring-[#4F6BF6] bg-[#EEF2FF] text-[#4F6BF6] font-bold"
                          : cell.inCurrentMonth
                            ? cell.isWeekend
                              ? "text-[#141618] font-semibold hover:bg-[#EEF2FF] hover:text-[#4F6BF6]"
                              : "text-[#141618] hover:bg-[#F4F5F7]"
                            : "text-[#C2C8D1] hover:bg-[#F7F8FA]",
                      disabledCell && "opacity-30 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {pickerView === "months" && (
          <div className="grid grid-cols-3 gap-1.5 py-1">
            {MONTH_SHORT_ID.map((label, idx) => {
              const active =
                parsedValue?.year === viewYear && parsedValue?.month === idx;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setPickerView("days");
                  }}
                  className={cn(
                    "rounded-xl py-2.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-midnight-btn text-white shadow-sm"
                      : idx === viewMonth
                        ? "bg-[#EEF2FF] text-[#4F6BF6]"
                        : "text-[#141618] hover:bg-[#F4F5F7]"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {pickerView === "years" && (
          <div className="grid grid-cols-3 gap-1.5 py-1">
            {yearOptions.map((yr) => {
              const active = parsedValue?.year === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setViewYear(yr);
                    setPickerView("months");
                  }}
                  className={cn(
                    "rounded-xl py-2.5 text-xs font-semibold tabular-nums transition-colors",
                    active
                      ? "bg-midnight-btn text-white shadow-sm"
                      : yr === viewYear
                        ? "bg-[#EEF2FF] text-[#4F6BF6]"
                        : "text-[#141618] hover:bg-[#F4F5F7]"
                  )}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Aksi Cepat */}
      <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] bg-[#FAFAFB] px-3.5 py-2.5">
        <button
          type="button"
          disabled={isDateDisabled(todayIso)}
          onClick={() => handleSelectIso(todayIso)}
          className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-semibold text-[#4F6BF6] hover:bg-[#E0E7FF] disabled:opacity-40 transition-colors"
        >
          Hari Ini
        </button>

        <div className="flex items-center gap-1.5">
          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#5F6978] hover:text-red-600 transition-colors"
            >
              Hapus
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#141618] hover:bg-black/5 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  const displayText = formatDisplayDateID(value);

  const triggerButton = (
    <div className="relative flex items-center">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-left text-sm transition-all hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BF6]/30 disabled:cursor-not-allowed disabled:opacity-50",
          clearable && value ? "pr-8" : "pr-3",
          open && "border-[#4F6BF6] ring-2 ring-[#4F6BF6]/20",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-[#4F6BF6]" />
        <span
          className={cn(
            "truncate tabular-nums",
            displayText ? "font-medium text-[#141618]" : "text-muted-foreground"
          )}
        >
          {displayText || placeholder}
        </span>
      </button>

      {clearable && value && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          aria-label="Hapus tanggal"
          className="absolute right-2 rounded-full p-1 text-[#8994A4] hover:bg-[#F4F5F7] hover:text-[#141618] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  if (effectiveMode === "modal") {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        {triggerButton}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[3px] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <div className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center p-4">
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="pointer-events-auto outline-none duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-1"
            >
              <DialogPrimitive.Title className="sr-only">
                Pilih Tanggal
              </DialogPrimitive.Title>
              {calendarCard}
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {triggerButton}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={cn(
              "absolute left-0 z-50",
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {calendarCard}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface MonthPickerProps {
  id?: string;
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MonthPicker({
  id,
  value,
  onChange,
  placeholder = "Pilih bulan...",
  disabled = false,
  className,
}: MonthPickerProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = React.useState(false);

  const parsed = React.useMemo(() => {
    const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { year, month };
  }, [value]);

  const [viewYear, setViewYear] = React.useState<number>(
    parsed?.year ?? new Date().getFullYear()
  );

  React.useEffect(() => {
    if (open) {
      setViewYear(parsed?.year ?? new Date().getFullYear());
    }
  }, [open, parsed?.year]);

  React.useEffect(() => {
    if (!open || isMobile) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isMobile]);

  const displayLabel = parsed
    ? `${MONTH_NAMES_ID[parsed.month]} ${parsed.year}`
    : "";

  const monthTrigger = (
    <button
      id={id}
      type="button"
      disabled={disabled}
      aria-expanded={open}
      onClick={() => setOpen((prev) => !prev)}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-left text-sm transition-all hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BF6]/30 disabled:cursor-not-allowed disabled:opacity-50",
        open && "border-[#4F6BF6] ring-2 ring-[#4F6BF6]/20",
        className
      )}
    >
      <CalendarIcon className="h-4 w-4 shrink-0 text-[#4F6BF6]" />
      <span
        className={cn(
          "truncate",
          displayLabel
            ? "font-medium text-[#141618]"
            : "text-muted-foreground"
        )}
      >
        {displayLabel || placeholder}
      </span>
    </button>
  );

  const monthCard = (
    <div className="w-[min(288px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-20px_rgba(20,22,24,0.28)]">
      <div className="flex items-center justify-between bg-midnight-luxury px-3.5 py-2.5 text-white">
        <button
          type="button"
          onClick={() => setViewYear((y) => y - 1)}
          aria-label="Tahun sebelumnya"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-sm font-bold tabular-nums">
          {viewYear}
        </span>
        <button
          type="button"
          onClick={() => setViewYear((y) => y + 1)}
          aria-label="Tahun berikutnya"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-3">
        {MONTH_SHORT_ID.map((mLabel, idx) => {
          const active = parsed?.year === viewYear && parsed?.month === idx;
          return (
            <button
              key={mLabel}
              type="button"
              onClick={() => {
                onChange(`${viewYear}-${pad2(idx + 1)}`);
                setOpen(false);
              }}
              className={cn(
                "rounded-xl py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-midnight-btn text-white shadow-sm"
                  : "text-[#141618] hover:bg-[#EEF2FF] hover:text-[#4F6BF6]"
              )}
            >
              {mLabel}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        {monthTrigger}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[3px] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <div className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center p-4">
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="pointer-events-auto outline-none duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-1"
            >
              <DialogPrimitive.Title className="sr-only">
                Pilih Bulan
              </DialogPrimitive.Title>
              {monthCard}
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {monthTrigger}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 z-50"
          >
            {monthCard}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
