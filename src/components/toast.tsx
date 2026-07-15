"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-auto rounded-2xl border border-claude-border bg-claude-card p-4 shadow-lift",
              t.type === "danger" && "border-claude-danger/30",
              t.type === "success" && "border-claude-success/30",
              t.type === "warning" && "border-claude-warning/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-claude-ink">{t.title}</div>
                {t.body && (
                  <div className="mt-0.5 text-xs text-claude-ink-secondary">{t.body}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-xs text-claude-ink-muted hover:text-claude-ink"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
