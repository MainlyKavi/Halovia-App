import { Bell, MapPinned, Phone, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_PICKUP } from "@/lib/ride/ride-provider";
import { playSound, stopSound } from "../audio";
import { SosMap } from "../cloud/SosMap";
import { useSafety } from "../state";

const COUNTDOWN_SECONDS = 5;

/**
 * Demo only: shows what a trusted contact's phone shows when this phone goes
 * quiet, so one device can present both sides. Starts a 5 second countdown,
 * then opens a full-screen loud alert with the last known location and ride.
 * Calls are never placed.
 */
export function ContactAlertPreview() {
  const { t, settings, session, gps, showToast } = useSafety();
  const [left, setLeft] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setLeft(null); setOpen(true); return; }
    const timer = window.setTimeout(() => setLeft(left - 1), 1_000);
    return () => window.clearTimeout(timer);
  }, [left]);

  useEffect(() => {
    if (!open) return;
    playSound("alarm");
    return () => stopSound();
  }, [open]);

  if (!settings.demoMode) return null;

  const ride = session.ride;
  const name = settings.userName || "Shreya";
  const first = name.split(" ")[0];
  const point = gps?.point ?? ride?.pickup.location ?? DEMO_PICKUP.location;
  const at = Date.now();
  const location = { lat: point.lat, lng: point.lng, accuracy: null, at };
  const simulated = () => showToast(t("preview.simulatedCall"), "warning");

  return (
    <>
      <button type="button" className="m-text-link" onClick={() => setLeft(COUNTDOWN_SECONDS)} disabled={left !== null || open}>
        <Bell size={16} />{left === null ? t("preview.start") : t("preview.counting", { seconds: left })}
      </button>
      {open && (
        <div className="m-sos-overlay m-preview-alert" role="alertdialog" aria-modal="true" aria-labelledby="preview-title">
          <span className="m-preview-chip"><Bell size={14} />{t("preview.loud")}</span>
          <h2 id="preview-title">{t("preview.title", { name: first })}</h2>
          <p>{t("preview.lastKnown", { time: new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) })}</p>
          <SosMap location={location} trail={[]} name={name} dark={settings.theme === "dark"} offlineLabel={t("track.mapOffline")} />
          {ride && (
            <div className="m-preview-ride">
              <strong>{t("preview.driver", { name: ride.driver.name })}</strong> · {ride.vehicle.colour} {ride.vehicle.model}
              <br />{ride.vehicle.plate} · {ride.pickup.label} → {ride.drop.label}
            </div>
          )}
          <div className="m-sos-actions">
            <button type="button" className="m-sos-white" onClick={simulated}><Phone size={18} />{t("live.alert.call", { name: first })}</button>
            <button type="button" className="m-sos-ghost" onClick={simulated}><Shield size={18} />{t("preview.police")}</button>
            <button type="button" className="m-sos-ghost" onClick={simulated}><MapPinned size={18} />{t("live.alert.openMaps")}</button>
            <button type="button" className="m-sos-link" onClick={() => setOpen(false)}><X size={16} />{t("preview.close")}</button>
          </div>
        </div>
      )}
    </>
  );
}
