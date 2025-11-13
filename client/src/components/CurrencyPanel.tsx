type CurrencyPanelProps = {
  gold: number;
  soul: number;
  t: (key: any) => string;
  onSponsor: () => void;
  onToggleLanguage: () => void;
  languageLabel: string;
  donationLabel: string;
};

export function CurrencyPanel({
  gold,
  soul,
  t,
  onSponsor,
  onToggleLanguage,
  languageLabel,
  donationLabel
}: CurrencyPanelProps) {
  return (
    <section className="card currency-panel">
      <header className="currency-panel__header">
        <h2>{t("market")}</h2>
        <div className="currency-panel__actions">
          <button className="btn btn-ghost" onClick={onToggleLanguage}>
            {languageLabel}
          </button>
          <button className="btn btn-accent" onClick={onSponsor}>
            {t("sponsor")}
          </button>
        </div>
      </header>
      <div className="currency-panel__balances">
        <article>
          <span className="label">{t("goldCoins")}</span>
          <strong>{gold.toLocaleString()}</strong>
        </article>
        <article>
          <span className="label">{t("soulCoins")}</span>
          <strong>{soul.toLocaleString()}</strong>
        </article>
      </div>
      <p className="currency-panel__donation">{donationLabel}</p>
    </section>
  );
}

