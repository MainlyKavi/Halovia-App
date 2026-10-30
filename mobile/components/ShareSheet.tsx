import { BriefcaseBusiness, Car, Check, HeartHandshake, LoaderCircle, MapPin, MessageCircle, Route, UserRound, UsersRound } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Primitives";
import { DEFAULT_GROUP_IDS, GROUP_IDS, membersInGroups, summarizeViewers, toggleSelection, type GroupId } from "@/lib/ride/group";
import { useSafety } from "../state";
import { Sheet } from "./Sheet";

export const GROUP_ICONS: Record<GroupId, typeof UsersRound> = { family: HeartHandshake, friends: UsersRound, colleagues: BriefcaseBusiness };

/** Opened from "Share with Halovia". Remounted each time it opens, so the selection starts fresh. */
export function ShareSheet() {
  const { shareSheetOpen, setShareSheetOpen, t } = useSafety();
  return (
    <Sheet open={shareSheetOpen} title={t("share.title")} onClose={() => setShareSheetOpen(false)} closeLabel={t("common.close")}>
      {shareSheetOpen && <ShareSheetBody />}
    </Sheet>
  );
}

function ShareSheetBody() {
  const { members, t, startSharing, setShareSheetOpen, navigate, openChat, screen } = useSafety();
  const [selected, setSelected] = useState<GroupId[]>(() => [...DEFAULT_GROUP_IDS]);
  const [busy, setBusy] = useState(false);
  const recipients = membersInGroups(members, selected);
  const items = [
    { icon: MapPin, label: t("share.liveLocation") },
    { icon: UserRound, label: t("share.driverDetails") },
    { icon: Car, label: t("share.plate") },
    { icon: Route, label: t("share.journey") },
  ];

  const start = async () => {
    setBusy(true);
    await startSharing(selected);
    setBusy(false);
    setShareSheetOpen(false);
    // The simulated ride-app screen hands over to Home, as in the demo script.
    navigate(screen === "rapido" ? "home" : "ride");
  };

  return (
    <div className="m-share">
      <h3>{t("share.whatTitle")}</h3>
      <ul className="m-share-items">
        {items.map(({ icon: Icon, label }) => <li key={label}><span><Icon size={17} /></span>{label}<Check size={16} className="m-share-check" /></li>)}
      </ul>
      <h3>{t("share.whoTitle")}</h3>
      <p className="m-share-hint">{t("share.groupsHint")}</p>
      {members.length === 0 ? (
        <div className="m-empty-inline">
          <p>{t("share.noMembers")}</p>
          <button type="button" className="button button-secondary" onClick={() => { setShareSheetOpen(false); navigate("group"); }}>{t("group.add")}</button>
        </div>
      ) : (
        <div className="m-group-picks" role="group" aria-label={t("share.whoTitle")}>
          {GROUP_IDS.map((groupId) => {
            const on = selected.includes(groupId);
            const people = membersInGroups(members, [groupId]);
            const Icon = GROUP_ICONS[groupId];
            const group = t(`group.${groupId}`);
            return (
              <div key={groupId} className={`m-group-pick ${on ? "on" : ""}`}>
                <button type="button" className="m-group-pick-main" aria-pressed={on} disabled={!people.length} onClick={() => setSelected((current) => toggleSelection(current, groupId))}>
                  <span className={`m-group-pick-icon m-group-${groupId}`} aria-hidden="true"><Icon size={20} /></span>
                  <span className="m-group-pick-text">
                    <strong>{group}<small>{t("share.groupPeople", { count: people.length })}</small></strong>
                    <span>{people.map((member) => member.name.split(" ")[0]).join(", ")}</span>
                  </span>
                  <span className="m-check" aria-hidden="true">{on && <Check size={15} />}</span>
                </button>
                <button type="button" className="m-group-pick-chat" onClick={() => openChat(groupId)} aria-label={t("share.openChat", { group })}>
                  <MessageCircle size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {recipients.length > 0 && (
        <div className="m-share-summary" aria-live="polite">
          <span className="m-avatar-stack" aria-hidden="true">{recipients.slice(0, 4).map((member) => <Avatar key={member.id} initials={member.initials} color={member.color} size="sm" />)}</span>
          <span>{t("home.canSee", { names: summarizeViewers(recipients.map((member) => member.name), { pair: t("home.viewersPair"), more: t("home.viewersMore") }) })}</span>
        </div>
      )}
      <button type="button" className="button button-primary button-lg m-block" disabled={!recipients.length || busy} onClick={() => void start()}>
        {busy ? <LoaderCircle className="spin" size={18} /> : null}
        {recipients.length ? t("share.startCount", { count: recipients.length }) : t("share.pickGroup")}
      </button>
    </div>
  );
}
