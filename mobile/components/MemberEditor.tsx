import { useState } from "react";
import { Field, TextInput } from "@/components/ui/Primitives";
import { GROUP_IDS, groupOf, initialsFor, MEMBER_COLORS, validateMember, type GroupId, type GroupMember } from "@/lib/ride/group";
import { useSafety } from "../state";
import { Sheet } from "./Sheet";

export function MemberEditor({ member, onClose }: { member: GroupMember | "new" | null; onClose: () => void }) {
  const { t } = useSafety();
  return (
    <Sheet open={member !== null} title={t(member === "new" ? "group.addTitle" : "group.editTitle")} onClose={onClose} closeLabel={t("common.close")}>
      {member !== null && <MemberForm key={member === "new" ? "new" : member.id} member={member} onClose={onClose} />}
    </Sheet>
  );
}

function MemberForm({ member, onClose }: { member: GroupMember | "new"; onClose: () => void }) {
  const { t, members, saveMember, showToast } = useSafety();
  const [name, setName] = useState(member === "new" ? "" : member.name);
  const [phone, setPhone] = useState(member === "new" ? "" : member.phone);
  const [relation, setRelation] = useState(member === "new" ? "" : member.relation);
  const [groupId, setGroupId] = useState<GroupId>(member === "new" ? "family" : groupOf(member));
  const [submitted, setSubmitted] = useState(false);
  const errors = validateMember({ name, phone });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.length) return;
    saveMember({
      id: member === "new" ? `member-${Date.now().toString(36)}` : member.id,
      name, phone, relation, groupId,
      ...(member !== "new" && member.shareByDefault !== undefined ? { shareByDefault: member.shareByDefault } : {}),
      initials: initialsFor(name),
      color: member === "new" ? MEMBER_COLORS[members.length % MEMBER_COLORS.length] : member.color,
    });
    showToast(t("group.saved"));
    onClose();
  };

  return (
    <form className="m-form" onSubmit={submit} noValidate>
      <Field label={t("group.name")} hint={submitted && errors.includes("nameRequired") ? t("group.nameRequired") : undefined}>
        <TextInput value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" data-autofocus aria-invalid={submitted && errors.includes("nameRequired")} />
      </Field>
      <Field label={t("group.phone")} hint={submitted && errors.includes("phoneInvalid") ? t("group.phoneInvalid") : undefined}>
        <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" aria-invalid={submitted && errors.includes("phoneInvalid")} />
      </Field>
      <Field label={t("group.relation")}>
        <TextInput value={relation} onChange={(event) => setRelation(event.target.value)} placeholder={t("group.relationPlaceholder")} />
      </Field>
      <div className="m-setting">
        <span className="field-label" id="member-group-label">{t("group.field")}</span>
        <div className="m-segmented" role="radiogroup" aria-labelledby="member-group-label">
          {GROUP_IDS.map((id) => (
            <button key={id} type="button" role="radio" aria-checked={groupId === id} className={groupId === id ? "on" : ""} onClick={() => setGroupId(id)}>{t(`group.${id}`)}</button>
          ))}
        </div>
      </div>
      <div className="m-form-actions">
        <button type="button" className="button button-ghost" onClick={onClose}>{t("common.cancel")}</button>
        <button type="submit" className="button button-primary">{t("common.save")}</button>
      </div>
    </form>
  );
}
