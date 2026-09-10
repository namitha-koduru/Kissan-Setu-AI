import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { OfferIntelligenceCard } from "../components/OfferIntelligenceCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth, resolveFarmerId } from "../context/AuthContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { OfferRecord } from "../types";
import apiClient from "../services/api";

export function OffersPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { offers: localOffers, transaction: localTx } = useAppState();
  const { t } = useLanguage();

  const lotFilter = params.get("lot");
  const tabParam = params.get("tab") || "offers";
  const [activeTab, setActiveTab] = useState<"offers" | "negotiations" | "active_orders" | "previous_orders">(
    (tabParam as any) || "offers"
  );

  const [offersList, setOffersList] = useState<OfferRecord[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const activeFarmerId = resolveFarmerId(user);
      const [offRes, txRes] = await Promise.allSettled([
        apiClient.get<any[]>("/offers"),
        apiClient.get<any[]>(activeFarmerId ? `/transactions?farmer_id=${activeFarmerId}` : "/transactions"),
      ]);

      if (offRes.status === "fulfilled" && Array.isArray(offRes.value) && offRes.value.length > 0) {
        const mapped: OfferRecord[] = offRes.value.map((o: any) => ({
          id: `off-${o.id}`,
          lotId: `KS-2026-00${o.lot_id}`,
          buyerName: o.buyer?.name || "Institutional Procurer",
          verified: o.buyer?.verified ?? true,
          pricePerKg: o.offered_price,
          quantityKg: o.quantity_kg || (localOffers[0]?.quantityKg || 500),
          quality: o.quality_grade || "Grade A",
          expiresInDays: "2 days",
          status: o.status === "COUNTERED" ? "Countered" : o.status === "ACCEPTED" ? "Accepted" : o.status === "REJECTED" ? "Rejected" : "Pending",
        }));
        setOffersList(mapped);
      } else {
        setOffersList(localOffers);
      }

      if (txRes.status === "fulfilled" && Array.isArray(txRes.value)) {
        setTransactionsList(txRes.value);
      }
    } catch (err) {
      console.warn("Using local offers state", err);
      setOffersList(localOffers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [localOffers, user?.id]);

  const displayedOffers = offersList
    .filter((o) => (!lotFilter ? true : o.lotId === lotFilter || o.lotId.includes(lotFilter)))
    .filter((o) => {
      if (activeTab === "negotiations") return o.status === "Countered";
      if (activeTab === "offers") {
        if (statusFilter === "ALL") return true;
        return o.status.toUpperCase() === statusFilter;
      }
      return true;
    });

  const activeOrders = transactionsList.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "RECEIVED" && t.status !== "CANCELLED"
  );
  const previousOrders = transactionsList.filter(
    (t) => t.status === "COMPLETED" || t.status === "RECEIVED"
  );

  return (
    <div className="wrap" style={{ maxWidth: 780, paddingBottom: 60 }}>
      {/* Breadcrumb if filtered by lot */}
      {lotFilter && (
        <div className="mb-md" style={{ paddingTop: 10 }}>
          <Link
            to="/lots"
            className="back-link"
          >
            <ArrowLeft size={14} /> {t("common.back", "Back to My Lots")}
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-xs mb-xs">
            <span className="badge-pill badge-high">
              🤝 {t("offers.dealsCenter", "Deals & Contracts Center")}
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
            {t("offers.title", "Offers, Negotiations & Orders")}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {lotFilter ? (
              <>
                Active buyer bids and negotiation threads for <strong>Lot {lotFilter}</strong>
              </>
            ) : (
              t("offers.subtitle", "Review purchase offers, manage price negotiations, and track fulfillment orders.")
            )}
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={loadData}
          title={t("common.loading", "Refresh data")}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* 4 Unified Deals Tabs */}
      <div className="status-tabs mb-lg">
        <button
          type="button"
          className={`status-tab ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => setActiveTab("offers")}
        >
          📩 {t("offers.tabOffers", "Buyer Offers")} ({offersList.length})
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "negotiations" ? "active" : ""}`}
          onClick={() => setActiveTab("negotiations")}
        >
          💬 {t("offers.tabNegotiations", "Negotiations")} ({offersList.filter((o) => o.status === "Countered").length})
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "active_orders" ? "active" : ""}`}
          onClick={() => setActiveTab("active_orders")}
        >
          🚚 {t("offers.tabActiveOrders", "Active Orders")} ({activeOrders.length > 0 ? activeOrders.length : (localTx?.quantityKg ? 1 : 0)})
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "previous_orders" ? "active" : ""}`}
          onClick={() => setActiveTab("previous_orders")}
        >
          📜 {t("offers.tabPreviousOrders", "Previous Orders")} ({previousOrders.length})
        </button>
      </div>

      {/* Sub-Filters for Offers Tab */}
      {activeTab === "offers" && (
        <div className="filter-row mb-lg">
          <div
            className={`filter-chip ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            {t("common.all", "All")} ({offersList.length})
          </div>
          <div
            className={`filter-chip ${statusFilter === "PENDING" ? "active" : ""}`}
            onClick={() => setStatusFilter("PENDING")}
          >
            {t("offers.status", "Pending Action")}
          </div>
          <div
            className={`filter-chip ${statusFilter === "ACCEPTED" ? "active" : ""}`}
            onClick={() => setStatusFilter("ACCEPTED")}
          >
            {t("offers.accept", "Accepted & Contracted")}
          </div>
          <div
            className={`filter-chip ${statusFilter === "COUNTERED" ? "active" : ""}`}
            onClick={() => setStatusFilter("COUNTERED")}
          >
            {t("offers.counter", "In Negotiation")}
          </div>
        </div>
      )}

      {/* OFFERS & NEGOTIATIONS VIEW */}
      {(activeTab === "offers" || activeTab === "negotiations") && (
        <div>
          {displayedOffers.length === 0 ? (
            <EmptyState
              title={
                activeTab === "negotiations"
                  ? "No Active Negotiations"
                  : statusFilter === "ALL"
                  ? t("offers.waitingOffers", "Waiting for Buyer Offers")
                  : t("offers.noOffers", "No offers matching criteria")
              }
              text={
                activeTab === "negotiations"
                  ? "When you or a buyer sends a price counter-offer, the live negotiation chat appears here."
                  : t(
                      "offers.subtitle",
                      "Your published lots are visible to verified buyers in your district. Direct price bids and procurement terms will appear here once submitted."
                    )
              }
              action={
                <Link className="btn btn-outline" to="/buyers">
                  {t("nav.buyers", "View Verified Buyers in Area")}
                </Link>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {displayedOffers.map((o) => (
                <OfferIntelligenceCard
                  key={o.id}
                  offer={o}
                  onOfferUpdated={() => loadData()}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE ORDERS VIEW */}
      {activeTab === "active_orders" && (
        <div>
          {activeOrders.length === 0 && (!localTx || localTx.quantityKg === 0) ? (
            <EmptyState
              title="No Active In-Flight Orders"
              text="When you accept an offer, logistics tracking, pickup schedule, and settlement status are generated."
              action={
                <Link className="btn btn-primary" to="/lots/create">
                  Create Produce Lot
                </Link>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="card card-pad"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    cursor: "pointer",
                    border: "1.5px solid var(--line)",
                    borderRadius: 14,
                  }}
                  onClick={() => navigate(`/transactions?id=${ord.id}`)}
                >
                  <div>
                    <div className="flex flex-center gap-xs mb-xs">
                      <span className="badge-pill badge-high" style={{ fontSize: 11 }}>
                        🚚 {ord.status || "PICKUP_SCHEDULED"}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Deal #{ord.id}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>
                      {ord.crop_name} · {ord.quantity_kg} kg @ ₹{ord.final_price}/kg
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
                      Buyer: <strong>{ord.buyer_name}</strong> · Settlement: ₹{(ord.total_amount || ord.quantity_kg * ord.final_price).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="flex flex-center gap-sm">
                    <Link to={`/transactions?id=${ord.id}`} className="btn btn-primary btn-sm">
                      Track Deal & Logistics →
                    </Link>
                  </div>
                </div>
              ))}

              {/* Local Tx fallback if no DB active orders */}
              {activeOrders.length === 0 && localTx && localTx.quantityKg > 0 && (
                <div
                  className="card card-pad"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    border: "1.5px solid var(--line)",
                    borderRadius: 14,
                  }}
                >
                  <div>
                    <div className="flex flex-center gap-xs mb-xs">
                      <span className="badge-pill badge-high" style={{ fontSize: 11 }}>
                        🚚 IN PROGRESS
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>
                      {localTx.crop} · {localTx.quantityKg} kg @ ₹{localTx.pricePerKg}/kg
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
                      Buyer: <strong>{localTx.buyerName}</strong> · Settlement: ₹{(localTx.quantityKg * localTx.pricePerKg).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <Link to="/transactions" className="btn btn-primary btn-sm">
                    Track Deal & Logistics →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PREVIOUS ORDERS VIEW */}
      {activeTab === "previous_orders" && (
        <div>
          {previousOrders.length === 0 ? (
            <EmptyState
              title="No Completed Orders Yet"
              text="Fulfilled orders with completed digital receipts and payment settlement logs will appear here."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {previousOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="card card-pad"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    cursor: "pointer",
                    borderRadius: 14,
                  }}
                  onClick={() => navigate(`/transactions?id=${ord.id}`)}
                >
                  <div>
                    <div className="flex flex-center gap-xs mb-xs">
                      <span className="badge-pill" style={{ background: "#E6F4EA", color: "var(--green-deep)", fontSize: 11, fontWeight: 800 }}>
                        ✓ {ord.status}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Deal #{ord.id}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>
                      {ord.crop_name} · {ord.quantity_kg} kg @ ₹{ord.final_price}/kg
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                      Buyer: {ord.buyer_name} · Payout: ₹{(ord.total_amount || ord.quantity_kg * ord.final_price).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="flex flex-center gap-sm">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)" }}>
                      View Receipt →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OffersPage;

