import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ShieldCheck,
  Users,
  Layers,
  ShoppingBag,
  ArrowRight,
  Handshake,
  Package,
  History,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { fpoFarmers } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { inventoryApi, type InventorySummaryResponse, type StockAuditAdjustment } from "../services/inventoryApi";

export function FPOPage() {
  const { user } = useAuth();
  const { lots, showToast } = useAppState();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const activeTabParam = params.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "stock" | "members" | "aggregation" | "deals">(
    (activeTabParam as any) || "overview",
  );

  const [membersList, setMembersList] = useState(fpoFarmers);
  const [newMemberModal, setNewMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberCrop, setNewMemberCrop] = useState("Grapes");
  const [newMemberQty, setNewMemberQty] = useState(500);

  // Stock / Inventory state
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryResponse | null>(null);
  const [auditHistory, setAuditHistory] = useState<StockAuditAdjustment[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Offline Sale Modal
  const [offlineSaleModal, setOfflineSaleModal] = useState(false);
  const [offlineCrop, setOfflineCrop] = useState("Grapes");
  const [offlineQty, setOfflineQty] = useState<number | string>(120);
  const [offlineCustomer, setOfflineCustomer] = useState("");
  const [offlineNotes, setOfflineNotes] = useState("");
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);

  const fetchStockData = async () => {
    setLoadingStock(true);
    try {
      const summary = await inventoryApi.getSummary(1);
      setInventorySummary(summary);
      const audit = await inventoryApi.getAuditHistory(1, 30);
      setAuditHistory(audit);
    } catch (err) {
      console.warn("Could not fetch stock summary:", err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const memberCount = user?.memberFarmerCount || 850;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const qty = Number(newMemberQty) || 500;

    // 1. Record aggregation in Neon PostgreSQL database
    try {
      await inventoryApi.recordAggregation({
        fpo_id: 1,
        crop_name: newMemberCrop,
        quantity: qty,
        member_name: newMemberName.trim(),
        notes: `Aggregated ${qty} kg of ${newMemberCrop} from ${newMemberName.trim()}.`,
      });
      showToast(`Aggregated ${qty} kg of ${newMemberCrop} into FPO available inventory.`);
      fetchStockData();
    } catch (err: any) {
      console.warn("Error recording member aggregation in backend:", err);
    }

    setMembersList((prev) => [
      ...prev,
      {
        name: `${newMemberName.trim()} (${user?.district || "Nashik"})`,
        quantityKg: qty,
        crop: newMemberCrop,
        grade: "Grade A",
      },
    ]);
    setNewMemberName("");
    setNewMemberModal(false);
  };

  const handleRecordOfflineSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfflineError(null);
    const qty = parseFloat(String(offlineQty));
    if (isNaN(qty) || qty <= 0) {
      setOfflineError("Please enter a valid sale quantity greater than 0.");
      return;
    }

    setOfflineSubmitting(true);
    try {
      const res = await inventoryApi.recordOfflineSale({
        farmer_id: 1,
        crop_name: offlineCrop,
        quantity: qty,
        customer_name: offlineCustomer.trim() || undefined,
        notes: offlineNotes.trim() || undefined,
      });

      showToast(res.message || `Recorded offline sale of ${qty} kg ${offlineCrop}.`);
      setOfflineSaleModal(false);
      setOfflineCustomer("");
      setOfflineNotes("");
      fetchStockData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to record offline sale.";
      setOfflineError(msg);
    } finally {
      setOfflineSubmitting(false);
    }
  };

  const fpoLots = useMemo(() => {
    return lots.filter((l) => l.aggregated || l.farmerCount || true);
  }, [lots]);

  // Derived stock numbers
  const totalStockKg = inventorySummary?.total_stock ?? 1850;
  const availableStockKg = inventorySummary?.available_to_sell ?? 925;
  const activeLotsKg = inventorySummary?.in_active_lots ?? 600;
  const reservedKg = inventorySummary?.reserved ?? 200;
  const soldKg = inventorySummary?.sold ?? 725;

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
              "Aggregate smallholder produce, manage live stock availability, list bulk lots, and fulfill institutional orders.",
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
            onClick={() => setOfflineSaleModal(true)}
            style={{ color: "var(--sell)", borderColor: "var(--sell)" }}
          >
            <TrendingDown size={16} /> {t("fpo.recordOfflineSale", "Record Offline Sale")}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setNewMemberModal(true)}
          >
            <Users size={16} /> {t("fpo.addMember", "Pool Member")}
          </button>
        </div>
      </div>

      {/* Stock / Available Inventory 5-Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="metric-card" style={{ borderLeft: "4px solid var(--navy)" }}>
          <div className="metric-label flex flex-between">
            <span>{t("fpo.totalStock", "Total Stock")}</span>
            <Layers size={16} color="var(--navy)" />
          </div>
          <div className="metric-value">{totalStockKg.toLocaleString("en-IN")} kg</div>
          <div className="metric-hint">Aggregated harvest pool</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--green-deep)", background: "rgba(23,107,69,0.04)" }}>
          <div className="metric-label flex flex-between">
            <span style={{ fontWeight: 800, color: "var(--green-deep)" }}>Available to Sell</span>
            <CheckCircle2 size={16} color="var(--green-deep)" />
          </div>
          <div className="metric-value" style={{ color: "var(--green-deep)" }}>
            {availableStockKg.toLocaleString("en-IN")} kg
          </div>
          <div className="metric-hint">Genuine uncommitted stock</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #D97706" }}>
          <div className="metric-label flex flex-between">
            <span>In Active Lots</span>
            <Package size={16} color="#D97706" />
          </div>
          <div className="metric-value" style={{ color: "#D97706" }}>
            {activeLotsKg.toLocaleString("en-IN")} kg
          </div>
          <div className="metric-hint">Listed for open offers</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #4F46E5" }}>
          <div className="metric-label flex flex-between">
            <span>Reserved</span>
            <Handshake size={16} color="#4F46E5" />
          </div>
          <div className="metric-value" style={{ color: "#4F46E5" }}>
            {reservedKg.toLocaleString("en-IN")} kg
          </div>
          <div className="metric-hint">Committed to accepted trades</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #64748B" }}>
          <div className="metric-label flex flex-between">
            <span>Sold Produce</span>
            <ShoppingBag size={16} color="#64748B" />
          </div>
          <div className="metric-value" style={{ color: "#64748B" }}>
            {soldKg.toLocaleString("en-IN")} kg
          </div>
          <div className="metric-hint">Completed & offline sales</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="status-tabs mb-lg">
        <div
          className={`status-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          {t("fpo.tabOverview", "Organization Overview")}
        </div>
        <div
          className={`status-tab ${activeTab === "stock" ? "active" : ""}`}
          onClick={() => setActiveTab("stock")}
        >
          📦 Stock & Inventory
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

      {/* OVERVIEW TAB */}
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

      {/* STOCK & INVENTORY TAB */}
      {activeTab === "stock" && (
        <div className="flex-col gap-lg">
          {/* Produce Inventory Breakdown */}
          <div className="card card-pad table-scroll" style={{ background: "#FFFFFF" }}>
            <div className="flex flex-between flex-center mb-md">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Produce Inventory by Commodity</h3>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
                  Real-time stock ledger persisted in Neon PostgreSQL
                </div>
              </div>
              <div className="flex gap-xs">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setOfflineSaleModal(true)}
                  style={{ color: "var(--sell)", borderColor: "var(--sell)" }}
                >
                  <TrendingDown size={14} /> Record Offline Sale
                </button>
                <Link className="btn btn-primary btn-sm" to="/lots/create">
                  <Plus size={14} /> Create Bulk Lot
                </Link>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Commodity / Variety</th>
                  <th>Total Stock</th>
                  <th>In Active Lots</th>
                  <th>Reserved (Orders)</th>
                  <th>Sold</th>
                  <th>Available to Sell</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingStock && !inventorySummary ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "var(--ink-soft)" }}>
                      Loading stock ledger from PostgreSQL database...
                    </td>
                  </tr>
                ) : inventorySummary?.items && inventorySummary.items.length > 0 ? (
                  inventorySummary.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.crop_name}</strong>
                        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{item.variety || "Standard Grade"}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.total_quantity.toLocaleString("en-IN")} {item.unit}</td>
                      <td style={{ color: "#D97706", fontWeight: 700 }}>{item.allocated_quantity.toLocaleString("en-IN")} {item.unit}</td>
                      <td style={{ color: "#4F46E5", fontWeight: 700 }}>{item.reserved_quantity.toLocaleString("en-IN")} {item.unit}</td>
                      <td style={{ color: "#64748B", fontWeight: 700 }}>{item.sold_quantity.toLocaleString("en-IN")} {item.unit}</td>
                      <td>
                        <span
                          className="badge-pill badge-high"
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            background: item.available_quantity > 0 ? "rgba(23,107,69,0.12)" : "#FEE2E2",
                            color: item.available_quantity > 0 ? "var(--green-deep)" : "#991B1B",
                          }}
                        >
                          {item.available_quantity.toLocaleString("en-IN")} {item.unit}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/lots/create?crop=${encodeURIComponent(item.crop_name)}&qty=${item.available_quantity}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11.5, padding: "4px 8px" }}
                        >
                          List Lot
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td><strong>Grapes (Export Grade)</strong></td>
                    <td>1,200 kg</td>
                    <td style={{ color: "#D97706" }}>400 kg</td>
                    <td style={{ color: "#4F46E5" }}>200 kg</td>
                    <td>250 kg</td>
                    <td><span className="badge-pill badge-high">350 kg</span></td>
                    <td><Link to="/lots/create?crop=Grapes" className="btn btn-outline btn-sm">List Lot</Link></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stock Activity & Audit History */}
          <div className="card card-pad table-scroll" style={{ background: "#FFFFFF" }}>
            <div className="flex flex-between flex-center mb-md">
              <div className="flex flex-center gap-xs">
                <History size={18} color="var(--green-deep)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Stock Activity & Audit Ledger</h3>
              </div>
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Chronological stock adjustments</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Commodity</th>
                  <th>Adjustment Type</th>
                  <th>Quantity</th>
                  <th>Customer / Party</th>
                  <th>Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                {auditHistory.length > 0 ? (
                  auditHistory.map((adj) => (
                    <tr key={adj.id}>
                      <td style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {new Date(adj.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td><strong>{adj.crop_name}</strong></td>
                      <td>
                        <span
                          className={`badge-pill ${
                            adj.adjustment_type.includes("SALE") || adj.adjustment_type.includes("COMPLETED")
                              ? "badge-danger"
                              : adj.adjustment_type.includes("AGGREGATION") || adj.adjustment_type.includes("RELEASE")
                              ? "badge-high"
                              : "badge-medium"
                          }`}
                          style={{ fontSize: 11 }}
                        >
                          {adj.adjustment_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 800,
                          color: adj.quantity < 0 ? "var(--danger)" : "var(--green-deep)",
                        }}
                      >
                        {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity} {adj.unit}
                      </td>
                      <td>{adj.customer_name || "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--ink-soft)" }}>{adj.notes || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-soft)", padding: 20 }}>
                      No adjustments logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="card card-pad table-scroll" style={{ background: "#FFFFFF" }}>
          <div className="flex flex-between flex-center mb-md">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              {t("fpo.contributingFarmers", "Registered Smallholder Members")}
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setNewMemberModal(true)}>
              <Plus size={14} /> {t("fpo.addMember", "Pool Member Produce")}
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

      {/* AGGREGATION TAB */}
      {activeTab === "aggregation" && (
        <div className="flex-col gap-md">
          <div className="card card-pad" style={{ background: "#FFFFFF" }}>
            <div className="flex flex-between flex-center mb-sm">
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                {t("fpo.collectionCenters", "Regional Collection & Aggregation Centers")}
              </h3>
              <Link to="/lots/create" className="btn btn-primary btn-sm">
                <Plus size={14} /> Create Aggregated Bulk Lot
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              <div style={{ padding: "14px", background: "var(--bg-warm)", borderRadius: 10, border: "1px solid var(--line)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Dindori Primary Collection Hub</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Capacity: 20,000 kg · Active Intake</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)", marginTop: 4 }}>
                    Current Pool: 8,400 kg (Grapes, Tomato)
                  </div>
                </div>
                <Link
                  to="/lots/create?crop=Grapes&qty=8400&price=65"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                >
                  <Package size={14} /> Convert Pool to Bulk Lot
                </Link>
              </div>

              <div style={{ padding: "14px", background: "var(--bg-warm)", borderRadius: 10, border: "1px solid var(--line)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Niphad Aggregation Point</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Capacity: 15,000 kg · Cold Storage Link</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)", marginTop: 4 }}>
                    Current Pool: 5,200 kg (Onion, Grapes)
                  </div>
                </div>
                <Link
                  to="/lots/create?crop=Onion&qty=5200&price=22"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                >
                  <Package size={14} /> Convert Pool to Bulk Lot
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEALS TAB */}
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

      {/* RECORD OFFLINE SALE MODAL */}
      {offlineSaleModal && (
        <div className="modal-backdrop" onClick={() => setOfflineSaleModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 460, borderRadius: 16, padding: 24, background: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-between flex-center mb-md">
              <div className="flex flex-center gap-xs">
                <TrendingDown size={20} color="var(--sell)" />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Record Offline Sale</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setOfflineSaleModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
              Deduct inventory for direct local, mandi, or offline sales. Updates available stock and logs an audit transaction.
            </p>

            <form onSubmit={handleRecordOfflineSale} className="flex-col gap-sm">
              <div className="field">
                <label>Commodity / Crop <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={offlineCrop}
                  onChange={(e) => setOfflineCrop(e.target.value)}
                  required
                >
                  <option value="Grapes">Grapes</option>
                  <option value="Onion">Onion</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Soybean">Soybean</option>
                </select>
              </div>

              <div className="field">
                <label>Sold Quantity (kg) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={offlineQty}
                  onChange={(e) => setOfflineQty(e.target.value)}
                  placeholder="e.g. 120"
                  required
                />
              </div>

              <div className="field">
                <label>Customer / Buyer Name (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={offlineCustomer}
                  onChange={(e) => setOfflineCustomer(e.target.value)}
                  placeholder="e.g. Local Mandi Trader / Walk-in Buyer"
                />
              </div>

              <div className="field">
                <label>Notes / Sale Reason (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="e.g. Direct sale at gate / Mandi cash clearance"
                />
              </div>

              {offlineError && (
                <div
                  className="form-error-alert"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#FEE2E2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <AlertCircle size={15} style={{ display: "inline", marginRight: 4 }} />
                  {offlineError}
                </div>
              )}

              <div className="flex gap-sm" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setOfflineSaleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={offlineSubmitting}
                >
                  {offlineSubmitting ? "Deducting..." : "Record & Deduct Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {newMemberModal && (
        <div className="modal-backdrop" onClick={() => setNewMemberModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 460, borderRadius: 16, padding: 24, background: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
              {t("fpo.addMemberTitle", "Pool Contributing Member Produce")}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 14 }}>
              Adding member harvest volume immediately increases FPO total and available sellable stock in PostgreSQL.
            </p>
            <form onSubmit={handleAddMember} className="flex-col gap-sm">
              <div className="field">
                <label>{t("auth.fullName", "Farmer Name")} <span className="required">*</span></label>
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
                <label>{t("lots.crop", "Crop")} <span className="required">*</span></label>
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
                <label>{t("fpo.contributedVolume", "Committed Quantity (kg)")} <span className="required">*</span></label>
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  className="form-control"
                  value={newMemberQty}
                  onChange={(e) => setNewMemberQty(parseFloat(e.target.value) || 0)}
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
                  Pool Produce into Stock
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
