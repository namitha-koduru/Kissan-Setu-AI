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
        <div className="mb-md" style={{ paddingTop: 10 }}>
          <Link
            to="/lots"
            className="back-link"
          >
            <ArrowLeft size={14} /> Back to My Lots
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-md">
            <span className="page-tag">
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
          title="Refresh offers"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="filter-row mb-lg">
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
