import { MetricCard } from "../components/MetricCard";

const rows = [
  ["Users", "412", "Farmers, FPOs, buyers, staff"],
  ["Farmers", "318", "Active crop records"],
  ["FPOs", "14", "Pooling lots in Nashik belt"],
  ["Buyers", "36", "22 verified · 6 pending"],
  ["Markets", "18", "Maharashtra mandi sample set"],
  ["Data sources", "6", "Weather, mandi, buyer, logistics (demo)"],
  ["Reports", "11", "Weekly realization summaries"],
  ["Grievances", "3", "Open farmer tickets"],
];

export function AdminPage() {
  return (
    <div className="page">
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">Programme oversight for KisanSetu AI. Figures are demo placeholders.</p>
      <div className="grid-4">
        <MetricCard label="Verified buyers" value="22" />
        <MetricCard label="Pending verification" value="6" />
        <MetricCard label="Active listings" value="41" />
        <MetricCard label="Transactions" value="128" hint="Demo pipeline" />
      </div>
      <div className="table-wrap card" style={{ marginTop: 16 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Section</th>
              <th>Count</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, c]) => (
              <tr key={a}>
                <td>{a}</td>
                <td>{b}</td>
                <td>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
