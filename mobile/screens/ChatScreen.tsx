import { ArrowLeft, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Primitives";
import { ME } from "@/lib/ride/chat";
import { initialsFor, membersInGroups } from "@/lib/ride/group";
import { GROUP_ICONS } from "../components/ShareSheet";
import { useSafety } from "../state";

const ME_COLOR = "#e0577e";

/**
 * Group chat for one trusted group. "Send as" lets a presenter post from any
 * member's account on one phone; whoever is selected sees their own messages
 * on the right, as they would on their own phone.
 */
export function ChatScreen() {
  const { t, chat, chatGroupId, members, settings, sendChatMessage, locale } = useSafety();
  const people = membersInGroups(members, [chatGroupId]);
  const userName = settings.userName || "Shreya";
  const senders = [{ id: ME, name: userName, initials: initialsFor(userName), color: ME_COLOR, label: t("chat.you") }, ...people.map((member) => ({ id: member.id, name: member.name, initials: member.initials, color: member.color, label: member.name.split(" ")[0] }))];
  const [sendAs, setSendAs] = useState(ME);
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const messages = chat[chatGroupId];
  const group = t(`group.${chatGroupId}`);
  const Icon = GROUP_ICONS[chatGroupId];
  const sender = (id: string) => senders.find((item) => item.id === id) ?? { id, name: "?", initials: "?", color: "#999", label: "?" };
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

  useEffect(() => { list.current?.lastElementChild?.scrollIntoView({ block: "end" }); }, [messages.length]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendChatMessage(chatGroupId, sendAs, draft);
    setDraft("");
  };

  return (
    <div className="m-chat">
      <header className="m-chat-head">
        <button type="button" className="m-ridehail-back" onClick={() => window.history.back()} aria-label={t("common.back")}><ArrowLeft size={22} /></button>
        <span className={`m-group-pick-icon m-group-${chatGroupId}`} aria-hidden="true"><Icon size={18} /></span>
        <span className="m-chat-title">
          <h1>{t("chat.title", { group })}</h1>
          <small>{t("chat.membersLine", { count: people.length })}</small>
        </span>
        <span className="m-avatar-stack" aria-hidden="true">{people.slice(0, 3).map((member) => <Avatar key={member.id} initials={member.initials} color={member.color} size="sm" />)}</span>
      </header>

      <ol ref={list} className="m-chat-list" aria-live="polite" aria-label={t("chat.title", { group })}>
        {messages.length === 0 && <li className="m-chat-empty">{t("chat.empty")}</li>}
        {messages.map((message, index) => {
          const from = sender(message.senderId);
          const own = message.senderId === sendAs;
          const grouped = messages[index - 1]?.senderId === message.senderId;
          return (
            <li key={message.id} className={`m-chat-row ${own ? "own" : ""} ${grouped ? "grouped" : ""}`}>
              {!own && <span className="m-chat-avatar">{!grouped && <Avatar initials={from.initials} color={from.color} size="sm" />}</span>}
              <div className="m-chat-bubble">
                {!grouped && <strong className="m-chat-sender" style={{ color: own ? undefined : from.color }}>{message.senderId === ME ? `${from.name} (${t("chat.you")})` : from.name}</strong>}
                <p>{message.text}</p>
                <time dateTime={new Date(message.at).toISOString()}>{time.format(message.at)}</time>
              </div>
            </li>
          );
        })}
      </ol>

      <form className="m-chat-compose" onSubmit={submit}>
        <div className="m-chat-sendas" role="radiogroup" aria-label={t("chat.sendAs")}>
          <span className="m-chat-sendas-label">{t("chat.sendAs")}</span>
          {senders.map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={sendAs === item.id} className={sendAs === item.id ? "on" : ""} onClick={() => setSendAs(item.id)}>
              <Avatar initials={item.initials} color={item.color} size="sm" />{item.label}
            </button>
          ))}
        </div>
        <div className="m-chat-input">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t("chat.placeholder", { group })} aria-label={t("chat.placeholder", { group })} enterKeyHint="send" maxLength={500} />
          <button type="submit" className="m-chat-send" disabled={!draft.trim()} aria-label={t("chat.send")}><SendHorizontal size={20} /></button>
        </div>
        <p className="m-chat-note">{t("chat.demoNote")}</p>
      </form>
    </div>
  );
}
