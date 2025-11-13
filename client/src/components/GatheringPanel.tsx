type GatherJob = {
  id: number;
  nodeKey: string;
  nodeName: string;
  status: string;
  progressPercentage: number;
  expectedEndAt: string;
  result?: {
    items: { itemKey: string; quantity: number }[];
    experience: number;
    claimed: boolean;
    offline: boolean;
  };
};

type GatherNodeOption = {
  nodeKey: string;
  label: string;
};

type GatheringPanelProps = {
  jobs: GatherJob[];
  nodes: GatherNodeOption[];
  t: (key: any) => string;
  onStartGather: (nodeKey: string, cycles: number) => Promise<void>;
  disabled?: boolean;
};

import { useState } from "react";

export function GatheringPanel({
  jobs,
  nodes,
  t,
  onStartGather,
  disabled = false
}: GatheringPanelProps) {
  const [selectedNode, setSelectedNode] = useState(nodes[0]?.nodeKey ?? "");
  const [cycles, setCycles] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (disabled || !selectedNode) return;
    try {
      setLoading(true);
      setError(null);
      await onStartGather(selectedNode, cycles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card gathering-panel">
      <header className="panel-header">
        <div>
          <h2>{t("gathering")}</h2>
          <p className="muted">{t("activeRuns")}</p>
        </div>
      </header>
      <div className="gather-form">
        <label>
          <span>{t("selectNode")}</span>
          <select
            value={selectedNode}
            onChange={(event) => setSelectedNode(event.target.value)}
            disabled={disabled}
          >
            {nodes.map((node) => (
              <option key={node.nodeKey} value={node.nodeKey}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("cycles")}</span>
          <input
            type="number"
            min={1}
            max={20}
            value={cycles}
            onChange={(event) => setCycles(Number(event.target.value))}
            disabled={disabled}
          />
        </label>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || disabled}
        >
          {loading ? "..." : t("startGather")}
        </button>
        {disabled ? (
          <p className="muted">{t("viewOnlyNotice")}</p>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || disabled}
          >
            {loading ? "..." : t("startGather")}
          </button>
        )}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="gather-jobs scrollbar-thin">
        {jobs.length === 0 ? (
          <p className="muted">{t("noActiveJobs")}</p>
        ) : (
          jobs.map((job) => (
            <article key={job.id} className="gather-job">
              <header>
                <h3>{job.nodeName}</h3>
                <span className={`status status-${job.status}`}>
                  {job.status.toUpperCase()}
                </span>
              </header>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, job.progressPercentage)}%` }}
                />
              </div>
              <footer>
                <span>{Math.round(job.progressPercentage)}%</span>
                {job.result && (
                  <span className="result-info">
                    EXP +{job.result.experience} ·{" "}
                    {job.result.items
                      .map((item) => `${item.itemKey}×${item.quantity}`)
                      .join("、")}
                    {job.result.offline ? ` · ${t("offlineCompletion")}` : ""}
                  </span>
                )}
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

