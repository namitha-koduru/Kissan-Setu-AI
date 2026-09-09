import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ShieldCheck,
  Users,
  Layers,
  ShoppingBag,
  TrendingUp,
  Warehouse,
  ArrowRight,
  Handshake,
  Package,
} from "lucide-react";
import { fpoFarmers, allMarketplaceLots } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function FPOPage() {
  const { user } = useAuth();
  const { lots, offers } = useAppState();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const activeTabParam = params.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "members" | "aggregation" | "deals">(
    (activeTabParam as any) || "overview",
  );

  const [membersList, setMembersList] = useState(fpoFarmers);
  const [newMemberModal, setNewMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberCrop, setNewMemberCrop] = useState("Grapes");
  const [newMemberQty, setNewMemberQty] = useState(500);

  const memberCount = user?.memberFarmerCount || 850;
  const totalVolume = membersList.reduce((sum, f) => sum + f.quantityKg, 0) + 12500;
  const storageCapacity = "50,000 kg Cold Storage (82% Available)";

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setMembersList((prev) => [
      ...prev,
      {
        name: `${newMemberName.trim()} (${user?.district || "Nashik"})`,
        quantityKg: Number(newMemberQty) || 500,
        crop: newMemberCrop,
        grade: "Grade A",
      },
    ]);
    setNewMemberName("");
    setNewMemberModal(false);
  };

  const fpoLots = useMemo(() => {
    return lots.filter((l) => l.aggregated || l.farmerCount || true);
  }, [lots]);

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-xs mb-xs">
            <span className="badge-pill badge-high">🏛 {t("fpo.badge", "FPO Aggregation Portal")}</span>
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {user?.district || "Regional"} Hub
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
            {user?.organizationName || user?.name || "Sahyadri Farmers Producer Organization"}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {t(
              "fpo.subtitle",
              "Aggregate smallholder produce, organize collection centers, manage bulk lots, and connect directly to institutional buyers.",
            )}
          </p>
        </div>

        <div className="flex gap-sm">
          <Link className="btn btn-primary" to="/lots/create">
            <Plus size={16} /> {t("fpo.createBulkLot", "Create Bulk Lot")}
          </Link>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => setNewMemberModal(true)}
          >
            <Users size={16} /> {t("fpo.addMember", "Add Member")}
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Tabs */}
      <div className="status-tabs mb-lg">
        <div
          className={`status-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          {t("fpo.tabOverview", "Organization Overview")}
        </div>
        <div
          className={`status-tab ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          {t("fpo.tabMembers", "Member Farmers")} ({memberCount})
        </div>
        <div
          className={`status-tab ${activeTab === "aggregation" ? "active" : ""}`}
          onClick={() => setActiveTab("aggregation")}
        >
          {t("fpo.tabAggregation", "Produce Aggregation")}
        </div>
        <div
          className={`status-tab ${activeTab === "deals" ? "active" : ""}`}
          onClick={() => setActiveTab("deals")}
        >
          {t("fpo.tabDeals", "Organization Deals")}
        </div>
      </div>

      {/* Overview Metrics Grid */}
      <div className="metric-grid mb-lg">
        <div className="metric-card">
          <div className="metric-label flex flex-between">
            <span>{t("fpo.memberFarmers", "Registered Members")}</span>
            <Users size={16} color="var(--green-deep)" />
          </div>
          <div className="metric-value">{memberCount}</div>
          <div className="metric-hint">{t("fpo.activeSmallholders", "Active smallholder network")}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label flex flex-between">
            <span>{t("fpo.aggregatedVolume", "Aggregated Volume")}</span>
            <Layers size={16} color="var(--green-deep)" />
          </div>
          <div className="metric-value">{totalVolume.toLocaleString("en-IN")} kg</div>
          <div className="metric-hint">{t("fpo.pooledGradeA", "High-grade aggregated produce")}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label flex flex-between">
            <span>{t("fpo.storageCapacity", "Storage Capacity")}</span>
            <Warehouse size={16} color="var(--green-deep)" />
          </div>
          <div className="metric-value">50,000 kg</div>
          <div className="metric-hint">82% Available Cold Chain Space</div>
        </div>

        <div className="metric-card">
          <div className="metric-label flex flex-between">
            <span>{t("fpo.buyerTenders", "Buyer Demand")}</span>
            <ShoppingBag size={16} color="var(--green-deep)" />
          </div>
          <div className="metric-value">5 Verified Buyers</div>
          <div className="metric-hint">BigBasket, Reliance, FreshFarm</div>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="flex-col gap-lg">
          {/* Active Bulk Lots & Demands */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
              <div className="flex flex-between flex-center mb-sm">
                <div className="flex flex-center gap-xs">
                  <Package size={17} color="var(--green-deep)" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                    {t("fpo.activeBulkLots", "Active Aggregated Lots")}
                  </span>
                </div>
                <Link to="/lots" className="text-xs fw-700" style={{ color: "var(--green-deep)" }}>
                  {t("common.viewAll", "View All")} →
                </Link>
              </div>

              <div className="flex-col gap-sm">
                {fpoLots.slice(0, 2).map((l) => (
                  <div
                    key={l.id}
                    style={{
                      background: "var(--bg-warm)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex flex-between">
                      <span style={{ fontSize: 13, fontWeight: 800 }}>
                        {l.crop} · {l.quantityKg.toLocaleString("en-IN")} kg
                      </span>
                      <span className="badge-pill badge-high" style={{ fontSize: 10 }}>
                        {l.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                      Lot {l.id} · Asking ₹{l.expectedPrice}/kg · {l.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
              <div className="flex flex-between flex-center mb-sm">
                <div className="flex flex-center gap-xs">
                  <Handshake size={17} color="var(--green-deep)" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                    {t("fpo.currentBuyerDemand", "Top Institutional Demands")}
                  </span>
                </div>
                <Link to="/buyers" className="text-xs fw-700" style={{ color: "var(--green-deep)" }}>
                  {t("fpo.findBuyers", "Find Buyers")} →
                </Link>
              </div>

              <div className="flex-col gap-sm">
                <div
                  style={{
                    background: "var(--bg-warm)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="flex flex-between">
                    <span style={{ fontSize: 13, fontWeight: 800 }}>FreshFarm Foods</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)" }}>₹32.50 / kg</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                    Tender for 5,000 kg Tomato · Direct Cold Hub Intake
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-warm)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="flex flex-between">
                    <span style={{ fontSize: 13, fontWeight: 800 }}>AgroMart Institutional</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)" }}>₹68.00 / kg</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                    Tender for 8,000 kg Grapes (Export Grade) · T+1 Settlement
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collective Advantage Banner */}
          <div className="card card-pad" style={{ background: "var(--cream)", border: "1px solid #EADBBE" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={22} color="#176B45" />
              <h4 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>
                {t("fpo.bargainingPowerTitle", "FPO Collective Bargaining Power")}
              </h4>
            </div>
            <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", marginTop: 6, marginBottom: 0 }}>
              {t(
                "fpo.bargainingPowerDesc",
                "By pooling smallholder produce into consolidated bulk lots, the FPO eliminates individual transport overheads, unlocks wholesale institutional contracts, and secures +14% higher net realization for every participating member farmer.",
              )}
            </p>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="card card-pad table-scroll" style={{ background: "#FFFFFF" }}>
          <div className="flex flex-between flex-center mb-md">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              {t("fpo.contributingFarmers", "Registered Smallholder Members")}
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setNewMemberModal(true)}>
              <Plus size={14} /> {t("fpo.addMember", "Add Member")}
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>{t("auth.fullName", "Member Name & Location")}</th>
                <th>{t("lots.crop", "Crop")}</th>
                <th>{t("lots.qualityGrade", "Quality Grade")}</th>
                <th>{t("fpo.contributedVolume", "Pooled Volume")}</th>
                <th>{t("offers.totalValue", "Expected Realization")}</th>
              </tr>
            </thead>
            <tbody>
              {membersList.map((f) => (
                <tr key={f.name}>
                  <td>
                    <strong>{f.name}</strong>
                  </td>
                  <td>{f.crop}</td>
                  <td>
                    <span className="badge-pill badge-high">{f.grade}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{f.quantityKg.toLocaleString("en-IN")} kg</td>
                  <td style={{ fontWeight: 700, color: "var(--green-deep)" }}>
                    ₹{(f.quantityKg * 30).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aggregation Tab */}
      {activeTab === "aggregation" && (
        <div className="flex-col gap-md">
          <div className="card card-pad" style={{ background: "#FFFFFF" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
              {t("fpo.collectionCenters", "Regional Collection & Aggregation Centers")}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <div style={{ padding: "12px", background: "var(--bg-warm)", borderRadius: 10, border: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Dindori Primary Collection Hub</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Capacity: 20,000 kg · Active Intake</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)", marginTop: 4 }}>
                  Current Pool: 8,400 kg (Grapes, Tomato)
                </div>
              </div>

              <div style={{ padding: "12px", background: "var(--bg-warm)", borderRadius: 10, border: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Niphad Aggregation Point</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Capacity: 15,000 kg · Cold Storage Link</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)", marginTop: 4 }}>
                  Current Pool: 5,200 kg (Onion, Grapes)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deals Tab */}
      {activeTab === "deals" && (
        <div className="card card-pad" style={{ background: "#FFFFFF" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            {t("fpo.organizationDeals", "Active Organization Contracts & Tenders")}
          </h3>
          <div className="flex-col gap-sm">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px",
                background: "var(--bg-warm)",
                borderRadius: 10,
                border: "1px solid var(--line)",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>FreshFarm Foods Procurement Deal #FPO-9848</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                  5,000 kg Grapes (Grade A) · Agreed Rate: ₹65.00/kg · Total: ₹3,25,000
                </div>
              </div>
              <Link to="/transactions" className="btn btn-secondary btn-sm">
                <span>{t("transactions.timeline", "View Deal Timeline")}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {newMemberModal && (
        <div className="modal-backdrop" onClick={() => setNewMemberModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 460, borderRadius: 16, padding: 24, background: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
              {t("fpo.addMemberTitle", "Add Contributing Member Farmer")}
            </h3>
            <form onSubmit={handleAddMember} className="flex-col gap-sm">
              <div className="field">
                <label>{t("auth.fullName", "Farmer Name")}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh Kale"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>{t("lots.crop", "Crop")}</label>
                <select
                  className="form-control"
                  value={newMemberCrop}
                  onChange={(e) => setNewMemberCrop(e.target.value)}
                >
                  <option value="Grapes">Grapes</option>
                  <option value="Onion">Onion</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Paddy">Paddy</option>
                  <option value="Soybean">Soybean</option>
                </select>
              </div>

              <div className="field">
                <label>{t("fpo.contributedVolume", "Committed Quantity (kg)")}</label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  className="form-control"
                  value={newMemberQty}
                  onChange={(e) => setNewMemberQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex gap-sm" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setNewMemberModal(false)}
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {t("fpo.saveMember", "Save Member")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FPOPage;
