export function MetricCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
}) {
  return (
    <div className="metric-card">
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      {hint && <div className="d">{hint}</div>}
      {trend && <div className="d">{trend}</div>}
    </div>
  );
}
