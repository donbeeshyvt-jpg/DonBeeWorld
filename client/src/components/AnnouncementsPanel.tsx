type Announcement = {
  id: number;
  title: string;
  content: string;
  startAt: string;
  endAt: string | null;
};

type AnnouncementsPanelProps = {
  announcements: Announcement[];
  offlineNotes: string[];
  t: (key: any) => string;
};

export function AnnouncementsPanel({
  announcements,
  offlineNotes,
  t
}: AnnouncementsPanelProps) {
  return (
    <section className="card announcement-panel">
      <header className="panel-header">
        <h2>{t("announcements")}</h2>
      </header>
      <div className="announcement-list scrollbar-thin">
        {announcements.length === 0 ? (
          <p className="muted">{t("noAnnouncements")}</p>
        ) : (
          announcements.map((item) => (
            <article key={item.id}>
              <header>
                <strong>{item.title}</strong>
                <time dateTime={item.startAt}>
                  {new Date(item.startAt).toLocaleString()}
                </time>
              </header>
              <p>{item.content}</p>
            </article>
          ))
        )}
      </div>
      <div className="offline-report">
        <h3>{t("offlineReport")}</h3>
        {offlineNotes.length === 0 ? (
          <p className="muted">{t("noOfflineRecords")}</p>
        ) : (
          <ul>
            {offlineNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

