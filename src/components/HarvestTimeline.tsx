export function HarvestTimeline({
  windowLabel,
  stage,
  risk,
  action,
}: {
  windowLabel: string;
  stage: string;
  risk: string;
  action: string;
}) {
  return (
    <article className="card">
      <div className="section-label">AI-assisted harvest window</div>
      <h3>Estimated suitable window: {windowLabel}</h3>
      <p className="small">Decision support only — not a guaranteed harvest prediction.</p>
      <div className="timeline" style={{ marginTop: 12 }}>
        {[
          "Today",
          `Crop ${stage.toLowerCase()}`,
          "Best harvest window",
          "Increasing weather risk",
        ].map((item, i) => (
          <div key={item}>
            <div className="tl-item">
              <span className="tl-dot" />
              <strong>{item}</strong>
            </div>
            {i < 3 && <div className="tl-line" />}
          </div>
        ))}
      </div>
      <div className="grid-3" style={{ marginTop: 16 }}>
        <div>
          <div className="small muted">Weather risk</div>
          <strong>{risk}</strong>
        </div>
        <div>
          <div className="small muted">Crop stage</div>
          <strong>{stage}</strong>
        </div>
        <div>
          <div className="small muted">Recommended action</div>
          <strong>{action}</strong>
        </div>
      </div>
    </article>
  );
}
