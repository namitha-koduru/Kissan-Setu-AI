export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="metric">
      <div className="small muted">{label}</div>
      <b>{value}</b>
      {hint && <div className="small">{hint}</div>}
    </article>
  );
}
