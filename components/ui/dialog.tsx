"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** alertdialog blocks outside-click dismissal. */
  role?: "dialog" | "alertdialog";
  /** When false, Escape, backdrop and the close button stay inactive. */
  dismissible?: boolean;
  className?: string;
}

/**
 * پنجره (مودال). Closes on Escape and overlay click, locks body scroll,
 * moves focus inside on open and restores it on close.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  role = "dialog",
  dismissible = true,
  className,
}: DialogProps) {
  const panel = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("[data-autofocus], button, input, textarea, select, a[href]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus();
    };
  }, [open, onOpenChange, dismissible]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-theme="paper"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => role === "dialog" && dismissible && onOpenChange(false)}
    >
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-md rounded-surface border-line border-border bg-popover p-5 text-popover-foreground shadow-overlay",
          "animate-fade-up [animation-duration:250ms]",
          className,
        )}
      >
        {(title || role === "dialog") && (
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && <h2 id={titleId} className="text-base font-semibold">{title}</h2>}
              {description && <p id={descId} className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {role === "dialog" && dismissible && (
              <button type="button" aria-label="بستن" onClick={() => onOpenChange(false)} className="-me-1 -mt-1 flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-5 flex justify-start gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
