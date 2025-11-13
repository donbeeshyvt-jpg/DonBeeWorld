type MarketItem = {
  marketItemKey: string;
  displayName: string;
  price: number;
  delta: number;
  occurredAt: string | null;
};

type MarketPanelProps = {
  items: MarketItem[];
  t: (key: any) => string;
  onTrade: (
    mode: "buy-coin" | "buy-soul" | "sell-coin" | "sell-soul",
    itemKey: string
  ) => Promise<void>;
  disabled?: boolean;
};

import { useState } from "react";

export function MarketPanel({
  items,
  t,
  onTrade,
  disabled = false
}: MarketPanelProps) {
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const handleTrade = async (
    mode: "buy-coin" | "buy-soul" | "sell-coin" | "sell-soul",
    itemKey: string
  ) => {
    if (disabled) return;
    try {
      setBusyItem(`${mode}-${itemKey}`);
      await onTrade(mode, itemKey);
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <section className="card market-panel">
      <header className="panel-header">
        <div>
          <h2>{t("market")}</h2>
          <p className="muted">{t("stockTicker")}</p>
        </div>
      </header>
      <div className="market-grid scrollbar-thin">
        {items.map((item) => (
          <article key={item.marketItemKey} className="market-item">
            <header>
              <h3>{item.displayName}</h3>
              <span className={`delta ${item.delta >= 0 ? "up" : "down"}`}>
                {item.delta >= 0 ? "+" : ""}
                {item.delta}
              </span>
            </header>
            <p className="price">
              {t("price")}：<strong>{item.price.toLocaleString()}</strong>
            </p>
            <div className="market-actions">
              <button
                className="btn btn-outline"
                disabled={busyItem !== null || disabled}
                onClick={() => handleTrade("buy-coin", item.marketItemKey)}
              >
                {t("buyCoin")}
              </button>
              <button
                className="btn btn-outline"
                disabled={busyItem !== null || disabled}
                onClick={() => handleTrade("buy-soul", item.marketItemKey)}
              >
                {t("buySoul")}
              </button>
            </div>
            <div className="market-actions">
              <button
                className="btn btn-ghost"
                disabled={busyItem !== null || disabled}
                onClick={() => handleTrade("sell-coin", item.marketItemKey)}
              >
                {t("sellCoin")}
              </button>
              <button
                className="btn btn-ghost"
                disabled={busyItem !== null || disabled}
                onClick={() => handleTrade("sell-soul", item.marketItemKey)}
              >
                {t("sellSoul")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

