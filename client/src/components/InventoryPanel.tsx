type InventoryPanelProps = {
  t: (key: any) => string;
};

export function InventoryPanel({ t }: InventoryPanelProps) {
  return (
    <section className="card inventory-panel">
      <header className="panel-header">
        <div>
          <h2>{t("tabInventory")}</h2>
          <p className="muted">{t("inventoryPlaceholder")}</p>
        </div>
      </header>
      <div className="inventory-placeholder">
        <p>{t("inventoryPlaceholder")}</p>
      </div>
    </section>
  );
}

