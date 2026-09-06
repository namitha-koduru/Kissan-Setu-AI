import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { LotCard } from "../components/LotCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";

export function LotsPage() {
  const { lots } = useAppState();
  const [activeTab, setActiveTab] = useState<"Active" | "Sold" | "Expired">("Active");

  const filteredLots = lots.filter((l) => {
    if (activeTab === "Active") return l.status === "Open for Offers" || l.status === "Offer Accepted";
    if (activeTab === "Sold") return l.status === "Sold" || l.status === "Closed";
    return l.status === "Expired";
  });

  return (
    <div className="wrap">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 0 14px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>My Lots</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            Manage published lots, buyer inquiries, and active selling tenders.
          </p>
        </div>

        <Link className="btn btn-primary" to="/lots/create">
          <Plus size={16} /> Create New Lot
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="status-tabs">
        {(["Active", "Sold", "Expired"] as const).map((tab) => (
          <div
            key={tab}
            className={`status-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} Lots ({lots.filter((l) => {
              if (tab === "Active") return l.status === "Open for Offers" || l.status === "Offer Accepted";
              if (tab === "Sold") return l.status === "Sold" || l.status === "Closed";
              return l.status === "Expired";
            }).length})
          </div>
        ))}
      </div>

      {/* Lots List */}
      <div>
        {filteredLots.length === 0 ? (
          <EmptyState
            title={`No ${activeTab.toLowerCase()} lots found`}
            text="Published lots and buyer inquiries will appear here."
            action={
              <Link className="btn btn-primary" to="/lots/create">
                Create a Lot
              </Link>
            }
          />
        ) : (
          filteredLots.map((l) => <LotCard key={l.id} lot={l} />)
        )}
      </div>
    </div>
  );
}
