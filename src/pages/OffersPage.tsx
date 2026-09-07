import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { OfferIntelligenceCard } from "../components/OfferIntelligenceCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { OfferRecord } from "../types";
import apiClient from "../services/api";

export function OffersPage() {
  const [params] = useSearchParams();
  const { offers: localOffers } = useAppState();
  const { t } = useLanguage();

  const lotFilter = params.get("lot");
  const [offersList, setOffersList] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any[]>("/offers");
      if (res && res.length > 0) {
        const mapped: OfferRecord[] = res.map((o: any) => ({
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
            <ArrowLeft size={14} /> {t("common.back", "Back to My Lots")}
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-md">
            <span className="page-tag">
              KissanSetu Offers
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>{t("offers.title", "Buyer Offers & Negotiations")}</h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {lotFilter ? (
              <>
                Active buyer bids and negotiation threads for <strong>Lot {lotFilter}</strong>
              </>
            ) : (
              t("offers.subtitle", "Review purchase offers, compare against mandi benchmarks, and negotiate")
            )}
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={loadOffers}
          title={t("common.loading", "Refresh offers")}
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

      {/* Offers List */}
      <div>
        {displayedOffers.length === 0 ? (
          <EmptyState
            title={statusFilter === "ALL" ? t("offers.waitingOffers", "Waiting for Buyer Offers") : t("offers.noOffers", "No offers matching criteria")}
            text={t("offers.subtitle", "Your published lots are visible to verified buyers in your district. Direct price bids and procurement terms will appear here once submitted.")}
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
