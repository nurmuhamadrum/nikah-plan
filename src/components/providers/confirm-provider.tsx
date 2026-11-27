"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "Konfirmasi Tindakan",
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    setOpen(false);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback<ConfirmFn>((opts) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setOptions({
      variant: "default",
      confirmLabel:
        opts.variant === "destructive" ? "Ya, Hapus" : "Ya, Lanjutkan",
      cancelLabel: "Batal",
      ...opts,
    });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const isDestructive = options.variant === "destructive";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Stacked Radix Dialog z-[80] dengan animasi flex-centered motion halus tanpa lompatan transform */}
      <DialogPrimitive.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) settle(false);
        }}
      >
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="fixed inset-0 z-[80] bg-sage-950/50 backdrop-blur-[3px]"
                />
              </DialogPrimitive.Overlay>

              <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center p-4">
                <DialogPrimitive.Content
                  asChild
                  forceMount
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-auto grid w-full max-w-md gap-4 rounded-3xl border border-sage/15 bg-white p-6 shadow-lift focus:outline-none"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          isDestructive
                            ? "border-red-200 bg-red-50 text-red-600"
                            : "border-sage/20 bg-sage-50 text-sage"
                        }`}
                      >
                        {isDestructive ? (
                          <Trash2 className="h-5 w-5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <DialogPrimitive.Title className="font-display text-lg font-bold leading-snug text-sage-900">
                          {options.title}
                        </DialogPrimitive.Title>
                        {options.description && (
                          <DialogPrimitive.Description className="text-xs sm:text-sm leading-relaxed text-sage-600">
                            {options.description}
                          </DialogPrimitive.Description>
                        )}
                      </div>
                    </div>

                    {isDestructive && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2 text-[11.5px] text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Tindakan ini tidak dapat dibatalkan setelah dihapus.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => settle(false)}
                      >
                        {options.cancelLabel ?? "Batal"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isDestructive ? "default" : "sage"}
                        className={
                          isDestructive
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                            : undefined
                        }
                        onClick={() => settle(true)}
                      >
                        {options.confirmLabel ??
                          (isDestructive ? "Ya, Hapus" : "Ya, Lanjutkan")}
                      </Button>
                    </div>
                  </motion.div>
                </DialogPrimitive.Content>
              </div>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  return useCallback<ConfirmFn>(
    async (opts) => {
      if (ctx) return ctx(opts);
      return true;
    },
    [ctx]
  );
}
