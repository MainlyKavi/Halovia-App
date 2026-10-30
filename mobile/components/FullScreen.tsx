import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNow } from "../hooks";

// Overlays can stack (a countdown hands over to an alert), so the app stays
// inert until the last one closes.
let open = 0;
function setBackgroundInert(inert: boolean) {
  const root = document.getElementById("root");
  if (root) root.inert = inert;
  document.body.classList.toggle("dialog-open", inert);
}

/**
 * Covers the whole viewport above everything else, outside the app root, so
 * no transformed or clipped ancestor can shrink it. Everything behind it is
 * inert (no taps, no focus, hidden from screen readers) until it closes.
 */
export function FullScreenOverlay({ className, labelledBy, describedBy, children }: { className: string; labelledBy: string; describedBy?: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    open += 1;
    setBackgroundInert(true);
    queueMicrotask(() => panel.current?.querySelector<HTMLElement>("[data-autofocus], button")?.focus());
    return () => {
      open -= 1;
      if (open === 0) setBackgroundInert(false);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div ref={panel} className={`m-fullscreen ${className}`} role="alertdialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {children}
    </div>,
    document.body,
  );
}

/** Ring countdown with one large Cancel button. Used by SOS and the contact alert. */
export function CountdownOverlay({ id, endsAt, durationMs, title, text, cancelLabel, onCancel }: {
  id: string; endsAt: number; durationMs: number; title: (seconds: number) => string; text: string; cancelLabel: string; onCancel: () => void;
}) {
  const now = useNow(true, 100);
  const left = Math.max(0, endsAt - now);
  const seconds = Math.ceil(left / 1_000);
  const ring = 2 * Math.PI * 54;
  return (
    <FullScreenOverlay className="m-sos-overlay m-sos-countdown" labelledBy={`${id}-title`} describedBy={`${id}-text`}>
      <div className="m-countdown-ring" aria-hidden="true">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" className="track" /><circle cx="60" cy="60" r="54" className="fill" style={{ strokeDasharray: ring, strokeDashoffset: ring * (1 - left / durationMs) }} /></svg>
        <strong key={seconds}>{seconds}</strong>
      </div>
      <h2 id={`${id}-title`}>{title(seconds)}</h2>
      <p id={`${id}-text`}>{text}</p>
      <button type="button" className="m-sos-cancel m-premium-btn" onClick={onCancel} data-autofocus><X size={20} />{cancelLabel}</button>
    </FullScreenOverlay>
  );
}
