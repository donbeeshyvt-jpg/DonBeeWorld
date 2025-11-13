import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  channelKey: string;
  message: string;
  createdAt: string;
  profile?: {
    name: string;
    avatarUrl: string | null;
  };
};

type ChatPanelProps = {
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  t: (key: any) => string;
  disabled?: boolean;
};

export function ChatPanel({
  messages,
  onSend,
  t,
  disabled = false
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (disabled || !text.trim()) return;
    setSending(true);
    await onSend(text.trim());
    setText("");
    setSending(false);
  };

  return (
    <section className="card chat-panel">
      <header className="panel-header">
        <h2>{t("chat")}</h2>
      </header>
      <div className="chat-messages scrollbar-thin" ref={listRef}>
        {messages.map((message) => (
          <article key={message.id} className="chat-message">
            <div className="avatar">
              {message.profile?.avatarUrl ? (
                <img
                  src={message.profile.avatarUrl}
                  alt={message.profile.name}
                />
              ) : (
                <span>{message.profile?.name?.at(0) ?? "?"}</span>
              )}
            </div>
            <div className="bubble">
              <header>
                <strong>{message.profile?.name ?? "GM"}</strong>
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </time>
              </header>
              <p>{message.message}</p>
            </div>
          </article>
        ))}
      </div>
      <footer className="chat-input">
        <textarea
          placeholder="**Bold** _Italic_ `Code`"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={disabled}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={sending || disabled}
        >
          {t("send")}
        </button>
      </footer>
    </section>
  );
}

