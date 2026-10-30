import { GROUP_IDS, isGroupId, type GroupId } from "./group.ts";

/** Sender id for the rider herself (she is in every group she owns). */
export const ME = "me";

export interface ChatMessage {
  id: string;
  groupId: GroupId;
  senderId: string;
  text: string;
  at: number;
}

export type ChatLog = Record<GroupId, ChatMessage[]>;

const MINUTE = 60_000;

// [sender, text, minutes ago]. Sender ids match DEMO_MEMBERS.
const SEEDS: Record<GroupId, Array<[string, string, number]>> = {
  family: [
    ["member-mom", "Did you leave the office yet?", 46],
    [ME, "Leaving in 10 mins, booking a cab now", 44],
    ["member-dad", "Share the ride on Halovia once you're in", 43],
    ["member-kavi", "I'll keep an eye on the map 👀", 41],
    ["member-meera", "Message when you reach, beta", 38],
  ],
  friends: [
    ["member-isha", "Still on for dinner on Saturday?", 180],
    ["member-rohan", "Yes! I'll book the table", 172],
    ["member-neha", "Can we do 8 instead of 7?", 165],
    [ME, "8 works for me", 160],
  ],
  colleagues: [
    ["member-priya", "Thanks for staying late on the release today", 95],
    ["member-sameer", "Get home safe, everyone", 90],
    [ME, "Thank you! Heading out now", 62],
  ],
};

export function seedChat(now: number): ChatLog {
  const log = {} as ChatLog;
  for (const groupId of GROUP_IDS) {
    log[groupId] = SEEDS[groupId].map(([senderId, text, minutesAgo], index) => ({ id: `seed-${groupId}-${index}`, groupId, senderId, text, at: now - minutesAgo * MINUTE }));
  }
  return log;
}

/** Adds a message to its group's thread. Blank text is ignored. */
export function appendMessage(log: ChatLog, message: ChatMessage): ChatLog {
  const text = message.text.trim();
  if (!text) return log;
  return { ...log, [message.groupId]: [...log[message.groupId], { ...message, text }] };
}

export function isChatLog(value: unknown): value is ChatLog {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return GROUP_IDS.every((groupId) => Array.isArray(record[groupId]) && (record[groupId] as ChatMessage[]).every((item) => item && typeof item.text === "string" && isGroupId(item.groupId)));
}
