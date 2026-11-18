"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export interface ToastInput {
  tone?: "ok" | "failed" | "neutral";
  title: string;
  detail?: string;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastStack {
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const AUTO_DISMISS_MS = 5000;
const MAX_TOASTS = 3;
const ToastContext = createContext<{ show: (toast: ToastInput) => void } | null>(null);
const ToastStackContext = createContext<ToastStack | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <Toaster>.");
  return context;
}

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const failed = toast.tone === "failed";

  useEffect(() => {
    if (failed || paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [failed, paused, onDismiss, toast.id]);

  const tone = failed ? "failed" : toast.tone === "ok" ? "ok" : "info";
  return (
    <div
      className={`sc-banner sc-banner--notice sc-banner--${tone}`}
      role={failed ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={failed ? "warning" : toast.tone === "ok" ? "check" : "info"} />
      <span className="sc-banner__text">
        <strong>{toast.title}</strong>
        {toast.detail && <span>{toast.detail}</span>}
      </span>
      <span className="sc-banner__end">
        <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
          <Icon name="close" />
        </button>
      </span>
    </div>
  );
}

/** Renders the notification banners. The shell places it at the top of the page column, under the top bar. */
export function ToastBanners() {
  const stack = useContext(ToastStackContext);
  if (!stack || stack.toasts.length === 0) return null;
  return (
    <div className="sc-notices">
      {stack.toasts.map((toast) => <ToastBanner key={toast.id} toast={toast} onDismiss={stack.dismiss} />)}
    </div>
  );
}

interface ToasterProps {
  children: ReactNode;
  /** False when the caller places <ToastBanners /> itself, as the app shell does under the top bar. */
  renderBanners?: boolean;
}

/** Provides useToast() and shows each notification as a dismissible banner. */
export function Toaster({ children, renderBanners = true }: ToasterProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((input: ToastInput) => {
    const id = nextId.current++;
    setToasts((current) => [{ ...input, id }, ...current].slice(0, MAX_TOASTS));
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  const stack = useMemo(() => ({ toasts, dismiss }), [toasts, dismiss]);

  return (
    <ToastContext value={value}>
      <ToastStackContext value={stack}>
        {renderBanners && <ToastBanners />}
        {children}
      </ToastStackContext>
    </ToastContext>
  );
}
