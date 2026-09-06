import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { OfferIntelligenceCard } from "../components/OfferIntelligenceCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { OfferRecord } from "../types";
import apiClient from "../services/api";

export function OffersPage() {
  const [params] = useSearchParams();
  const { offers: localOffers } = useAppState();

  const lotFilter = params.get("lot");
  const [offersList, setOffersList] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadOffers = async () => {
    try {
      setLoading(true);
      // Try to load from backend
      const res = await apiClient.get<any[]>("/offers");
      if (res && res.length > 0) {
        const mapped: OfferRecord[] = res.map((o: any) => ({
          id: `off-${o.id}`,
          lotId: `KS-2026-00${o.lot_id}`,
          buyerName: o.buyer?.name || "Institutional Procurer",
          verified: o.buyer?.verified ?? true,
          pricePerKg: o.offered_price,
          quantityKg: o.quantity_kg || 1500,
          quality: o.quality_grade || "Grade A",
          expiresInDays: "2 days",
          status: o.status === "COUNTERED" ? "Countered" : o.status === "ACCEPTED" ? "Accepted" : o.status === "REJECTED" ? "Rejected" : "Pending",
        }));
        setOffersList(mapped);
      } else {
        setOffersList(localOffers);
      }
    } catch (err) {
      console.warn("Using local offers state", err);
      setOffersList(localOffers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [localOffers]);

  const displayedOffers = offersList
    .filter((o) => (!lotFilter ? true : o.lotId === lotFilter || o.lotId.includes(lotFilter)))
    .filter((o) => (statusFilter === "ALL" ? true : o.status.toUpperCase() === statusFilter));

  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      {/* Breadcrumb if filtered by lot */}
      {lotFilter && (
        <div style={{ marginBottom: 10, paddingTop: 10 }}>
          <Link
            to="/lots"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}
          >
            <ArrowLeft size={14} /> Back to My Lots
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 0 14px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                background: "var(--green-soft)",
                color: "var(--green-deep)",
                padding: "2px 8px",
                borderRadius: "6px",
                textTransform: "uppercase",
              }}
            >
              Phase 6 Offer Intelligence
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>Buyer Offers & Negotiations</h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {lotFilter ? (
              <>
                Active buyer bids and negotiation threads for <strong>Lot {lotFilter}</strong>
              </>
            ) : (
              "Review, compare against APMC mandi rates, accept, or AI-counter incoming procurement offers."
            )}
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={loadOffers}
          style={{ padding: "8px 12px" }}
          title="Refresh offers"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="filter-row" style={{ marginBottom: 16 }}>
        <div
          className={`filter-chip ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => setStatusFilter("ALL")}
        >
          All Offers ({offersList.length})
        </div>
        <div
          className={`filter-chip ${statusFilter === "PENDING" ? "active" : ""}`}
          onClick={() => setStatusFilter("PENDING")}
        >
          Pending Action
        </div>
        <div
          className={`filter-chip ${statusFilter === "ACCEPTED" ? "active" : ""}`}
          onClick={() => setStatusFilter("ACCEPTED")}
        >
          Accepted & Contracted
        </div>
        <div
          className={`filter-chip ${statusFilter === "COUNTERED" ? "active" : ""}`}
          onClick={() => setStatusFilter("COUNTERED")}
        >
          In Negotiation
        </div>
      </div>

      {/* Offers List */}
      <div>
        {displayedOffers.length === 0 ? (
          <EmptyState
            title="No offers matching criteria"
            text="When institutional buyers inspect your published lots, their price bids and procurement terms will show up here."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {displayedOffers.map((o) => (
              <OfferIntelligenceCard
                key={o.id}
                offer={o}
                onOfferUpdated={() => loadOffers()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OffersPage;
