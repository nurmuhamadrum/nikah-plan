"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export interface ToastApi {
  show: (variant: ToastVariant, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    container: string;
    iconWrap: string;
    title: string;
    desc: string;
    Icon: typeof CheckCircle2;
  }
> = {
  success: {
    container:
      "border-emerald-200/90 bg-white/95 text-sage-900 shadow-lift ring-1 ring-emerald-500/10",
    iconWrap: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
    title: "text-sage-900",
    desc: "text-sage-700",
    Icon: CheckCircle2,
  },
  error: {
    container:
      "border-red-200/90 bg-white/95 text-red-950 shadow-lift ring-1 ring-red-500/10",
    iconWrap: "bg-red-50 text-red-600 border border-red-200/80",
    title: "text-red-950",
    desc: "text-red-700",
    Icon: XCircle,
  },
  warning: {
    container:
      "border-amber-200/90 bg-white/95 text-amber-950 shadow-lift ring-1 ring-amber-500/10",
    iconWrap: "bg-amber-50 text-amber-600 border border-amber-200/80",
    title: "text-amber-950",
    desc: "text-amber-800",
    Icon: AlertTriangle,
  },
  info: {
    container:
      "border-sage/20 bg-white/95 text-sage-900 shadow-lift ring-1 ring-sage/10",
    iconWrap: "bg-sage-50 text-sage border border-sage/20",
    title: "text-sage-900",
    desc: "text-sage-700",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, variant, title, description }]);
      const duration = variant === "error" ? 5500 : 4000;
      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
      warning: (title, description) => show("warning", title, description),
      info: (title, description) => show("info", title, description),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Floating Toast Viewport (z-[100] selalu di atas dialog & navbar) */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center sm:items-end gap-2 px-4 sm:right-4 sm:left-auto sm:w-full sm:max-w-sm"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const style = VARIANT_STYLES[item.variant];
            const Icon = style.Icon;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                role={item.variant === "error" ? "alert" : "status"}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 backdrop-blur-md ${style.container}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.iconWrap}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-xs font-bold leading-snug ${style.title}`}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p
                      className={`mt-0.5 text-[11.5px] leading-relaxed ${style.desc}`}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Tutup notifikasi"
                  className="rounded-lg p-1 text-sage-400 hover:bg-black/5 hover:text-sage-800 transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const NOOP_TOAST: ToastApi = {
  show: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  dismiss: () => {},
};

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
