/** The trusted groups a ride can be shared with. Every member belongs to exactly one. */
export type GroupId = "family" | "friends" | "colleagues";
export const GROUP_IDS: readonly GroupId[] = ["family", "friends", "colleagues"];
/** Groups pre-selected when a new ride is shared. */
export const DEFAULT_GROUP_IDS: readonly GroupId[] = ["family"];

export interface GroupMember {
  id: string;
  name: string;
  phone: string;
  relation: string;
  initials: string;
  color: string;
  /** Pre-selected when a new ride is shared. */
  shareByDefault?: boolean;
  /** Missing on members saved before groups existed; they count as family. */
  groupId?: GroupId;
}

export const MEMBER_COLORS = ["#ce6685", "#6f63d9", "#23866d", "#b66c27", "#3d7fb8"] as const;

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (!parts.length) return "?";
  const letters = parts.length === 1 ? Array.from(parts[0]).slice(0, 2) : [Array.from(parts[0])[0], Array.from(parts[parts.length - 1])[0]];
  return letters.join("").toLocaleUpperCase();
}

export type MemberError = "nameRequired" | "phoneInvalid";

export function validateMember(input: Pick<GroupMember, "name" | "phone">): MemberError[] {
  const errors: MemberError[] = [];
  if (!input.name.trim()) errors.push("nameRequired");
  const digits = input.phone.replace(/\D/gu, "");
  if (digits.length < 7 || digits.length > 15 || /[^\d\s+()-]/u.test(input.phone)) errors.push("phoneInvalid");
  return errors;
}

export function upsertMember(members: readonly GroupMember[], member: GroupMember): GroupMember[] {
  const normalized: GroupMember = { ...member, name: member.name.trim(), phone: member.phone.trim(), relation: member.relation.trim(), initials: initialsFor(member.name) };
  return members.some((item) => item.id === member.id)
    ? members.map((item) => (item.id === member.id ? normalized : item))
    : [...members, normalized];
}

export function removeMember(members: readonly GroupMember[], id: string): GroupMember[] {
  return members.filter((item) => item.id !== id);
}

/** Keeps a per-journey selection valid after members are added or removed. */
export function reconcileSelection(selection: readonly string[], members: readonly GroupMember[]): string[] {
  const ids = new Set(members.map((member) => member.id));
  return selection.filter((id) => ids.has(id));
}

export function toggleSelection<T extends string>(selection: readonly T[], id: T): T[] {
  return selection.includes(id) ? selection.filter((item) => item !== id) : [...selection, id];
}

/** Ids of the members a new share starts with: the default ones, or everyone if none are marked. */
export function defaultRecipients(members: readonly GroupMember[]): string[] {
  const marked = members.filter((member) => member.shareByDefault);
  return (marked.length ? marked : members).map((member) => member.id);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/u)[0] ?? "";
}

/**
 * Short list of who is following a journey: "Dad", "Dad & Kavi", or
 * "Dad, Kavi +2" when more than two people are viewing. Templates come from
 * the translated strings so the joiner can be localized.
 */
export function summarizeViewers(names: readonly string[], templates: { pair: string; more: string }): string {
  const first = names.map(firstName).filter(Boolean);
  if (first.length <= 1) return first[0] ?? "";
  if (first.length === 2) return templates.pair.replace("{a}", first[0]).replace("{b}", first[1]);
  return templates.more.replace("{a}", first[0]).replace("{b}", first[1]).replace("{count}", String(first.length - 2));
}

export const isGroupId = (value: unknown): value is GroupId => typeof value === "string" && (GROUP_IDS as readonly string[]).includes(value);

export function groupOf(member: Pick<GroupMember, "groupId">): GroupId {
  return member.groupId ?? "family";
}

export function membersInGroups(members: readonly GroupMember[], groupIds: readonly GroupId[]): GroupMember[] {
  return members.filter((member) => groupIds.includes(groupOf(member)));
}

/** Ids of everyone in the selected groups: the people a shared ride is visible to. */
export function recipientsForGroups(members: readonly GroupMember[], groupIds: readonly GroupId[]): string[] {
  return membersInGroups(members, groupIds).map((member) => member.id);
}

const demo = (id: string, name: string, relation: string, groupId: GroupId, index: number): GroupMember => ({
  id: `member-${id}`, name, phone: `+91 90000 ${String(index).padStart(5, "0")}`, relation, initials: initialsFor(name),
  color: MEMBER_COLORS[(index - 1) % MEMBER_COLORS.length], groupId, ...(groupId === "family" ? { shareByDefault: true } : {}),
});

/** Kavi and Dad are in Family only; Friends and Colleagues are other people. */
export const DEMO_MEMBERS: GroupMember[] = [
  demo("dad", "Dad", "Father", "family", 1),
  demo("kavi", "Kavi Goutam", "Brother", "family", 2),
  demo("mom", "Mom", "Mother", "family", 3),
  demo("aarav", "Aarav", "Cousin", "family", 4),
  demo("meera", "Meera", "Aunt", "family", 5),
  demo("rohan", "Rohan", "Friend", "friends", 6),
  demo("isha", "Isha", "Best friend", "friends", 7),
  demo("karan", "Karan", "Friend", "friends", 8),
  demo("neha", "Neha", "Roommate", "friends", 9),
  demo("priya", "Priya", "Team lead", "colleagues", 10),
  demo("vikram", "Vikram", "Colleague", "colleagues", 11),
  demo("ananya", "Ananya", "Colleague", "colleagues", 12),
  demo("sameer", "Sameer", "Manager", "colleagues", 13),
];
