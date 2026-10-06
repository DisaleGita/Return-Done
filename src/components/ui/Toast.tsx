"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import styles from "./Toast.module.css";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { ...input, id }]);
      window.setTimeout(() => dismiss(id), input.tone === "error" ? 7000 : 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="region" aria-label="Notifications">
        <ol className={styles.list} aria-live="polite">
          {toasts.map((t) => {
            const Icon = ICONS[t.tone];
            return (
              <li
                key={t.id}
                className={`${styles.toast} ${styles[t.tone]}`}
                role={t.tone === "error" ? "alert" : undefined}
              >
                <Icon className={styles.icon} aria-hidden="true" />
                <div className={styles.text}>
                  <p className={styles.title}>{t.title}</p>
                  {t.description && <p className={styles.description}>{t.description}</p>}
                </div>
                <button
                  type="button"
                  className={styles.close}
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                >
                  <X aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
