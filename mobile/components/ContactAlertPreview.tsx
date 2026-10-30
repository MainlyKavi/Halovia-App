import { Bell, ChevronRight, MapPinned, Phone, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_PICKUP } from "@/lib/ride/ride-provider";
import { playSound, stopSound } from "../audio";
import { SosMap } from "../cloud/SosMap";
import { vibrate } from "../native";
import { useSafety } from "../state";
import { CountdownOverlay, FullScreenOverlay } from "./FullScreen";

/** Same cancel window as SOS. */
export const CONTACT_ALERT_COUNTDOWN_MS = 3_000;

/**
 * Demo only: shows what a trusted contact's phone shows when this phone goes
 * quiet, so one device can present both sides. Starts a 3 second countdown
 * (cancellable), then opens a full-screen loud alert with the last known
 * location and ride. Calls are never placed.
 */
export function ContactAlertPreview() {
  const { t, settings, session, gps, showToast } = useSafety();
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    const timer = window.setTimeout(() => { setEndsAt(null); setOpenedAt(Date.now()); }, Math.max(0, endsAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [endsAt]);

  useEffect(() => {
    if (openedAt === null) return;
    playSound("alarm");
    void vibrate("sos");
    return () => stopSound();
  }, [openedAt]);

  if (!settings.demoMode) return null;

  const ride = session.ride;
  const name = settings.userName || "Shreya";
  const first = name.split(" ")[0];
  const point = gps?.point ?? ride?.pickup.location ?? DEMO_PICKUP.location;
  const simulated = () => showToast(t("preview.simulatedCall"), "warning");
  const start = () => { void vibrate("warning"); setEndsAt(Date.now() + CONTACT_ALERT_COUNTDOWN_MS); };
  const cancel = () => { setEndsAt(null); showToast(t("preview.cancelled")); };

  return (
    <>
      <button type="button" className="m-text-link" onClick={start} disabled={endsAt !== null || openedAt !== null}>
        <Bell size={16} />{t("preview.start")}
      </button>
      {endsAt !== null && (
        <CountdownOverlay
          id="preview-countdown"
          endsAt={endsAt}
          durationMs={CONTACT_ALERT_COUNTDOWN_MS}
          title={(seconds) => t("preview.countdownTitle", { seconds })}
          text={t("preview.countdownText")}
          cancelLabel={t("preview.cancel")}
          onCancel={cancel}
        />
      )}
      {openedAt !== null && (
        <FullScreenOverlay className="m-sos-overlay m-preview-alert" labelledBy="preview-title">
          <div className="m-preview-inner">
            <span className="m-preview-chip"><Bell size={14} />{t("preview.loud")}</span>
            <h2 id="preview-title">{t("preview.title", { name: first })}</h2>
            <p>{t("preview.lastKnown", { time: new Date(openedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) })}</p>
            <SosMap location={{ lat: point.lat, lng: point.lng, accuracy: null, at: openedAt }} trail={[]} name={name} dark={settings.theme === "dark"} offlineLabel={t("track.mapOffline")} />
            {ride && (
              <div className="m-preview-ride">
                <strong>{t("preview.driver", { name: ride.driver.name })}</strong> · {ride.vehicle.colour} {ride.vehicle.model}
                <br />{ride.vehicle.plate} · {ride.pickup.label} → {ride.drop.label}
              </div>
            )}
            <div className="m-alert-actions">
              <button type="button" className="m-premium-btn m-premium-primary" onClick={simulated} data-autofocus>
                <span className="m-premium-icon"><Phone size={20} /></span><span>{t("live.alert.call", { name: first })}</span><ChevronRight size={18} className="m-premium-chevron" />
              </button>
              <div className="m-alert-actions-row">
                <button type="button" className="m-premium-btn m-premium-glass" onClick={simulated}>
                  <span className="m-premium-icon"><Shield size={18} /></span><span>{t("preview.police")}</span>
                </button>
                <button type="button" className="m-premium-btn m-premium-glass" onClick={simulated}>
                  <span className="m-premium-icon"><MapPinned size={18} /></span><span>{t("live.alert.openMaps")}</span>
                </button>
              </div>
              <button type="button" className="m-premium-btn m-premium-quiet" onClick={() => setOpenedAt(null)}><X size={16} />{t("preview.close")}</button>
            </div>
          </div>
        </FullScreenOverlay>
      )}
    </>
  );
}
